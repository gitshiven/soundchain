'use client';
import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';

interface Challenge {
  id: string;
  title: string;
  description: string;
  bounty: number;
  composer_wallet: string;
  winner_wallet: string;
  is_open: boolean;
  created_at: string;
}

interface Submission {
  id: string;
  challenge_id: string;
  producer_wallet: string;
  audio_cid: string;
  note: string;
  is_winner: boolean;
  created_at: string;
}

export default function WinnerPage({ params }: { params: Promise<{ id: string }> }) {
  const { publicKey } = useWallet();
  const router = useRouter();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    async function load() {
      const resolvedParams = await params;
      const { data: ch } = await supabase
        .from('challenges')
        .select('*')
        .eq('id', resolvedParams.id)
        .single();
      if (ch) setChallenge(ch);

      const { data: sub } = await supabase
        .from('submissions')
        .select('*')
        .eq('challenge_id', resolvedParams.id)
        .eq('is_winner', true)
        .single();
      if (sub) setSubmission(sub);

      setLoading(false);
      setTimeout(() => setVisible(true), 100);
    }
    load();
  }, []);

  if (loading) return (
    <div style={{ background: '#000', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Courier New", monospace', color: '#444', letterSpacing: '4px', fontSize: '12px' }}>
      LOADING...
    </div>
  );

  if (!challenge) return (
    <div style={{ background: '#000', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Courier New", monospace', color: '#ff2e00', letterSpacing: '4px', fontSize: '12px', flexDirection: 'column', gap: '24px' }}>
      <div>CHALLENGE NOT FOUND</div>
      <Link href="/browse" style={{ color: '#555', fontSize: '11px', letterSpacing: '3px', textDecoration: 'none' }}>← BACK TO VAULT</Link>
    </div>
  );

  const isActualWinner = publicKey && challenge.winner_wallet === publicKey.toString();

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden', fontFamily: '"Courier New", monospace', color: '#f5f5f5' }}>

      {/* Background image */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'url(/winner-page.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: visible ? 0.65 : 0,
        transition: 'opacity 1.5s ease',
      }} />

      {/* Gradient overlays */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.1) 35%, rgba(0,0,0,0.1) 65%, rgba(0,0,0,0.9) 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(200,130,40,0.06) 0%, transparent 70%)' }} />

      {/* TOP — trophy + YOU WON */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        padding: '40px 48px 0',
        zIndex: 10,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(-20px)',
        transition: 'opacity 1s ease 0.3s, transform 1s ease 0.3s',
      }}>
        <div style={{ fontSize: '10px', letterSpacing: '6px', color: '#c8a96e', marginBottom: '16px' }}>
          ── SOUNDCHAIN · WINNER ──
        </div>
        <div style={{
          fontFamily: '"Arial Black", sans-serif',
          fontSize: 'clamp(64px, 10vw, 130px)',
          fontWeight: '900',
          lineHeight: 0.85,
          letterSpacing: '-4px',
        }}>
          {isActualWinner ? (
            <>
              YOU<br />
              <span style={{ color: 'transparent', WebkitTextStroke: '2px #c8a96e' }}>WON</span>
            </>
          ) : (
            <>
              WINNER<br />
              <span style={{ color: 'transparent', WebkitTextStroke: '2px #c8a96e' }}>CROWNED</span>
            </>
          )}
        </div>
      </div>

      {/* CENTER — SOL amount */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: visible ? 'translate(-50%, -50%)' : 'translate(-50%, -40%)',
        zIndex: 10, textAlign: 'center',
        opacity: visible ? 1 : 0,
        transition: 'opacity 1.2s ease 0.6s, transform 1.2s ease 0.6s',
      }}>
        <div style={{
          fontFamily: '"Arial Black", sans-serif',
          fontSize: 'clamp(52px, 9vw, 108px)',
          color: '#c8a96e',
          letterSpacing: '-2px',
          lineHeight: 1,
          textShadow: '0 0 60px rgba(200,169,110,0.5), 0 0 120px rgba(200,169,110,0.2)',
        }}>
          {(challenge.bounty * 0.7).toFixed(2)} SOL
        </div>
        <div style={{ fontSize: '11px', color: '#888', letterSpacing: '5px', marginTop: '10px' }}>
          {isActualWinner ? 'SENT TO YOUR WALLET' : 'PAID TO PRODUCER'}
        </div>
        <div style={{ fontSize: '12px', color: '#444', letterSpacing: '1px', marginTop: '8px', fontFamily: 'DM Sans, sans-serif' }}>
          {challenge.title.toUpperCase()}
        </div>
      </div>

      {/* BOTTOM — details + buttons */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '0 48px 44px',
        zIndex: 10,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 1s ease 0.9s, transform 1s ease 0.9s',
      }}>

        {/* Winner wallet + challenge info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '10px', color: '#444', letterSpacing: '3px', marginBottom: '4px' }}>WINNING PRODUCER</div>
            <div style={{ fontSize: '13px', color: '#888', fontFamily: '"Courier New", monospace' }}>
              {challenge.winner_wallet?.slice(0, 12)}...{challenge.winner_wallet?.slice(-8)}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '10px', color: '#444', letterSpacing: '3px', marginBottom: '4px' }}>ROYALTY SPLIT</div>
            <div style={{ fontSize: '12px', color: '#555', letterSpacing: '1px', fontFamily: '"Courier New", monospace' }}>
              70% PRODUCER · 20% PLATFORM · 10% COMPOSER
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'linear-gradient(to right, transparent, #333, transparent)', marginBottom: '20px' }} />

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Link href="/browse" style={{
            background: '#f5f5f5', color: '#080808',
            padding: '14px 32px', fontSize: '13px', letterSpacing: '2px',
            fontWeight: '700', textDecoration: 'none', display: 'inline-block',
            fontFamily: '"Courier New", monospace',
          }}>
            BACK TO VAULT
          </Link>
          <Link href="/post-challenge" style={{
            border: '1px solid #333', color: '#f5f5f5',
            padding: '14px 32px', fontSize: '13px', letterSpacing: '2px',
            textDecoration: 'none', display: 'inline-block',
            fontFamily: '"Courier New", monospace',
          }}>
            POST A CHALLENGE →
          </Link>
          <button
            onClick={() => window.history.length > 1 ? router.back() : router.push('/browse')}
            style={{ background: 'none', border: '1px solid #222', color: '#555', padding: '14px 24px', fontSize: '13px', letterSpacing: '2px', fontFamily: '"Courier New", monospace', cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#f5f5f5')}
            onMouseLeave={e => (e.currentTarget.style.color = '#555')}
          >
            ← BACK
          </button>
        </div>
      </div>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>
    </div>
  );
}
