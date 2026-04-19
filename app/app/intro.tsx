'use client';
import { useEffect, useRef, useState } from 'react';

export function IntroGate({ onEnter }: { onEnter: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(true);
  const [textVisible, setTextVisible] = useState(false);

  const quotes = [
    '"I am a God"',
    '"Everything I\'m not made me everything I am"',
    '"The beat is the truth"',
    '"Without music, life would be a mistake"',
    '"I just want to make things that make people feel good"',
    '"Music gives color to the air of the moment"',
    '"संगीत वो है जो शब्दों से परे है"',
    '"Music is the shorthand of emotion"',
    '"God is in every beat"',
    '"Make it bounce"',
    '"We all shine on"',
    '"Music is my religion"',
  ];

  useEffect(() => {
    const timer = setTimeout(() => setTextVisible(true), 1500);
    if (videoRef.current) videoRef.current.play().catch(() => {});
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let W = 0, H = 0;
    let cols: any[] = [];
    let animId: number;

    function resize() {
      W = canvas.offsetWidth;
      H = canvas.offsetHeight;
      canvas.width = W;
      canvas.height = H;
      setupCols();
    }

    function setupCols() {
      cols = [];
      const numCols = Math.floor(W / 260);
      for (let i = 0; i < numCols; i++) {
        const shuffled = [...quotes].sort(() => Math.random() - 0.5);
        cols.push({
          x: (i / numCols) * W + 20 + Math.random() * 40,
          y: Math.random() * H * 2 - H,
          speed: 0.25 + Math.random() * 0.2,
          quotes: shuffled,
          lineHeight: 36,
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      cols.forEach(col => {
        col.y -= col.speed;
        if (col.y < -H * 2) {
          col.y = H + 100;
          col.quotes = [...quotes].sort(() => Math.random() - 0.5);
        }
        col.quotes.forEach((q: string, i: number) => {
          const y = col.y + i * col.lineHeight;
          if (y < -40 || y > H + 40) return;
          const isHindi = /[\u0900-\u097F]/.test(q);
          ctx.font = isHindi
            ? '13px serif'
            : 'italic 11px Georgia, serif';
          ctx.fillStyle = isHindi
            ? 'rgba(200,169,110,0.09)'
            : 'rgba(245,245,245,0.055)';
          ctx.textAlign = 'left';
          ctx.fillText(q, col.x, y);
        });
      });
      animId = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener('resize', resize);
    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
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
        position: 'fixed', inset: 0, zIndex: 9999,
        background: '#000', cursor: 'pointer',
        transition: 'opacity 0.8s ease',
        opacity: visible ? 1 : 0,
      }}
    >
      {/* VIDEO */}
      <video
        ref={videoRef}
        autoPlay muted loop playsInline
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover', opacity: 0.55,
        }}
      >
        <source src="/intro.mp4" type="video/mp4" />
      </video>

      {/* QUOTE WATERFALL */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          pointerEvents: 'none',
        }}
      />

      {/* VIGNETTE OVERLAY */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.7) 100%)',
        pointerEvents: 'none',
      }} />

      {/* CENTER CONTENT */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: '20px',
        transition: 'opacity 1.4s ease',
        opacity: textVisible ? 1 : 0,
        pointerEvents: 'none',
      }}>

        {/* PULSING LOGO */}
        <div style={{
          width: '64px', height: '64px',
          borderRadius: '50%',
          border: '1px solid rgba(200,169,110,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'pulse-ring 3s ease-in-out infinite',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute', inset: '-8px',
            borderRadius: '50%',
            border: '1px solid rgba(200,169,110,0.15)',
            animation: 'pulse-ring 3s ease-in-out infinite 0.4s',
          }} />
          <div style={{
            position: 'absolute', inset: '-16px',
            borderRadius: '50%',
            border: '1px solid rgba(200,169,110,0.07)',
            animation: 'pulse-ring 3s ease-in-out infinite 0.8s',
          }} />
          <img
            src="/soundchain-icon.svg"
            alt="SoundChain"
            style={{
              width: '32px', height: '32px',
              animation: 'breathe 3s ease-in-out infinite',
            }}
          />
        </div>

        {/* METALLIC 3D TITLE */}
        <div style={{
          transform: 'perspective(600px) rotateX(6deg)',
          transformOrigin: 'center bottom',
        }}>
          <div style={{
            fontFamily: '"Arial Black", Arial, sans-serif',
            fontSize: 'clamp(36px, 6vw, 72px)',
            fontWeight: '900',
            letterSpacing: '14px',
            textTransform: 'uppercase',
            background: 'linear-gradient(180deg, #ffffff 0%, #e8e8e8 20%, #c8a96e 55%, #8a7040 80%, #b0a080 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textShadow: 'none',
            filter: 'drop-shadow(0 2px 8px rgba(200,169,110,0.3)) drop-shadow(0 -1px 2px rgba(255,255,255,0.1))',
            lineHeight: 1,
          }}>
            SOUNDCHAIN
          </div>
        </div>

        {/* DIVIDER LINE */}
        <div style={{
          width: '1px', height: '36px',
          background: 'linear-gradient(to bottom, transparent, #c8a96e, transparent)',
        }} />

        {/* PRESS ENTER */}
        <div style={{
          fontSize: '9px', letterSpacing: '7px',
          textTransform: 'uppercase', color: '#c8a96e',
          fontFamily: '"Courier New", monospace',
          animation: 'blink 1.8s ease-in-out infinite',
        }}>
          PRESS ENTER
        </div>

      </div>

      {/* BOTTOM LEFT */}
      <div style={{
        position: 'absolute', bottom: '24px', left: '32px',
        fontSize: '9px', letterSpacing: '3px', color: '#333',
        fontFamily: '"Courier New", monospace',
        transition: 'opacity 1.2s ease',
        opacity: textVisible ? 1 : 0,
        pointerEvents: 'none',
      }}>
        DECENTRALIZED MUSIC PROTOCOL
      </div>

      {/* BOTTOM RIGHT */}
      <div style={{
        position: 'absolute', bottom: '24px', right: '32px',
        fontSize: '9px', letterSpacing: '3px', color: '#333',
        fontFamily: '"Courier New", monospace',
        transition: 'opacity 1.2s ease',
        opacity: textVisible ? 1 : 0,
        pointerEvents: 'none',
      }}>
        SOLANA / DEVNET
      </div>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.06); }
        }
        @keyframes pulse-ring {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.04); }
        }
      `}</style>
    </div>
  );
}
