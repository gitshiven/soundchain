'use client';
import { useEffect, useRef, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  winner_wallet?: string | null;
}

const ACCENTS = ['#c8a96e','#e879f9','#22d3ee','#4ade80','#f97316','#818cf8','#f43f5e','#14b8a6'];
const PATTERNS = ['lines','circles','grid','dots','waves','diagonal','cross','triangles'];

function SleeveCanvas({ accent, pattern, title, size = 280 }: { accent: string; pattern: string; title: string; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const S = size;
    canvas.width = S;
    canvas.height = S;

    ctx.fillStyle = '#0d0d0d';
    ctx.fillRect(0, 0, S, S);

    ctx.strokeStyle = accent;
    ctx.fillStyle = accent;
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.12;

    if (pattern === 'lines') {
      for (let i = 0; i < S; i += 10) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, S); ctx.stroke(); }
    } else if (pattern === 'circles') {
      for (let r = 15; r < S; r += 18) { ctx.beginPath(); ctx.arc(S/2, S/2, r, 0, Math.PI*2); ctx.stroke(); }
    } else if (pattern === 'grid') {
      for (let i = 0; i < S; i += 14) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, S); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(S, i); ctx.stroke();
      }
    } else if (pattern === 'dots') {
      for (let x = 8; x < S; x += 16) for (let y = 8; y < S; y += 16) { ctx.beginPath(); ctx.arc(x, y, 1.5, 0, Math.PI*2); ctx.fill(); }
    } else if (pattern === 'waves') {
      for (let y = 0; y < S; y += 12) { ctx.beginPath(); for (let x = 0; x < S; x++) ctx.lineTo(x, y + Math.sin(x*0.06)*4); ctx.stroke(); }
    } else if (pattern === 'diagonal') {
      for (let i = -S; i < S*2; i += 12) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i+S, S); ctx.stroke(); }
    } else if (pattern === 'cross') {
      for (let x = 0; x < S; x += 20) for (let y = 0; y < S; y += 20) {
        ctx.beginPath(); ctx.moveTo(x-5, y); ctx.lineTo(x+5, y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x, y-5); ctx.lineTo(x, y+5); ctx.stroke();
      }
    } else if (pattern === 'triangles') {
      for (let x = 0; x < S; x += 24) for (let y = 0; y < S; y += 24) {
        ctx.beginPath(); ctx.moveTo(x, y+16); ctx.lineTo(x+12, y); ctx.lineTo(x+24, y+16); ctx.closePath(); ctx.stroke();
      }
    }

    ctx.globalAlpha = 1;
    const cx = S/2, cy = S/2;
    const vr = S * 0.32;

    ctx.beginPath(); ctx.arc(cx, cy, vr, 0, Math.PI*2);
    ctx.fillStyle = '#080808'; ctx.fill();
    ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 1; ctx.stroke();

    for (let r = vr*0.25; r < vr*0.95; r += vr*0.08) {
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2);
      ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 0.5; ctx.stroke();
    }

    ctx.beginPath(); ctx.arc(cx, cy, vr*0.22, 0, Math.PI*2);
    ctx.fillStyle = accent; ctx.globalAlpha = 0.12; ctx.fill();
    ctx.globalAlpha = 1; ctx.strokeStyle = accent; ctx.lineWidth = 1; ctx.stroke();

    ctx.beginPath(); ctx.arc(cx, cy, vr*0.05, 0, Math.PI*2);
    ctx.fillStyle = '#c8a96e'; ctx.fill();

    const grad = ctx.createRadialGradient(cx-vr*0.3, cy-vr*0.3, 0, cx, cy, vr);
    grad.addColorStop(0, 'rgba(255,255,255,0.07)');
    grad.addColorStop(1, 'transparent');
    ctx.beginPath(); ctx.arc(cx, cy, vr, 0, Math.PI*2);
    ctx.fillStyle = grad; ctx.fill();

    const words = title.toUpperCase().split(' ').slice(0, 2);
    ctx.fillStyle = accent; ctx.globalAlpha = 0.6;
    ctx.font = `700 ${S*0.055}px Courier New, monospace`;
    ctx.textAlign = 'center';
    words.forEach((w, i) => ctx.fillText(w, S/2, S - S*0.12 + i * S*0.07));
    ctx.globalAlpha = 1;
  }, [accent, pattern, title, size]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />;
}

function ChallengeRow({ challenge, index, isComposer, isWinner }: { challenge: Challenge; index: number; isComposer: boolean; isWinner: boolean }) {
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const accent = ACCENTS[index % ACCENTS.length];
  const pattern = PATTERNS[index % PATTERNS.length];
  const daysLeft = Math.max(0, 7 - Math.floor((Date.now() - new Date(challenge.created_at).getTime()) / 86400000));

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    if (rowRef.current) observer.observe(rowRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={rowRef}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'grid', gridTemplateColumns: '280px 1fr',
        borderBottom: '1px solid #111',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(32px)',
        transition: `opacity 0.7s ease ${index * 0.1}s, transform 0.7s ease ${index * 0.1}s`,
        background: hovered ? 'rgba(255,255,255,0.015)' : 'transparent',
      }}
    >
      {/* SLEEVE */}
      <div style={{ position: 'relative', width: '280px', height: '280px', flexShrink: 0, overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', inset: 0,
          transform: hovered ? 'translateX(12px) scale(1.03)' : 'translateX(0) scale(1)',
          transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          boxShadow: hovered ? `0 12px 48px rgba(0,0,0,0.6), 0 0 24px ${accent}22` : 'none',
        }}>
          <SleeveCanvas accent={accent} pattern={pattern} title={challenge.title} size={280} />
        </div>
        <div style={{ position: 'absolute', top: 0, right: 0, width: '6px', height: '100%', background: `linear-gradient(to right, transparent, ${accent}22)` }} />
      </div>

      {/* DETAILS */}
      <div style={{ padding: '32px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        {isWinner && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(200,169,110,0.15), rgba(200,169,110,0.05))',
            border: '1px solid rgba(200,169,110,0.3)',
            padding: '10px 16px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '16px' }}>🏆</span>
              <div>
                <div style={{ fontSize: '11px', color: '#c8a96e', letterSpacing: '3px', fontFamily: '"Courier New", monospace', fontWeight: '700' }}>YOU WON THIS CHALLENGE</div>
                <div style={{ fontSize: '10px', color: '#888', letterSpacing: '1px', marginTop: '2px' }}>{(challenge.bounty * 0.7).toFixed(2)} SOL was sent to your wallet</div>
              </div>
            </div>
            <Link
              href={`/winner/${challenge.id}`}
              onClick={e => e.stopPropagation()}
              style={{ background: '#c8a96e', color: '#080808', padding: '8px 20px', fontSize: '11px', letterSpacing: '2px', fontFamily: '"Courier New", monospace', fontWeight: '700', textDecoration: 'none', whiteSpace: 'nowrap' }}
            >
              VIEW WIN →
            </Link>
          </div>
        )}
        <div>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div>
              <div style={{ fontSize: '10px', color: accent, letterSpacing: '4px', fontFamily: '"Courier New", monospace', marginBottom: '8px' }}>
                CHALLENGE #{String(index + 1).padStart(3, '0')} · OPEN
              </div>
              <div style={{ fontFamily: '"Arial Black", sans-serif', fontSize: 'clamp(22px, 3vw, 36px)', fontWeight: '900', lineHeight: 0.95, letterSpacing: '-1px', color: '#f5f5f5' }}>
                {challenge.title.toUpperCase()}
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '24px' }}>
              <div style={{ fontFamily: '"Arial Black", sans-serif', fontSize: 'clamp(28px, 4vw, 52px)', color: accent, letterSpacing: '-1px', lineHeight: 1 }}>
                {challenge.bounty}
              </div>
              <div style={{ fontSize: '11px', color: '#555', letterSpacing: '3px', fontFamily: '"Courier New", monospace' }}>SOL</div>
            </div>
          </div>

          <div style={{ fontSize: '13px', color: '#555', letterSpacing: '1px', fontFamily: '"Courier New", monospace', marginBottom: '14px' }}>
            {challenge.composer_wallet.slice(0, 8)}...{challenge.composer_wallet.slice(-6)}
          </div>

          <div style={{ fontSize: '14px', color: '#666', lineHeight: 1.7, marginBottom: '20px', maxWidth: '480px' }}>
            {challenge.description || 'No description provided.'}
          </div>
        </div>

        <div>
          {/* Deadline fuse */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#444', letterSpacing: '2px', fontFamily: '"Courier New", monospace', marginBottom: '6px' }}>
              <span>DEADLINE</span>
              <span style={{ color: daysLeft <= 2 ? '#ef4444' : accent }}>{daysLeft} DAYS LEFT</span>
            </div>
            <div style={{ height: '2px', background: '#1a1a1a', borderRadius: '1px' }}>
              <div style={{ height: '100%', width: `${(daysLeft / 7) * 100}%`, background: daysLeft <= 2 ? '#ef4444' : accent, borderRadius: '1px', transition: 'width 0.3s' }} />
            </div>
          </div>

          {/* Royalty split */}
          <div style={{ display: 'flex', gap: '1px', height: '3px', marginBottom: '8px' }}>
            <div style={{ flex: 70, background: accent }} />
            <div style={{ flex: 20, background: '#333' }} />
            <div style={{ flex: 10, background: '#1a1a1a' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', letterSpacing: '1px', fontFamily: '"Courier New", monospace', marginBottom: '24px' }}>
            <span style={{ color: accent }}>70% PRODUCER</span>
            <span style={{ color: '#444' }}>20% PLATFORM</span>
            <span style={{ color: '#333' }}>10% COMPOSER</span>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            {isComposer ? (
              <Link href={`/manage/${challenge.id}`} style={{ background: '#f5f5f5', color: '#080808', padding: '14px 32px', fontSize: '13px', letterSpacing: '2px', fontFamily: '"Courier New", monospace', fontWeight: '700', textDecoration: 'none', display: 'inline-block', transition: 'opacity 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >MANAGE →</Link>
            ) : (
              <Link href={`/challenge/${challenge.id}`} style={{ background: accent, color: '#080808', padding: '14px 32px', fontSize: '13px', letterSpacing: '2px', fontFamily: '"Courier New", monospace', fontWeight: '700', textDecoration: 'none', display: 'inline-block', transition: 'opacity 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >SUBMIT VERSION →</Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Browse() {
  const { publicKey } = useWallet();
  const router = useRouter();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const heroRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.from('challenges').select('*').order('created_at', { ascending: false });
      if (!error && data) setChallenges(data);
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const [myStats, setMyStats] = useState({ challenged: 0, submitted: 0, won: 0 });

  useEffect(() => {
    if (!publicKey) return;
    async function loadStats() {
      const { data: myChalllenges } = await supabase
        .from('challenges')
        .select('id')
        .eq('composer_wallet', publicKey!.toString());

      const { data: mySubmissions } = await supabase
        .from('submissions')
        .select('id')
        .eq('producer_wallet', publicKey!.toString());

      const { data: myWins } = await supabase
        .from('challenges')
        .select('id')
        .eq('winner_wallet', publicKey!.toString());

      setMyStats({
        challenged: myChalllenges?.length || 0,
        submitted: mySubmissions?.length || 0,
        won: myWins?.length || 0,
      });
    }
    loadStats();
  }, [publicKey]);

  const filteredChallenges = challenges.filter(ch => {
    if (ch.is_open) return true;
    if (publicKey && ch.winner_wallet === publicKey.toString()) return true;
    if (publicKey && ch.composer_wallet === publicKey.toString()) return true;
    return false;
  });

  const displayChallenges = filteredChallenges.length > 0 ? filteredChallenges : [
    { id: '1', title: 'Dark Trap Anthem', description: 'Need heavy 808s and dark melodies. Think Travis meets Metro.', bounty: 2.5, composer_wallet: 'EV9J5vRBzuFWXqGSy3jHDZg1vWJRW4v', audio_cid: '', is_open: true, created_at: new Date().toISOString() },
    { id: '2', title: 'Afrobeats Summer', description: 'Vibrant Afrobeats with guitar samples. Fun and danceable.', bounty: 1.8, composer_wallet: '7HnGmPpzAtCkwufNwW7W9ji6EuDL8qf8', audio_cid: '', is_open: true, created_at: new Date(Date.now() - 86400000).toISOString() },
    { id: '3', title: 'Lo-Fi Study Tape', description: 'Chill lo-fi hip hop. Nostalgic vinyl crackle vibes.', bounty: 0.9, composer_wallet: 'ART1stWa11etXXXXXXXXXXXXXXXXXXXX', audio_cid: '', is_open: true, created_at: new Date(Date.now() - 172800000).toISOString() },
  ];

  return (
    <div style={{ background: '#080808', minHeight: '100vh', color: '#f5f5f5', fontFamily: '"Courier New", monospace' }}>

      {/* NAV */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)', background: 'rgba(8,8,8,0.9)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link href="/"><img src="/soundchain-wordmark.svg" alt="SoundChain" style={{ height: '28px' }} /></Link>
          <div style={{ width: '1px', height: '16px', background: '#222' }} />
          <button onClick={() => window.history.length > 1 ? router.back() : router.push('/')} style={{ fontSize: '11px', letterSpacing: '3px', color: '#555', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: '"Courier New", monospace' }} onMouseEnter={e => (e.currentTarget.style.color = '#f5f5f5')} onMouseLeave={e => (e.currentTarget.style.color = '#555')}>← BACK</button>
        </div>
        <div style={{ fontSize: '11px', letterSpacing: '4px', color: '#444' }}>THE VAULT</div>
        <WalletMultiButton style={{ background: 'transparent', color: '#f5f5f5', border: '1px solid rgba(245,245,245,0.15)', fontFamily: '"Courier New", monospace', fontSize: '10px', letterSpacing: '2px', padding: '8px 18px', textTransform: 'uppercase' }} />
      </nav>

      {publicKey && (
        <div style={{
          background: '#0a0a0a',
          borderBottom: '1px solid #111',
          padding: '12px 32px',
          display: 'flex',
          alignItems: 'center',
          gap: '32px',
          marginTop: '64px',
          flexWrap: 'wrap',
        }}>
          <div style={{ fontSize: '10px', letterSpacing: '4px', color: '#444', fontFamily: '"Courier New", monospace' }}>
            YOUR ACTIVITY
          </div>
          <div style={{ width: '1px', height: '16px', background: '#222' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ fontSize: '13px', fontFamily: '"Arial Black", sans-serif', color: '#f5f5f5' }}>{myStats.challenged}</div>
            <div style={{ fontSize: '10px', color: '#555', letterSpacing: '2px' }}>CHALLENGE{myStats.challenged !== 1 ? 'S' : ''} POSTED</div>
          </div>

          <Link href="/my-submissions" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            <div style={{ fontSize: '13px', fontFamily: '"Arial Black", sans-serif', color: '#f5f5f5' }}>{myStats.submitted}</div>
            <div style={{ fontSize: '10px', color: '#555', letterSpacing: '2px' }}>{myStats.submitted !== 1 ? 'SUBMISSIONS AS PRODUCER' : 'SUBMISSION AS PRODUCER'}</div>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ fontSize: '13px', fontFamily: '"Arial Black", sans-serif', color: myStats.won > 0 ? '#c8a96e' : '#f5f5f5' }}>{myStats.won}</div>
            <div style={{ fontSize: '10px', color: myStats.won > 0 ? '#c8a96e' : '#555', letterSpacing: '2px' }}>WIN{myStats.won !== 1 ? 'S' : ''}</div>
          </div>

          {myStats.won > 0 && (
            <div style={{ fontSize: '10px', color: '#c8a96e', letterSpacing: '2px', border: '1px solid rgba(200,169,110,0.3)', padding: '4px 12px', fontFamily: '"Courier New", monospace', animation: 'pulse 2s ease-in-out infinite' }}>
              🏆 WINNER
            </div>
          )}
        </div>
      )}

      {/* HERO */}
      <div ref={heroRef} style={{ position: 'relative', height: '100vh', overflow: 'hidden', display: 'flex', alignItems: 'flex-end' }}>

        {/* Cartoon producers image */}
        <div style={{
          position: 'absolute', inset: 0,
          transform: `translateY(${scrollY * 0.3}px)`,
          transition: 'transform 0s',
        }}>
          <img src="/browse-hero.png" alt="" style={{ width: '100%', height: '110%', objectFit: 'cover', objectPosition: 'center', mixBlendMode: 'lighten', opacity: 0.9 }} />
        </div>

        {/* Gradient overlays */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(8,8,8,0.2) 0%, rgba(8,8,8,0.6) 100%)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(to bottom, transparent, #080808)' }} />

        {/* Hero content */}
        <div style={{ position: 'relative', zIndex: 10, padding: '0 40px 60px', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: '11px', letterSpacing: '6px', color: '#c8a96e', marginBottom: '16px' }}>── DIG THE CRATES</div>
            <div style={{ fontFamily: '"Arial Black", sans-serif', fontSize: 'clamp(72px, 12vw, 160px)', fontWeight: '900', lineHeight: 0.85, letterSpacing: '-4px' }}>
              THE<br />
              <span style={{ color: 'transparent', WebkitTextStroke: '2px #f5f5f5' }}>VAULT</span>
            </div>
          </div>
          <div style={{ textAlign: 'right', paddingBottom: '8px' }}>
            <div style={{ fontFamily: '"Arial Black", sans-serif', fontSize: 'clamp(36px, 5vw, 64px)', color: '#c8a96e', letterSpacing: '-1px', lineHeight: 1 }}>
              {filteredChallenges.length > 0 ? filteredChallenges.length : displayChallenges.length}
            </div>
            <div style={{ fontSize: '11px', color: '#555', letterSpacing: '4px', marginTop: '4px' }}>OPEN CHALLENGES</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end', marginTop: '16px', fontSize: '10px', color: '#333', letterSpacing: '3px' }}>
              <span>SCROLL TO DIG</span>
              <span style={{ animation: 'bounce 1.5s ease-in-out infinite' }}>↓</span>
            </div>
          </div>
        </div>
      </div>

      {/* CHALLENGES LIST */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px', fontSize: '11px', color: '#444', letterSpacing: '4px' }}>LOADING THE VAULT...</div>
      ) : (
        <div style={{ borderTop: '1px solid #111' }}>
          {displayChallenges.map((ch, i) => (
            <ChallengeRow
              key={ch.id}
              challenge={ch}
              index={i}
              isComposer={!!(publicKey && publicKey.toString() === ch.composer_wallet)}
              isWinner={!!(publicKey && ch.winner_wallet && publicKey.toString() === ch.winner_wallet)}
            />
          ))}
        </div>
      )}

      {/* POST CTA */}
      <div style={{ borderTop: '1px solid #111', padding: '80px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px' }}>
        <div>
          <div style={{ fontSize: '11px', color: '#444', letterSpacing: '4px', marginBottom: '12px' }}>── ARE YOU A COMPOSER?</div>
          <div style={{ fontFamily: '"Arial Black", sans-serif', fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: '900', letterSpacing: '-1px', lineHeight: 1 }}>
            ADD YOUR<br />RECORD TO THE VAULT
          </div>
        </div>
        <Link href="/post-challenge" style={{ background: '#f5f5f5', color: '#080808', padding: '18px 48px', fontSize: '14px', letterSpacing: '3px', fontFamily: '"Courier New", monospace', fontWeight: '700', textDecoration: 'none', display: 'inline-block', flexShrink: 0 }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >POST A CHALLENGE →</Link>
      </div>

      <style>{`
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(6px)} }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #080808; }
        ::-webkit-scrollbar-thumb { background: #333; }
      `}</style>
    </div>
  );
}
