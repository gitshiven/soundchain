'use client';
import { useEffect, useState } from 'react';

interface LogoTransitionProps {
  onComplete: () => void;
}

export function LogoTransition({ onComplete }: LogoTransitionProps) {
  const [phase, setPhase] = useState<'in'|'hold'|'out'>('in');

  useEffect(() => {
    const holdTimer = setTimeout(() => setPhase('hold'), 1000);
    const outTimer = setTimeout(() => setPhase('out'), 3200);
    const doneTimer = setTimeout(() => onComplete(), 4200);
    return () => { clearTimeout(holdTimer); clearTimeout(outTimer); clearTimeout(doneTimer); };
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#000',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      opacity: phase === 'out' ? 0 : 1,
      transition: 'opacity 1s ease',
    }}>
      <img
        src="/soundchain-chrome.png"
        alt="SOUNDCHAIN"
        style={{
          width: 'min(55vw, 480px)',
          display: 'block',
          mixBlendMode: 'lighten',
          opacity: phase === 'in' ? 0 : 1,
          transform: phase === 'in' ? 'scale(1.06)' : 'scale(1.0)',
          transition: 'opacity 1.2s ease, transform 2.4s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      />
    </div>
  );
}
