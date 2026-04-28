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

const SPINE_COLORS = [
  '#c8a96e', '#e879f9', '#22d3ee', '#4ade80',
  '#f97316', '#818cf8', '#f43f5e', '#14b8a6',
];

function CrateDig({ submissions, onSelect, selectedId, playingId, onPlay }: {
  submissions: Submission[];
  onSelect: (id: string) => void;
  selectedId: string | null;
  playingId: string | null;
  onPlay: (sub: Submission) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [pulling, setPulling] = useState<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleScroll = () => {
      const scrollTop = el.scrollTop;
      const perRecord = 120;
      const idx = Math.min(Math.floor(scrollTop / perRecord), submissions.length - 1);
      setFocusedIndex(idx);
    };
    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, [submissions.length]);

  const handlePull = (i: number, sub: Submission) => {
    setPulling(i);
    setTimeout(() => {
      onSelect(sub.id);
      setPulling(null);
    }, 600);
  };

  return (
    <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Crate background */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'url(/crate.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: 0.4,
        borderRadius: '4px',
      }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(8,8,8,0.3), rgba(8,8,8,0.7))' }} />

      {/* Amber glow */}
      <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '80%', height: '40%', background: 'radial-gradient(ellipse, rgba(200,130,40,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Records stack */}
      <div
        ref={containerRef}
        style={{ position: 'relative', zIndex: 10, width: '85%', height: '75%', overflowY: 'scroll', scrollbarWidth: 'none', paddingTop: '20px', paddingBottom: `${submissions.length * 80}px` }}
      >
        <style>{`::-webkit-scrollbar{display:none}`}</style>
        {submissions.map((sub, i) => {
          const isFocused = i === focusedIndex;
          const isPulling = pulling === i;
          const isSelected = selectedId === sub.id;
          const color = SPINE_COLORS[i % SPINE_COLORS.length];
          const offset = (i - focusedIndex) * 28;
          const scale = isFocused ? 1.04 : 0.96 - Math.abs(i - focusedIndex) * 0.02;
          const opacity = isFocused ? 1 : Math.max(0.3, 1 - Math.abs(i - focusedIndex) * 0.25);
          const tilt = (i - focusedIndex) * 3;

          return (
            <div
              key={sub.id}
              onClick={() => isFocused && handlePull(i, sub)}
              style={{
                position: 'absolute',
                top: `${20 + i * 28}px`,
                left: 0, right: 0,
                height: '56px',
                background: `linear-gradient(135deg, #0d0d0d 0%, #1a1a1a 50%, #0a0a0a 100%)`,
                border: `1px solid ${isSelected ? color : '#2a2a2a'}`,
                borderLeft: `4px solid ${color}`,
                display: 'flex', alignItems: 'center', gap: '16px',
                padding: '0 16px',
                cursor: isFocused ? 'pointer' : 'default',
                transform: `translateY(${offset * -0.3}px) scale(${scale}) rotateX(${tilt}deg) ${isPulling ? 'translateY(-120px)' : ''}`,
                opacity,
                transition: isPulling ? 'transform 0.6s cubic-bezier(0.4,0,0.2,1), opacity 0.3s' : 'transform 0.2s ease, opacity 0.2s ease',
                boxShadow: isFocused ? `0 8px 32px rgba(0,0,0,0.6), 0 0 20px ${color}22` : '0 2px 8px rgba(0,0,0,0.4)',
                zIndex: submissions.length - i,
              }}
            >
              <div style={{ width: '8px', height: '32px', background: color, borderRadius: '2px', flexShrink: 0, opacity: 0.8 }} />
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: '11px', color: isFocused ? '#f5f5f5' : '#666', letterSpacing: '1px', fontFamily: '"Courier New", monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {sub.producer_wallet.slice(0, 8)}...{sub.producer_wallet.slice(-6)}
                </div>
                <div style={{ fontSize: '9px', color: '#444', letterSpacing: '2px', marginTop: '2px' }}>
                  SUBMISSION #{i + 1} · {new Date(sub.created_at).toLocaleDateString()}
                </div>
              </div>
              {isFocused && (
                <div style={{ fontSize: '9px', color, letterSpacing: '2px', fontFamily: '"Courier New", monospace', animation: 'pulse 1.5s ease-in-out infinite' }}>
                  PULL →
                </div>
              )}
              {isSelected && (
                <div style={{ fontSize: '9px', color, letterSpacing: '2px', fontFamily: '"Courier New", monospace' }}>✓ SELECTED</div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)', fontSize: '9px', color: '#444', letterSpacing: '3px', fontFamily: '"Courier New", monospace', zIndex: 20 }}>
        SCROLL TO FLIP · CLICK TO PULL
      </div>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  );
}

function Turntable({ submission, challenge, onCrown, status, playing, onPlay }: {
  submission: Submission;
  challenge: Challenge;
  onCrown: () => void;
  status: string;
  playing: boolean;
  onPlay: () => void;
}) {
  const color = SPINE_COLORS[0];
  const [rotation, setRotation] = useState(0);
  const animRef = useRef<number>(0);

  useEffect(() => {
    if (!playing) { cancelAnimationFrame(animRef.current); return; }
    const spin = () => { setRotation(r => r + 0.5); animRef.current = requestAnimationFrame(spin); };
    animRef.current = requestAnimationFrame(spin);
    return () => cancelAnimationFrame(animRef.current);
  }, [playing]);

  return (
    <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(/turntable.png)', backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.5 }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(8,8,8,0.4), rgba(8,8,8,0.85))' }} />
      <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '60%', height: '40%', background: 'radial-gradient(ellipse, rgba(200,130,40,0.12) 0%, transparent 70%)' }} />

      <div style={{ position: 'relative', zIndex: 10, textAlign: 'center' }}>
        {/* Spinning vinyl */}
        <div style={{ position: 'relative', width: '180px', height: '180px', margin: '0 auto 24px', transform: `rotate(${rotation}deg)` }}>
          <svg viewBox="0 0 180 180" style={{ width: '100%', height: '100%' }}>
            <circle cx="90" cy="90" r="88" fill="#080808" stroke="#1a1a1a" strokeWidth="1"/>
            {[20,30,40,50,60,70,80].map(r => (
              <circle key={r} cx="90" cy="90" r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5"/>
            ))}
            <circle cx="90" cy="90" r="28" fill={SPINE_COLORS[0]} opacity="0.15"/>
            <circle cx="90" cy="90" r="28" fill="none" stroke={SPINE_COLORS[0]} strokeWidth="1" opacity="0.4"/>
            <circle cx="90" cy="90" r="4" fill="#c8a96e"/>
            <circle cx="90" cy="90" r="88" fill="url(#shine)" opacity="0.06"/>
            <defs>
              <radialGradient id="shine" cx="30%" cy="30%">
                <stop offset="0%" stopColor="white"/>
                <stop offset="100%" stopColor="transparent"/>
              </radialGradient>
            </defs>
          </svg>
        </div>

        <div style={{ fontSize: '10px', letterSpacing: '4px', color: '#c8a96e', marginBottom: '6px', fontFamily: '"Courier New", monospace' }}>NOW PLAYING</div>
        <div style={{ fontSize: '16px', color: '#f5f5f5', fontWeight: '600', marginBottom: '4px', fontFamily: '"Courier New", monospace' }}>
          {submission.producer_wallet.slice(0, 8)}...{submission.producer_wallet.slice(-6)}
        </div>
        {submission.note && (
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '16px', maxWidth: '280px', lineHeight: 1.6, fontFamily: 'DM Sans, sans-serif' }}>
            "{submission.note}"
          </div>
        )}

        <button onClick={onPlay} style={{ background: 'transparent', border: '1px solid #333', color: '#888', padding: '10px 24px', fontSize: '12px', letterSpacing: '2px', fontFamily: '"Courier New", monospace', cursor: 'pointer', marginBottom: '24px', transition: 'all 0.2s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#c8a96e'; (e.currentTarget as HTMLButtonElement).style.color = '#c8a96e'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#333'; (e.currentTarget as HTMLButtonElement).style.color = '#888'; }}
        >
          {playing ? '⏸ PAUSE' : '▶ PLAY SUBMISSION'}
        </button>

        <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: '20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', letterSpacing: '1px', fontFamily: '"Courier New", monospace', marginBottom: '8px' }}>
            <span style={{ color: '#c8a96e' }}>70% → PRODUCER</span>
            <span style={{ color: '#555' }}>20% → PLATFORM</span>
            <span style={{ color: '#444' }}>10% → COMPOSER</span>
          </div>
          <div style={{ fontFamily: '"Arial Black", sans-serif', fontSize: '36px', color: '#c8a96e', letterSpacing: '-1px', lineHeight: 1 }}>
            {(challenge.bounty * 0.7).toFixed(2)} SOL
          </div>
          <div style={{ fontSize: '10px', color: '#444', letterSpacing: '2px', fontFamily: '"Courier New", monospace', marginTop: '4px' }}>TO THIS PRODUCER</div>
        </div>

        <button onClick={onCrown} disabled={status !== 'idle' && status !== 'error'}
          style={{ background: status === 'idle' || status === 'error' ? '#c8a96e' : '#1a1a1a', color: status === 'idle' || status === 'error' ? '#080808' : '#444', border: 'none', padding: '16px 40px', fontSize: '14px', letterSpacing: '3px', fontFamily: '"Courier New", monospace', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', textTransform: 'uppercase' }}>
          {status === 'idle' || status === 'error' ? 'CROWN THE WINNER' : status === 'signing' ? 'AWAITING PHANTOM...' : status === 'confirming' ? 'CONFIRMING...' : 'SAVING...'}
        </button>
      </div>
    </div>
  );
}

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
  const [playing, setPlaying] = useState(false);
  const [status, setStatus] = useState<'idle'|'signing'|'confirming'|'saving'|'done'|'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [txSig, setTxSig] = useState('');

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

  const handlePlay = (sub: Submission) => {
    if (!sub.audio_cid) return;
    const url = `https://gateway.pinata.cloud/ipfs/${sub.audio_cid}`;
    if (audioRef.current) {
      if (playing && playingId === sub.id) {
        audioRef.current.pause();
        setPlaying(false);
        setPlayingId(null);
      } else {
        audioRef.current.src = url;
        audioRef.current.play();
        setPlaying(true);
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
    <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: '"Courier New", monospace', color: '#f5f5f5' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(/winner-success.png)', backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.4 }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(8,8,8,0.5), rgba(8,8,8,0.85))' }} />
      <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '32px' }}>
        <div style={{ fontSize: '11px', letterSpacing: '6px', color: '#c8a96e', marginBottom: '24px' }}>── DEAL DONE ON-CHAIN ──</div>
        <div style={{ fontFamily: '"Arial Black", sans-serif', fontSize: 'clamp(48px, 8vw, 96px)', fontWeight: '900', lineHeight: 0.9, marginBottom: '32px' }}>
          WINNER<br />
          <span style={{ color: 'transparent', WebkitTextStroke: '2px #f5f5f5' }}>CROWNED</span>
        </div>
        <div style={{ fontSize: '12px', color: '#555', letterSpacing: '1px', marginBottom: '8px' }}>TX SIGNATURE</div>
        <div style={{ fontSize: '10px', color: '#c8a96e', wordBreak: 'break-all', marginBottom: '32px', border: '1px solid #1a1a1a', padding: '12px', maxWidth: '480px' }}>{txSig}</div>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Link href="/browse" style={{ background: '#f5f5f5', color: '#080808', padding: '14px 28px', fontSize: '14px', letterSpacing: '2px', fontWeight: '700', textDecoration: 'none' }}>BACK TO VAULT</Link>
          <Link href="/" style={{ border: '1px solid #333', color: '#f5f5f5', padding: '14px 28px', fontSize: '14px', letterSpacing: '2px', textDecoration: 'none' }}>HOME</Link>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ background: '#080808', height: '100vh', overflow: 'hidden', color: '#f5f5f5', fontFamily: '"Courier New", monospace' }}>
      <audio ref={audioRef} onEnded={() => { setPlaying(false); setPlayingId(null); }} />

      {/* NAV */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)', background: 'rgba(8,8,8,0.9)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link href="/"><img src="/soundchain-wordmark.svg" alt="SoundChain" style={{ height: '28px' }} /></Link>
          <div style={{ width: '1px', height: '16px', background: '#222' }} />
          <button onClick={() => window.history.length > 1 ? router.back() : router.push('/')} style={{ fontSize: '11px', letterSpacing: '3px', color: '#555', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: '"Courier New", monospace' }} onMouseEnter={e => (e.currentTarget.style.color = '#f5f5f5')} onMouseLeave={e => (e.currentTarget.style.color = '#555')}>← BACK</button>
        </div>
        <div style={{ fontSize: '11px', letterSpacing: '4px', color: '#444' }}>SELECT WINNER — {challenge.title.toUpperCase()}</div>
        <WalletMultiButton style={{ background: 'transparent', color: '#f5f5f5', border: '1px solid rgba(245,245,245,0.15)', fontFamily: '"Courier New", monospace', fontSize: '10px', letterSpacing: '2px', padding: '8px 18px', textTransform: 'uppercase' }} />
      </nav>

      {/* HERO */}
      <div style={{ position: 'relative', height: '220px', overflow: 'hidden', marginTop: '57px' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(/race-hero.png)', backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.5 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(8,8,8,0.2), rgba(8,8,8,0.95))' }} />
        <div style={{ position: 'absolute', bottom: '32px', left: '40px' }}>
          <div style={{ fontSize: '11px', letterSpacing: '6px', color: '#c8a96e', marginBottom: '10px' }}>── SELECT THE WINNER</div>
          <div style={{ fontFamily: '"Arial Black", sans-serif', fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: '900', lineHeight: 0.9, letterSpacing: '-2px' }}>
            CROWN THE<br />
            <span style={{ color: 'transparent', WebkitTextStroke: '1.5px #f5f5f5' }}>BEST BEAT</span>
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: '32px', right: '40px', textAlign: 'right' }}>
          <div style={{ fontFamily: '"Arial Black", sans-serif', fontSize: '48px', color: '#c8a96e', letterSpacing: '-1px', lineHeight: 1 }}>{challenge.bounty} SOL</div>
          <div style={{ fontSize: '10px', color: '#555', letterSpacing: '3px', marginTop: '4px' }}>PRIZE POOL · {submissions.length} SUBMISSIONS</div>
        </div>
      </div>

      {/* MAIN — CRATE + TURNTABLE */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', height: 'calc(100vh - 277px)' }}>

        {/* LEFT — CRATE */}
        <div style={{ borderRight: '1px solid #1a1a1a', position: 'relative' }}>
          {submissions.length === 0 ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontSize: '11px', color: '#444', letterSpacing: '4px' }}>NO SUBMISSIONS YET</div>
              <div style={{ fontSize: '10px', color: '#333', letterSpacing: '2px' }}>CHALLENGE IS STILL OPEN</div>
            </div>
          ) : (
            <CrateDig
              submissions={submissions}
              onSelect={setSelectedId}
              selectedId={selectedId}
              playingId={playingId}
              onPlay={handlePlay}
            />
          )}
        </div>

        {/* RIGHT — TURNTABLE */}
        <div style={{ position: 'relative' }}>
          {!selectedSub ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px', position: 'relative' }}>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(/turntable.png)', backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.2 }} />
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,8,8,0.7)' }} />
              <div style={{ position: 'relative', zIndex: 10, textAlign: 'center' }}>
                <div style={{ fontSize: '32px', color: '#1a1a1a', marginBottom: '16px' }}>◎</div>
                <div style={{ fontSize: '11px', color: '#333', letterSpacing: '4px' }}>PULL A RECORD</div>
                <div style={{ fontSize: '10px', color: '#222', letterSpacing: '2px', marginTop: '6px' }}>TO LOAD THE TURNTABLE</div>
              </div>
            </div>
          ) : (
            <Turntable
              submission={selectedSub}
              challenge={challenge}
              onCrown={handleCrown}
              status={status}
              playing={playing && playingId === selectedSub.id}
              onPlay={() => handlePlay(selectedSub)}
            />
          )}

          {status === 'error' && (
            <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px', border: '1px solid rgba(255,46,0,0.3)', padding: '12px 16px', fontSize: '12px', color: '#ff2e00', fontFamily: '"Courier New", monospace' }}>
              ✕ {errorMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
