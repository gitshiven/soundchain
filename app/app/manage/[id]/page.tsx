'use client';
import { useState, useRef, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL, Transaction } from '@solana/web3.js';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';

interface Challenge {
  id: string;
  title: string;
  description: string;
  bounty: number;
  composer_wallet: string;
  audio_cid: string;
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

const ACCENTS = ['#c8a96e','#e879f9','#22d3ee','#4ade80','#f97316','#818cf8','#f43f5e','#14b8a6'];

export default function ManageChallenge({ params }: { params: Promise<{ id: string }> }) {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement>(null);

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle'|'signing'|'confirming'|'saving'|'done'|'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [txSig, setTxSig] = useState('');
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    async function load() {
      const resolvedParams = await params;
      const { data: ch } = await supabase.from('challenges').select('*').eq('id', resolvedParams.id).single();
      if (ch) setChallenge(ch);
      const { data: subs } = await supabase.from('submissions').select('*').eq('challenge_id', resolvedParams.id).order('created_at', { ascending: false });
      if (subs) setSubmissions(subs);
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handlePlay = (sub: Submission) => {
    if (!sub.audio_cid) return;
    const url = `https://gateway.pinata.cloud/ipfs/${sub.audio_cid}`;
    if (audioRef.current) {
      if (playingId === sub.id) {
        audioRef.current.pause();
        setPlayingId(null);
      } else {
        audioRef.current.src = url;
        audioRef.current.play();
        setPlayingId(sub.id);
      }
    }
  };

  const handleCrown = async () => {
    if (!publicKey || !challenge || !selectedId) return;
    const winner = submissions.find(s => s.id === selectedId);
    if (!winner) return;

    try {
      setStatus('signing');
      const totalLamports = Math.floor(challenge.bounty * LAMPORTS_PER_SOL);
      const producerLamports = Math.floor(totalLamports * 0.7);
      const composerLamports = Math.floor(totalLamports * 0.1);
      const producerPubkey = new PublicKey(winner.producer_wallet);
      const composerPubkey = new PublicKey(challenge.composer_wallet);

      const transaction = new Transaction();
      transaction.add(
        SystemProgram.transfer({ fromPubkey: publicKey, toPubkey: producerPubkey, lamports: producerLamports }),
        SystemProgram.transfer({ fromPubkey: publicKey, toPubkey: composerPubkey, lamports: composerLamports }),
      );

      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      setStatus('confirming');
      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, 'confirmed');

      setStatus('saving');
      await supabase.from('submissions').update({ is_winner: true }).eq('id', selectedId);
      await supabase.from('challenges').update({ is_open: false, winner_wallet: winner.producer_wallet }).eq('id', challenge.id);

      setTxSig(signature);
      setStatus('done');
    } catch (e: any) {
      setErrorMsg(e.message || 'TRANSACTION FAILED');
      setStatus('error');
    }
  };

  const selectedSub = submissions.find(s => s.id === selectedId);

  if (loading) return (
    <div style={{ background: '#080808', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Courier New", monospace', color: '#444', letterSpacing: '4px', fontSize: '12px' }}>
      LOADING...
    </div>
  );

  if (!challenge) return (
    <div style={{ background: '#080808', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Courier New", monospace', color: '#ff2e00', letterSpacing: '4px', fontSize: '12px', flexDirection: 'column', gap: '24px' }}>
      <div>CHALLENGE NOT FOUND</div>
      <Link href="/browse" style={{ color: '#555', fontSize: '11px', letterSpacing: '3px', textDecoration: 'none' }}>← BACK TO VAULT</Link>
    </div>
  );

  if (status === 'done') return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 9999, fontFamily: '"Courier New", monospace', color: '#f5f5f5', overflow: 'hidden' }}>
      {/* Background image */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(/winner-page.png)', backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.7 }} />
      {/* Gradient overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(8,8,8,0.95) 0%, rgba(8,8,8,0.2) 40%, rgba(8,8,8,0.2) 60%, rgba(8,8,8,0.95) 100%)' }} />
      {/* Amber glow */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(200,130,40,0.08) 0%, transparent 70%)' }} />

      {/* Top — YOU WON */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '48px 48px 0', zIndex: 10 }}>
        <div style={{ fontSize: '11px', letterSpacing: '6px', color: '#c8a96e', marginBottom: '24px' }}>── CHALLENGE COMPLETE ──</div>
        <div style={{ fontFamily: '"Arial Black", sans-serif', fontSize: 'clamp(56px, 9vw, 120px)', fontWeight: '900', lineHeight: 0.85, letterSpacing: '-3px' }}>
          WINNER<br />
          <span style={{ color: 'transparent', WebkitTextStroke: '2px #c8a96e' }}>CROWNED</span>
        </div>
      </div>

      {/* Center — SOL amount */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10, textAlign: 'center' }}>
        <div style={{ fontFamily: '"Arial Black", sans-serif', fontSize: 'clamp(48px, 8vw, 96px)', color: '#c8a96e', letterSpacing: '-2px', lineHeight: 1, textShadow: '0 0 40px rgba(200,169,110,0.4)' }}>
          {(challenge.bounty * 0.7).toFixed(2)} SOL
        </div>
        <div style={{ fontSize: '11px', color: '#888', letterSpacing: '4px', marginTop: '8px' }}>PAID TO PRODUCER</div>
        <div style={{ fontSize: '13px', color: '#555', letterSpacing: '2px', marginTop: '6px', fontFamily: 'DM Sans, sans-serif' }}>
          {selectedSub?.producer_wallet.slice(0, 8)}...{selectedSub?.producer_wallet.slice(-8)}
        </div>
      </div>

      {/* Bottom — TX + buttons */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 48px 48px', zIndex: 10 }}>
        <div style={{ fontSize: '10px', color: '#444', letterSpacing: '2px', marginBottom: '6px' }}>TX SIGNATURE</div>
        <div style={{ fontSize: '10px', color: '#c8a96e', wordBreak: 'break-all', marginBottom: '24px', fontFamily: '"Courier New", monospace', opacity: 0.7 }}>{txSig}</div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/browse" style={{ background: '#f5f5f5', color: '#080808', padding: '14px 32px', fontSize: '13px', letterSpacing: '2px', fontWeight: '700', textDecoration: 'none', display: 'inline-block' }}>
            BACK TO VAULT
          </Link>
          <Link href="/" style={{ border: '1px solid #333', color: '#f5f5f5', padding: '14px 32px', fontSize: '13px', letterSpacing: '2px', textDecoration: 'none', display: 'inline-block' }}>
            HOME
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ background: '#080808', minHeight: '100vh', color: '#f5f5f5', fontFamily: '"Courier New", monospace' }}>
      <audio ref={audioRef} onEnded={() => setPlayingId(null)} />

      {/* NAV */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)', background: 'rgba(8,8,8,0.9)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link href="/"><img src="/soundchain-wordmark.svg" alt="SoundChain" style={{ height: '28px' }} /></Link>
          <div style={{ width: '1px', height: '16px', background: '#222' }} />
          <button onClick={() => window.history.length > 1 ? router.back() : router.push('/browse')} style={{ fontSize: '11px', letterSpacing: '3px', color: '#555', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: '"Courier New", monospace' }} onMouseEnter={e => (e.currentTarget.style.color = '#f5f5f5')} onMouseLeave={e => (e.currentTarget.style.color = '#555')}>← BACK</button>
        </div>
        <div style={{ fontSize: '11px', letterSpacing: '4px', color: '#444' }}>SELECT WINNER</div>
        <WalletMultiButton style={{ background: 'transparent', color: '#f5f5f5', border: '1px solid rgba(245,245,245,0.15)', fontFamily: '"Courier New", monospace', fontSize: '10px', letterSpacing: '2px', padding: '8px 18px', textTransform: 'uppercase' }} />
      </nav>

      {/* HERO */}
      <div style={{ position: 'relative', height: '100vh', overflow: 'hidden', display: 'flex', alignItems: 'flex-end' }}>
        <div style={{ position: 'absolute', inset: 0, transform: `translateY(${scrollY * 0.3}px)` }}>
          <img src="/winner-success.png" alt="" style={{ width: '100%', height: '110%', objectFit: 'cover', objectPosition: 'center', mixBlendMode: 'lighten', opacity: 0.85 }} />
        </div>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(8,8,8,0.2) 0%, rgba(8,8,8,0.6) 100%)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%', background: 'linear-gradient(to bottom, transparent, #080808)' }} />

        <div style={{ position: 'relative', zIndex: 10, padding: '0 40px 60px', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: '11px', letterSpacing: '6px', color: '#c8a96e', marginBottom: '16px' }}>── CROWN THE BEST BEAT</div>
            <div style={{ fontFamily: '"Arial Black", sans-serif', fontSize: 'clamp(64px, 10vw, 140px)', fontWeight: '900', lineHeight: 0.85, letterSpacing: '-4px' }}>
              SELECT<br />
              <span style={{ color: 'transparent', WebkitTextStroke: '2px #f5f5f5' }}>THE</span><br />
              WINNER
            </div>
          </div>
          <div style={{ textAlign: 'right', paddingBottom: '8px' }}>
            <div style={{ fontFamily: '"Arial Black", sans-serif', fontSize: 'clamp(36px, 5vw, 64px)', color: '#c8a96e', letterSpacing: '-1px', lineHeight: 1 }}>
              {challenge.bounty} SOL
            </div>
            <div style={{ fontSize: '11px', color: '#555', letterSpacing: '4px', marginTop: '4px' }}>
              PRIZE POOL · {submissions.length} SUBMISSION{submissions.length !== 1 ? 'S' : ''}
            </div>
            <div style={{ fontSize: '10px', color: '#333', letterSpacing: '3px', marginTop: '8px' }}>SCROLL TO JUDGE ↓</div>
          </div>
        </div>
      </div>

      {/* CHALLENGE BRIEF */}
      <div style={{ background: '#0a0a0a', borderTop: '1px solid #111', borderBottom: '1px solid #111', padding: '20px 40px' }}>
        <div style={{ fontSize: '10px', letterSpacing: '4px', color: '#c8a96e', marginBottom: '6px' }}>THE CHALLENGE</div>
        <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '6px', fontFamily: '"Arial Black", sans-serif' }}>{challenge.title.toUpperCase()}</div>
        <div style={{ fontSize: '14px', color: '#555', lineHeight: 1.7 }}>{challenge.description}</div>
      </div>

      {/* SUBMISSIONS */}
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '64px 40px 160px' }}>
        <div style={{ marginBottom: '48px' }}>
          <div style={{ fontSize: '11px', letterSpacing: '5px', color: '#c8a96e', marginBottom: '8px' }}>── THE SUBMISSIONS</div>
          <div style={{ fontFamily: '"Arial Black", sans-serif', fontSize: '40px', fontWeight: '900', letterSpacing: '-1px' }}>
            {submissions.length === 0 ? 'NO SUBMISSIONS YET' : `${submissions.length} PRODUCER${submissions.length !== 1 ? 'S' : ''} ENTERED`}
          </div>
        </div>

        {submissions.length === 0 ? (
          <div style={{ border: '1px solid #111', padding: '48px', textAlign: 'center' }}>
            <div style={{ fontSize: '13px', color: '#333', letterSpacing: '3px' }}>CHALLENGE IS STILL OPEN</div>
            <div style={{ fontSize: '12px', color: '#222', letterSpacing: '2px', marginTop: '8px' }}>CHECK BACK LATER</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {submissions.map((sub, i) => {
              const accent = ACCENTS[i % ACCENTS.length];
              const isSelected = selectedId === sub.id;
              const isPlaying = playingId === sub.id;

              return (
                <div
                  key={sub.id}
                  onClick={() => setSelectedId(sub.id)}
                  style={{
                    display: 'grid', gridTemplateColumns: '4px 1fr auto',
                    borderBottom: '1px solid #111',
                    background: isSelected ? 'rgba(255,255,255,0.02)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                >
                  {/* Accent bar */}
                  <div style={{ background: isSelected ? accent : '#1a1a1a', transition: 'background 0.3s' }} />

                  {/* Content */}
                  <div style={{ padding: '28px 32px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <div>
                        <div style={{ fontSize: '10px', color: accent, letterSpacing: '4px', marginBottom: '6px', opacity: isSelected ? 1 : 0.6 }}>
                          SUBMISSION #{String(i + 1).padStart(2, '0')}
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: '700', letterSpacing: '1px', color: isSelected ? '#f5f5f5' : '#888', transition: 'color 0.2s', fontFamily: '"Courier New", monospace' }}>
                          {sub.producer_wallet.slice(0, 8)}...{sub.producer_wallet.slice(-8)}
                        </div>
                      </div>
                      <div style={{ fontSize: '11px', color: '#333', letterSpacing: '2px', marginTop: '4px' }}>
                        {new Date(sub.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    {sub.note && (
                      <div style={{ fontSize: '14px', color: '#555', lineHeight: 1.7, marginBottom: '16px', maxWidth: '560px', fontFamily: 'DM Sans, sans-serif' }}>
                        "{sub.note}"
                      </div>
                    )}

                    {sub.audio_cid && (
                      <button
                        onClick={e => { e.stopPropagation(); handlePlay(sub); }}
                        style={{ background: 'transparent', border: `1px solid ${isPlaying ? accent : '#333'}`, color: isPlaying ? accent : '#555', padding: '8px 20px', fontSize: '11px', letterSpacing: '2px', fontFamily: '"Courier New", monospace', cursor: 'pointer', transition: 'all 0.2s' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = accent; (e.currentTarget as HTMLButtonElement).style.color = accent; }}
                        onMouseLeave={e => { if (!isPlaying) { (e.currentTarget as HTMLButtonElement).style.borderColor = '#333'; (e.currentTarget as HTMLButtonElement).style.color = '#555'; } }}
                      >
                        {isPlaying ? '⏸ PAUSE' : '▶ PLAY'}
                      </button>
                    )}
                  </div>

                  {/* Select indicator */}
                  <div style={{ display: 'flex', alignItems: 'center', padding: '0 32px' }}>
                    <div style={{
                      width: '20px', height: '20px',
                      border: `2px solid ${isSelected ? accent : '#333'}`,
                      borderRadius: '50%',
                      background: isSelected ? accent : 'transparent',
                      transition: 'all 0.2s',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {isSelected && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#080808' }} />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* STICKY CONFIRM BAR */}
      {selectedSub && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
          background: 'rgba(8,8,8,0.97)', borderTop: '1px solid #1a1a1a',
          backdropFilter: 'blur(12px)', padding: '16px 40px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px',
          animation: 'slideUp 0.3s ease',
        }}>
          <div>
            <div style={{ fontSize: '10px', color: '#555', letterSpacing: '3px', marginBottom: '4px' }}>SELECTED PRODUCER</div>
            <div style={{ fontSize: '14px', color: '#f5f5f5', fontFamily: '"Courier New", monospace' }}>
              {selectedSub.producer_wallet.slice(0, 12)}...{selectedSub.producer_wallet.slice(-8)}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#c8a96e', letterSpacing: '1px' }}>70% → PRODUCER</div>
              <div style={{ fontSize: '18px', fontFamily: '"Arial Black", sans-serif', color: '#c8a96e' }}>{(challenge.bounty * 0.7).toFixed(2)} SOL</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#555', letterSpacing: '1px' }}>20% → PLATFORM</div>
              <div style={{ fontSize: '18px', fontFamily: '"Arial Black", sans-serif', color: '#555' }}>{(challenge.bounty * 0.2).toFixed(2)} SOL</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#444', letterSpacing: '1px' }}>10% → YOU</div>
              <div style={{ fontSize: '18px', fontFamily: '"Arial Black", sans-serif', color: '#444' }}>{(challenge.bounty * 0.1).toFixed(2)} SOL</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
            {status === 'error' && (
              <div style={{ fontSize: '11px', color: '#ff2e00', letterSpacing: '1px' }}>✕ {errorMsg}</div>
            )}
            <button
              onClick={handleCrown}
              disabled={status !== 'idle' && status !== 'error'}
              style={{
                background: status === 'idle' || status === 'error' ? '#c8a96e' : '#1a1a1a',
                color: status === 'idle' || status === 'error' ? '#080808' : '#444',
                border: 'none', padding: '16px 48px',
                fontSize: '14px', letterSpacing: '3px',
                fontFamily: '"Courier New", monospace', fontWeight: '700',
                cursor: status === 'idle' || status === 'error' ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s', textTransform: 'uppercase', whiteSpace: 'nowrap',
              }}
            >
              {status === 'idle' || status === 'error' ? 'CROWN THE WINNER →' : status === 'signing' ? 'AWAITING PHANTOM...' : status === 'confirming' ? 'CONFIRMING...' : 'SAVING...'}
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #080808; }
        ::-webkit-scrollbar-thumb { background: #333; }
      `}</style>
    </div>
  );
}
