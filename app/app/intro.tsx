'use client';
import { useEffect, useRef, useState } from 'react';

export function IntroGate({ onEnter }: { onEnter: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(true);
  const [textVisible, setTextVisible] = useState(false);

  useEffect(() => {
    // Fade in text after 1.5 seconds
    const timer = setTimeout(() => setTextVisible(true), 1500);
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') handleEnter();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const handleEnter = () => {
    setVisible(false);
    setTimeout(onEnter, 800);
  };

  return (
    <div
      onClick={handleEnter}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#000',
        cursor: 'pointer',
        transition: 'opacity 0.8s ease',
        opacity: visible ? 1 : 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* VIDEO */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: 0.7,
        }}
      >
        <source src="/intro.mp4" type="video/mp4" />
      </video>

      {/* OVERLAY */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.7) 100%)',
      }} />

      {/* CENTER CONTENT */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px',
        transition: 'opacity 1.2s ease',
        opacity: textVisible ? 1 : 0,
      }}>
        <div style={{
          fontSize: '11px',
          letterSpacing: '12px',
          textTransform: 'uppercase',
          color: '#f5f5f5',
          fontFamily: '"Courier New", monospace',
          fontWeight: '700',
        }}>
          SOUNDCHAIN
        </div>

        <div style={{
          width: '1px',
          height: '40px',
          background: 'linear-gradient(to bottom, transparent, #c8a96e, transparent)',
        }} />

        <div style={{
          fontSize: '9px',
          letterSpacing: '6px',
          textTransform: 'uppercase',
          color: '#c8a96e',
          fontFamily: '"Courier New", monospace',
          animation: 'blink 1.8s ease-in-out infinite',
        }}>
          PRESS ENTER
        </div>
      </div>

      {/* BOTTOM LEFT */}
      <div style={{
        position: 'absolute',
        bottom: '24px',
        left: '32px',
        fontSize: '9px',
        letterSpacing: '3px',
        color: '#333',
        fontFamily: '"Courier New", monospace',
        transition: 'opacity 1.2s ease',
        opacity: textVisible ? 1 : 0,
      }}>
        DECENTRALIZED MUSIC PROTOCOL
      </div>

      {/* BOTTOM RIGHT */}
      <div style={{
        position: 'absolute',
        bottom: '24px',
        right: '32px',
        fontSize: '9px',
        letterSpacing: '3px',
        color: '#333',
        fontFamily: '"Courier New", monospace',
        transition: 'opacity 1.2s ease',
        opacity: textVisible ? 1 : 0,
      }}>
        SOLANA / DEVNET
      </div>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }
      `}</style>
    </div>
  );
}
