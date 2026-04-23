'use client';
import { useEffect, useRef, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TextReveal } from '../components/TextReveal';
import { supabase } from '../../lib/supabase';

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

const SLEEVE_COLORS = [
  { bg: '#0d0d0d', accent: '#c8a96e', pattern: 'lines' },
  { bg: '#0a0f0a', accent: '#4ade80', pattern: 'circles' },
  { bg: '#0f0a0a', accent: '#f87171', pattern: 'grid' },
  { bg: '#0a0a0f', accent: '#818cf8', pattern: 'dots' },
  { bg: '#0f0f0a', accent: '#fbbf24', pattern: 'waves' },
  { bg: '#0a0f0f', accent: '#22d3ee', pattern: 'diagonal' },
  { bg: '#0f0a0f', accent: '#e879f9', pattern: 'cross' },
];

function SleeveCanvas({ colors, title, spinning }: { colors: any; title: string; spinning: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotRef = useRef(0);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const S = 280;
    canvas.width = S;
    canvas.height = S;

    function draw() {
      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, S, S);
      ctx.strokeStyle = colors.accent;
      ctx.lineWidth = 0.5;
      ctx.globalAlpha = 0.15;

      if (colors.pattern === 'lines') {
        for (let i = 0; i < S; i += 12) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, S); ctx.stroke(); }
      } else if (colors.pattern === 'circles') {
        for (let r = 20; r < S; r += 20) { ctx.beginPath(); ctx.arc(S/2, S/2, r, 0, Math.PI*2); ctx.stroke(); }
      } else if (colors.pattern === 'grid') {
        for (let i = 0; i < S; i += 16) {
          ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, S); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(S, i); ctx.stroke();
        }
      } else if (colors.pattern === 'dots') {
        for (let x = 10; x < S; x += 20) for (let y = 10; y < S; y += 20) { ctx.beginPath(); ctx.arc(x, y, 1.5, 0, Math.PI*2); ctx.fill(); }
      } else if (colors.pattern === 'waves') {
        for (let y = 0; y < S; y += 14) { ctx.beginPath(); for (let x = 0; x < S; x++) { ctx.lineTo(x, y + Math.sin(x*0.05)*5); } ctx.stroke(); }
      } else if (colors.pattern === 'diagonal') {
        for (let i = -S; i < S*2; i += 14) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i+S, S); ctx.stroke(); }
      } else if (colors.pattern === 'cross') {
        for (let x = 0; x < S; x += 24) for (let y = 0; y < S; y += 24) {
          ctx.beginPath(); ctx.moveTo(x-6, y); ctx.lineTo(x+6, y); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(x, y-6); ctx.lineTo(x, y+6); ctx.stroke();
        }
      }

      ctx.globalAlpha = 1;
      const cx = S/2, cy = S/2;
      ctx.save();
      ctx.translate(cx, cy);
      if (spinning) rotRef.current += 0.008;
      ctx.rotate(rotRef.current);

      ctx.beginPath();
      ctx.arc(0, 0, 100, 0, Math.PI*2);
      ctx.fillStyle = '#080808';
      ctx.fill();
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 1;
      ctx.stroke();

      for (let r = 20; r <= 95; r += 6) {
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI*2);
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(0, 0, 28, 0, Math.PI*2);
      ctx.fillStyle = colors.accent;
      ctx.globalAlpha = 0.15;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = colors.accent;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI*2);
      ctx.fillStyle = '#030303';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(-20, -30, 40, 0, Math.PI*2);
      const grad = ctx.createRadialGradient(-20, -30, 0, -20, -30, 40);
      grad.addColorStop(0, 'rgba(255,255,255,0.06)');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = colors.accent;
      ctx.globalAlpha = 0.7;
      ctx.font = '700 11px Courier New, monospace';
      ctx.textAlign = 'center';
      const words = title.toUpperCase().split(' ');
      words.slice(0, 2).forEach((w, i) => ctx.fillText(w, S/2, S - 28 + i*14));
      ctx.globalAlpha = 1;

      if (spinning) animRef.current = requestAnimationFrame(draw);
    }

    draw();
    if (spinning) animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [colors, title, spinning]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />;
}

export default function Browse() {
  const { publicKey } = useWallet();
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement>(null);

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [pulledIndex, setPulledIndex] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('is_open', true)
        .order('created_at', { ascending: false });
      if (!error && data) setChallenges(data);
      setLoading(false);
    }
    load();
  }, []);

  const handlePlay = (challenge: Challenge) => {
    const url = `https://gateway.pinata.cloud/ipfs/${challenge.audio_cid}`;
    if (audioRef.current) {
      if (playing) {
        audioRef.current.pause();
        setPlaying(false);
      } else {
        audioRef.current.src = url;
        audioRef.current.play();
        setPlaying(true);
      }
    }
  };

  const handlePull = (i: number) => {
    if (pulledIndex === i) {
      setPulledIndex(null);
      setPlaying(false);
      audioRef.current?.pause();
    } else {
      setPulledIndex(i);
      setPlaying(false);
      audioRef.current?.pause();
    }
  };

  const daysLeft = (created: string) => {
    return Math.max(0, 7 - Math.floor((Date.now() - new Date(created).getTime()) / 86400000));
  };

  const displayChallenges = challenges.length > 0 ? challenges : [
    { id: '1', title: 'Dark Trap Anthem', description: 'Need heavy 808s and dark melodies. Think Travis meets Metro.', bounty: 2.5, composer_wallet: 'EV9J5vRBzuFWXqGSy3jHDZg1vWJRW4v', audio_cid: '', is_open: true, created_at: new Date().toISOString() },
    { id: '2', title: 'Afrobeats Summer', description: 'Vibrant Afrobeats with guitar samples. Fun and danceable.', bounty: 1.8, composer_wallet: '7HnGmPpzAtCkwufNwW7W9ji6EuDL8qf8', audio_cid: '', is_open: true, created_at: new Date(Date.now() - 86400000).toISOString() },
    { id: '3', title: 'Lo-Fi Study Tape', description: 'Chill lo-fi hip hop. Nostalgic vinyl crackle.', bounty: 0.9, composer_wallet: 'ART1stWa11etXXXXXXXXXXXXXXXXXXXX', audio_cid: '', is_open: true, created_at: new Date(Date.now() - 172800000).toISOString() },
  ];

  return (
    <div style={{ background: '#060606', minHeight: '100vh', color: '#f5f5f5', fontFamily: '"Courier New", monospace', overflow: 'hidden' }}>
      <audio ref={audioRef} onEnded={() => setPlaying(false)} />

      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)', background: 'rgba(6,6,6,0.9)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link href="/"><img src="/soundchain-wordmark.svg" alt="SoundChain" style={{ height: '28px' }} /></Link>
          <div style={{ width: '1px', height: '16px', background: '#222' }} />
          <button
            onClick={() => {
              if (window.history.length > 1) {
                router.back();
              } else {
                router.push('/browse');
              }
            }}
            style={{ fontSize: '11px', letterSpacing: '3px', color: '#555', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: '"Courier New", monospace' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#f5f5f5')}
            onMouseLeave={e => (e.currentTarget.style.color = '#555')}
          >
            ← BACK
          </button>
        </div>
        <div style={{ fontSize: '11px', letterSpacing: '4px', color: '#444' }}>THE VAULT</div>
        <WalletMultiButton style={{ background: 'transparent', color: '#f5f5f5', border: '1px solid rgba(245,245,245,0.15)', fontFamily: '"Courier New", monospace', fontSize: '10px', letterSpacing: '2px', padding: '8px 18px', textTransform: 'uppercase' }} />
      </nav>

      <div style={{ paddingTop: '120px', paddingBottom: '40px', textAlign: 'center' }}>
        <TextReveal delay={100}>
          <div style={{ fontSize: '13px', letterSpacing: '6px', color: '#c8a96e', marginBottom: '12px' }}>── DIG THE CRATES ──</div>
        </TextReveal>
        <TextReveal delay={250}>
          <div style={{ fontFamily: 'Arial Black, sans-serif', fontSize: 'clamp(48px, 8vw, 96px)', fontWeight: '900', lineHeight: 0.88, letterSpacing: '-2px' }}>
            OPEN
          </div>
        </TextReveal>
        <TextReveal delay={400}>
          <div style={{ fontFamily: 'Arial Black, sans-serif', fontSize: 'clamp(48px, 8vw, 96px)', fontWeight: '900', lineHeight: 0.88, letterSpacing: '-2px', color: 'transparent', WebkitTextStroke: '1.5px #f5f5f5' }}>
            CHALLENGES
          </div>
        </TextReveal>
        <TextReveal delay={550}>
          <div style={{ fontSize: '14px', color: '#444', marginTop: '16px', letterSpacing: '2px' }}>
            {displayChallenges.length} RECORDS IN THE VAULT · PULL ONE TO DIG IN
          </div>
        </TextReveal>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px', fontSize: '11px', color: '#444', letterSpacing: '4px' }}>LOADING THE VAULT...</div>
      ) : (
        <>
          <div style={{ position: 'relative', padding: '20px 0 80px', overflowX: 'auto', overflowY: 'visible' }}>
            <div style={{ position: 'absolute', bottom: '56px', left: 0, right: 0, height: '12px', background: 'linear-gradient(to bottom, #1a1a1a, #0d0d0d)', borderTop: '1px solid #2a2a2a' }} />
            <div style={{ position: 'absolute', bottom: '44px', left: 0, right: 0, height: '12px', background: '#0a0a0a', borderTop: '1px solid #111' }} />

            <div style={{ display: 'flex', gap: '24px', padding: '0 80px', width: 'max-content', margin: '0 auto', alignItems: 'flex-end' }}>
              {displayChallenges.map((ch, i) => {
                const colors = SLEEVE_COLORS[i % SLEEVE_COLORS.length];
                const isPulled = pulledIndex === i;
                const isHovered = hoverIndex === i;
                const days = daysLeft(ch.created_at);

                return (
                  <div key={ch.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

                    {isPulled && (
                      <div style={{ position: 'fixed', inset: 0, zIndex: 150, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.3s ease' }} onClick={() => handlePull(i)}>
                        <div style={{ display: 'flex', gap: '0', maxWidth: '900px', width: '90%', boxShadow: '0 40px 120px rgba(0,0,0,0.8)' }} onClick={e => e.stopPropagation()}>
                          <div style={{ width: '380px', height: '380px', flexShrink: 0 }}>
                            <SleeveCanvas colors={colors} title={ch.title} spinning={playing} />
                          </div>
                          <div style={{ flex: 1, background: '#0d0d0d', padding: '36px 32px', borderLeft: `2px solid ${colors.accent}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div>
                              <div style={{ fontSize: '10px', letterSpacing: '4px', color: colors.accent, marginBottom: '8px' }}>CHALLENGE OPEN</div>
                              <div style={{ fontFamily: 'Arial Black, sans-serif', fontSize: '28px', fontWeight: '900', letterSpacing: '-1px', marginBottom: '16px', lineHeight: 1 }}>{ch.title.toUpperCase()}</div>
                              <div style={{ fontSize: '12px', color: '#555', letterSpacing: '1px', marginBottom: '20px' }}>
                                {ch.composer_wallet.slice(0, 8)}...{ch.composer_wallet.slice(-6)} · {days} DAYS LEFT
                              </div>
                              <div style={{ fontSize: '14px', color: '#888', lineHeight: 1.8, marginBottom: '28px' }}>{ch.description}</div>

                              {ch.audio_cid && (
                                <button onClick={() => handlePlay(ch)} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'transparent', border: `1px solid ${colors.accent}`, color: colors.accent, padding: '12px 20px', cursor: 'pointer', fontFamily: '"Courier New", monospace', fontSize: '11px', letterSpacing: '3px', marginBottom: '24px', width: '100%', justifyContent: 'center' }}>
                                  {playing ? '⏸ PAUSE TRACK' : '▶ PLAY TRACK'}
                                </button>
                              )}

                              <div style={{ marginBottom: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#444', letterSpacing: '2px', marginBottom: '6px' }}>
                                  <span>DEADLINE</span>
                                  <span style={{ color: days <= 2 ? '#ef4444' : colors.accent }}>{days} DAYS LEFT</span>
                                </div>
                                <div style={{ height: '2px', background: '#1a1a1a' }}>
                                  <div style={{ height: '100%', width: `${(days / 7) * 100}%`, background: days <= 2 ? '#ef4444' : colors.accent }} />
                                </div>
                              </div>
                            </div>

                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #1a1a1a' }}>
                                <div>
                                  <div style={{ fontSize: '10px', color: '#444', letterSpacing: '3px', marginBottom: '4px' }}>PRIZE POOL</div>
                                  <div style={{ fontFamily: 'Arial Black, sans-serif', fontSize: '48px', color: colors.accent, letterSpacing: '-1px', lineHeight: 1 }}>{ch.bounty} SOL</div>
                                </div>
                                <div style={{ textAlign: 'right', fontSize: '10px', color: '#333', letterSpacing: '1px', lineHeight: 1.8 }}>
                                  <div>70% → PRODUCER</div>
                                  <div>20% → PLATFORM</div>
                                  <div>10% → COMPOSER</div>
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: '10px' }}>
                                <Link href={`/challenge/${ch.id}`} style={{ flex: 1, background: colors.accent, color: '#080808', padding: '16px', fontSize: '13px', letterSpacing: '2px', fontFamily: '"Courier New", monospace', fontWeight: '700', cursor: 'pointer', textAlign: 'center', textDecoration: 'none', display: 'block' }}
                                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                                >SUBMIT VERSION →</Link>
                                <button onClick={() => handlePull(i)} style={{ background: 'transparent', border: '1px solid #222', color: '#555', padding: '16px 20px', fontSize: '11px', letterSpacing: '2px', fontFamily: '"Courier New", monospace', cursor: 'pointer' }}>✕</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div
                      onClick={() => handlePull(i)}
                      onMouseEnter={() => setHoverIndex(i)}
                      onMouseLeave={() => setHoverIndex(null)}
                      style={{
                        width: '200px', height: '200px', cursor: 'pointer',
                        transform: isHovered ? 'translateY(-24px) scale(1.04)' : 'translateY(0) scale(1)',
                        transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        position: 'relative',
                        boxShadow: isHovered ? `0 20px 60px rgba(0,0,0,0.6), 0 0 30px ${colors.accent}22` : '0 8px 24px rgba(0,0,0,0.4)',
                      }}
                    >
                      <SleeveCanvas colors={colors} title={ch.title} spinning={false} />
                      <div style={{ position: 'absolute', top: 0, right: 0, width: '8px', height: '100%', background: `linear-gradient(to right, ${colors.bg}, #1a1a1a)`, borderLeft: `1px solid ${colors.accent}33` }} />
                      {isHovered && (
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(0,0,0,0.85)', padding: '8px 14px', fontSize: '9px', letterSpacing: '3px', color: '#f5f5f5', whiteSpace: 'nowrap', border: `1px solid ${colors.accent}44`, backdropFilter: 'blur(8px)' }}>
                          PULL TO DIG IN
                        </div>
                      )}
                    </div>

                    <div style={{ marginTop: '12px', fontSize: '11px', color: colors.accent, letterSpacing: '2px', fontWeight: '700' }}>{ch.bounty} SOL</div>
                    <div style={{ fontSize: '9px', color: '#333', letterSpacing: '2px', marginTop: '2px' }}>{days}D LEFT</div>
                    <div style={{ width: '200px', height: '2px', background: '#111', marginTop: '8px' }}>
                      <div style={{ height: '100%', width: `${(days / 7) * 100}%`, background: days <= 2 ? '#ef4444' : colors.accent }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ textAlign: 'center', padding: '60px 32px', borderTop: '1px solid #111' }}>
            <div style={{ fontSize: '11px', color: '#444', letterSpacing: '4px', marginBottom: '16px' }}>── ARE YOU A COMPOSER? ──</div>
            <Link href="/post-challenge" style={{ background: '#f5f5f5', color: '#080808', padding: '16px 40px', fontSize: '13px', letterSpacing: '3px', fontFamily: '"Courier New", monospace', fontWeight: '700', textDecoration: 'none', display: 'inline-block' }}>
              ADD YOUR RECORD TO THE VAULT →
            </Link>
          </div>
        </>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        ::-webkit-scrollbar { height: 4px; }
        ::-webkit-scrollbar-track { background: #080808; }
        ::-webkit-scrollbar-thumb { background: #333; }
      `}</style>
    </div>
  );
}
