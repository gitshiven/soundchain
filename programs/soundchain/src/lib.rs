use anchor_lang::prelude::*;

declare_id!("Bnuq1snxvTd8oMVx1Spf588QoPUJmGxME5yYURawssmu");

#[program]
pub mod soundchain {
    use super::*;

    pub fn create_challenge(
    ctx: Context<CreateChallenge>,
    title: String,
    description: String,
    bounty: u64,
) -> Result<()> {
    // Transfer bounty first before borrowing challenge
    let cpi_context = CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        anchor_lang::system_program::Transfer {
            from: ctx.accounts.composer.to_account_info(),
            to: ctx.accounts.challenge.to_account_info(),
        },
    );
    anchor_lang::system_program::transfer(cpi_context, bounty)?;

    // Now borrow challenge mutably
    let challenge = &mut ctx.accounts.challenge;
    challenge.composer = ctx.accounts.composer.key();
    challenge.title = title;
    challenge.description = description;
    challenge.bounty = bounty;
    challenge.is_open = true;
    challenge.winner = None;

    msg!("Challenge created: {}", challenge.title);
    Ok(())
}

    pub fn submit_version(
        ctx: Context<SubmitVersion>,
        audio_cid: String,
    ) -> Result<()> {
        let submission = &mut ctx.accounts.submission;
        submission.challenge = ctx.accounts.challenge.key();
        submission.producer = ctx.accounts.producer.key();
        submission.audio_cid = audio_cid;
        submission.is_winner = false;

        msg!("Submission received from: {}", submission.producer);
        Ok(())
    }

    pub fn select_winner(
        ctx: Context<SelectWinner>,
    ) -> Result<()> {
        let challenge = &mut ctx.accounts.challenge;
        let submission = &mut ctx.accounts.submission;

        require!(challenge.is_open, SoundchainError::ChallengeAlreadyClosed);
        require!(
            challenge.composer == ctx.accounts.composer.key(),
            SoundchainError::NotComposer
        );

        // Calculate splits
        let total = challenge.bounty;
        let producer_share = total * 70 / 100;  // 70% to producer
        let platform_share = total * 20 / 100;  // 20% to platform
        let composer_share = total - producer_share - platform_share; // 10% back

        // Pay producer
        **challenge.to_account_info().try_borrow_mut_lamports()? -= producer_share;
        **ctx.accounts.producer.to_account_info().try_borrow_mut_lamports()? += producer_share;

        // Pay platform
        **challenge.to_account_info().try_borrow_mut_lamports()? -= platform_share;
        **ctx.accounts.platform.to_account_info().try_borrow_mut_lamports()? += platform_share;

        // Return remainder to composer
        **challenge.to_account_info().try_borrow_mut_lamports()? -= composer_share;
        **ctx.accounts.composer.to_account_info().try_borrow_mut_lamports()? += composer_share;

        submission.is_winner = true;
        challenge.winner = Some(submission.producer);
        challenge.is_open = false;

        msg!("Winner selected! Producer gets {} lamports", producer_share);
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(title: String, description: String, bounty: u64)]
pub struct CreateChallenge<'info> {
    #[account(
        init,
        payer = composer,
        space = 8 + 32 + 4 + 100 + 4 + 200 + 8 + 1 + 33,
    )]
    pub challenge: Account<'info, Challenge>,
    #[account(mut)]
    pub composer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SubmitVersion<'info> {
    #[account(
        init,
        payer = producer,
        space = 8 + 32 + 32 + 4 + 100 + 1,
    )]
    pub submission: Account<'info, Submission>,
    #[account(mut)]
    pub challenge: Account<'info, Challenge>,
    #[account(mut)]
    pub producer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SelectWinner<'info> {
    #[account(mut)]
    pub challenge: Account<'info, Challenge>,
    #[account(mut)]
    pub submission: Account<'info, Submission>,
    #[account(mut)]
    pub composer: Signer<'info>,
    /// CHECK: platform wallet
    #[account(mut)]
    pub producer: AccountInfo<'info>,
    /// CHECK: platform wallet
    #[account(mut)]
    pub platform: AccountInfo<'info>,
}

#[account]
pub struct Challenge {
    pub composer: Pubkey,
    pub title: String,
    pub description: String,
    pub bounty: u64,
    pub is_open: bool,
    pub winner: Option<Pubkey>,
}

#[account]
pub struct Submission {
    pub challenge: Pubkey,
    pub producer: Pubkey,
    pub audio_cid: String,
    pub is_winner: bool,
}

#[error_code]
pub enum SoundchainError {
    #[msg("This challenge is already closed")]
    ChallengeAlreadyClosed,
    #[msg("Only the composer can select a winner")]
    NotComposer,
}