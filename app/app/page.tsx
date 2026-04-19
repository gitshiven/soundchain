'use client';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { useEffect, useRef, useState } from 'react';
import { IntroGate } from './intro';
import Link from 'next/link';

export default function Home() {
  const { publicKey } = useWallet();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [entered, setEntered] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('soundchain_entered') === 'true';
    }
    return false;
  });

  useEffect(() => {
    if (videoRef.current && entered) {
      videoRef.current.play().catch(() => {});
    }
  }, [entered]);

  const handleEnter = () => {
    sessionStorage.setItem('soundchain_entered', 'true');
    setEntered(true);
  };

  return (
    <>
      {!entered && <IntroGate onEnter={handleEnter} />}
      <main style={{
        background: '#080808', minHeight: '100vh', color: '#f5f5f5',
        fontFamily: '"Courier New", Courier, monospace', overflowX: 'hidden',
        opacity: entered ? 1 : 0, transition: 'opacity 0.6s ease',
      }}>
        <nav style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 32px', borderBottom: '1px solid rgba(245,245,245,0.15)',
          backdropFilter: 'blur(12px)', background: 'rgba(8,8,8,0.7)',
        }}>
          <img src="/soundchain-wordmark.svg" alt="SoundChain" style={{ height: '32px', width: 'auto' }} />
          <div style={{ fontSize: '10px', color: '#666', letterSpacing: '3px', textTransform: 'uppercase' }}>SOLANA DEVNET</div>
          <WalletMultiButton style={{
            background: 'transparent', color: '#f5f5f5',
            border: '1px solid rgba(245,245,245,0.3)',
            fontFamily: '"Courier New", monospace', fontSize: '10px',
            letterSpacing: '3px', padding: '8px 20px', textTransform: 'uppercase',
          }} />
        </nav>

        <div style={{ position: 'relative', height: '100vh', display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
          <video ref={videoRef} autoPlay muted loop playsInline style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.55,
          }}>
            <source src="/vinyl.mp4" type="video/mp4" />
          </video>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, rgba(8,8,8,0.2) 0%, rgba(8,8,8,0) 40%, rgba(8,8,8,0.95) 100%)',
          }} />
          <div style={{ position: 'relative', zIndex: 2, padding: '0 32px 64px', width: '100%' }}>
            <div style={{ fontSize: '10px', letterSpacing: '6px', color: '#c8a96e', textTransform: 'uppercase', marginBottom: '16px' }}>
              ── DECENTRALIZED MUSIC PROTOCOL
            </div>
            <div style={{
              fontSize: 'clamp(56px, 11vw, 160px)', fontWeight: '900', lineHeight: '0.88',
              letterSpacing: '-3px', fontFamily: 'Arial Black, Arial, sans-serif',
              textTransform: 'uppercase', marginBottom: '32px',
            }}>
              MUSIC<br />
              <span style={{ color: 'transparent', WebkitTextStroke: '1.5px #f5f5f5' }}>COLLAB</span><br />
              ON-CHAIN
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '32px', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '12px', color: '#888', letterSpacing: '1px', maxWidth: '380px', lineHeight: 1.7 }}>
                Composers post challenges. Producers compete.
                Royalties split automatically on Solana.
                No middlemen. No disputes. No trust required.
              </div>
              {publicKey ? (
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <Link href="/post-challenge" style={{
                    background: '#f5f5f5', color: '#080808', border: 'none', padding: '14px 32px',
                    fontSize: '11px', letterSpacing: '3px', fontFamily: '"Courier New", monospace',
                    fontWeight: '700', cursor: 'pointer', textTransform: 'uppercase',
                    textDecoration: 'none', display: 'inline-block'
                  }}>POST CHALLENGE →</Link>
                  <Link href="/browse" style={{
                    background: 'transparent', color: '#f5f5f5',
                    border: '1px solid rgba(245,245,245,0.4)', padding: '14px 32px',
                    fontSize: '11px', letterSpacing: '3px', fontFamily: '"Courier New", monospace',
                    fontWeight: '700', cursor: 'pointer', textTransform: 'uppercase',
                    textDecoration: 'none', display: 'inline-block'
                  }}>BROWSE →</Link>
                </div>
              ) : (
                <WalletMultiButton style={{
                  background: '#f5f5f5', color: '#080808', border: 'none',
                  fontFamily: '"Courier New", monospace', fontSize: '11px',
                  letterSpacing: '3px', padding: '14px 32px', textTransform: 'uppercase', fontWeight: '700',
                }} />
              )}
            </div>
          </div>
          <div style={{ position: 'absolute', bottom: '32px', right: '32px', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div style={{ fontSize: '9px', letterSpacing: '4px', color: '#555', textTransform: 'uppercase', writingMode: 'vertical-rl' }}>SCROLL</div>
            <div style={{ width: '1px', height: '48px', background: 'linear-gradient(to bottom, #555, transparent)' }} />
          </div>
        </div>

        <div style={{ borderTop: '1px solid #222', borderBottom: '1px solid #222', padding: '14px 0', overflow: 'hidden', whiteSpace: 'nowrap', background: '#0d0d0d' }}>
          <span style={{ display: 'inline-block', animation: 'marquee 22s linear infinite', fontSize: '10px', letterSpacing: '5px', color: '#555', textTransform: 'uppercase' }}>
            {'TRUSTLESS ESCROW ▪ AUTO ROYALTY SPLITS ▪ ON-CHAIN OWNERSHIP ▪ BUILT ON SOLANA ▪ $20B+ ROYALTY MARKET ▪ 0% MIDDLEMEN ▪ TRUSTLESS ESCROW ▪ AUTO ROYALTY SPLITS ▪ ON-CHAIN OWNERSHIP ▪ BUILT ON SOLANA ▪ $20B+ ROYALTY MARKET ▪ 0% MIDDLEMEN ▪ '}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderBottom: '1px solid #1a1a1a' }}>
          {[
            { num: '01', title: 'POST', sub: 'CHALLENGE', desc: 'Upload your track idea. Set a SOL bounty. Smart contract locks funds in escrow — trustless, instant, permanent.' },
            { num: '02', title: 'COMPETE', sub: 'PRODUCE', desc: 'Producers submit their versions. Community listens. The best remix rises. No gatekeepers. No labels.' },
            { num: '03', title: 'OWN', sub: 'FOREVER', desc: 'Winner selected. Royalties split automatically. Ownership minted on-chain. Every future stream pays out forever.' },
          ].map((item, i) => (
            <div key={i} style={{ padding: '48px 32px', borderRight: i < 2 ? '1px solid #1a1a1a' : 'none' }}>
              <div style={{ fontSize: '10px', color: '#c8a96e', letterSpacing: '4px', marginBottom: '24px', fontFamily: '"Courier New", monospace' }}>
                {item.num} ──────
              </div>
              <div style={{ fontSize: 'clamp(40px, 5vw, 72px)', fontWeight: '900', fontFamily: 'Arial Black, sans-serif', lineHeight: 1, marginBottom: '4px' }}>
                {item.title}
              </div>
              <div style={{ fontSize: '11px', color: '#444', letterSpacing: '4px', marginBottom: '24px' }}>{item.sub}</div>
              <div style={{ fontSize: '12px', color: '#666', lineHeight: 1.8 }}>{item.desc}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderBottom: '1px solid #1a1a1a', background: '#0d0d0d' }}>
          {[
            { value: '$20B+', label: 'ROYALTY MARKET SIZE' },
            { value: '0%', label: 'MIDDLEMEN INVOLVED' },
            { value: '100%', label: 'ON-CHAIN OWNERSHIP' },
          ].map((stat, i) => (
            <div key={i} style={{ padding: '40px 32px', borderRight: i < 2 ? '1px solid #1a1a1a' : 'none', textAlign: 'center' }}>
              <div style={{ fontSize: 'clamp(40px, 6vw, 80px)', fontWeight: '900', fontFamily: 'Arial Black, sans-serif', color: '#c8a96e', lineHeight: 1, marginBottom: '8px' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '10px', color: '#555', letterSpacing: '4px' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        <div style={{ padding: '80px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '32px' }}>
          <div style={{ fontSize: '10px', color: '#c8a96e', letterSpacing: '6px', textTransform: 'uppercase' }}>
            ── BUILT FOR THE FRONTIER HACKATHON ──
          </div>
          <div style={{ fontSize: 'clamp(32px, 6vw, 80px)', fontWeight: '900', fontFamily: 'Arial Black, sans-serif', lineHeight: 0.95, textTransform: 'uppercase', letterSpacing: '-2px' }}>
            THE MUSIC INDUSTRY<br />
            <span style={{ color: 'transparent', WebkitTextStroke: '1px #f5f5f5' }}>IS BROKEN.</span><br />
            WE FIXED IT.
          </div>
          {!publicKey && (
            <WalletMultiButton style={{
              background: '#f5f5f5', color: '#080808', border: 'none',
              fontFamily: '"Courier New", monospace', fontSize: '11px',
              letterSpacing: '4px', padding: '16px 48px', textTransform: 'uppercase', fontWeight: '700',
            }} />
          )}
        </div>

        <div style={{ borderTop: '1px solid #1a1a1a', padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', color: '#333', letterSpacing: '2px', flexWrap: 'wrap', gap: '8px' }}>
          <img src="/soundchain-icon.svg" alt="SoundChain" style={{ height: '28px', width: 'auto', opacity: 1 }} />
          <span style={{ color: '#c8a96e' }}>PROGRAM: Bnuq1snx...ssmu</span>
          <span>COLOSSEUM FRONTIER HACKATHON</span>
        </div>

        <style>{`
          @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          ::-webkit-scrollbar { width: 4px; }
          ::-webkit-scrollbar-track { background: #080808; }
          ::-webkit-scrollbar-thumb { background: #333; }
        `}</style>
      </main>
    </>
  );
}
