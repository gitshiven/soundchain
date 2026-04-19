'use client';
import { useState, useRef, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL, Transaction } from '@solana/web3.js';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { uploadAudio } from '../../lib/ipfs';
import { supabase } from '../../lib/supabase';

export default function PostChallenge() {
  const router = useRouter();
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [bounty, setBounty] = useState('1.0');
  const [deadline, setDeadline] = useState('7');
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle'|'uploading'|'signing'|'confirming'|'saving'|'done'|'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [txSig, setTxSig] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const PLATFORM_WALLET = new PublicKey('7HnGmPpzAtCkwufNwW7W9ji6EuDL8qf8ZjquiAK4FdqL');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let W = 0, H = 0;
    let coins: any[] = [];

    const producers = [
      { label: 'PROD_1', wallet: '7HnGm...4FdqL' },
      { label: 'PROD_2', wallet: 'ART1s...Wa11t' },
      { label: 'PROD_3', wallet: 'PR0Du...3rNod' },
      { label: 'PROD_4', wallet: 'BEAT4...kr99X' },
    ];

    function resize() {
      W = canvas.offsetWidth;
      H = canvas.offsetHeight;
      canvas.width = W;
      canvas.height = H;
    }

    function spawnCoin() {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.min(W, H) * 0.4;
      coins.push({
        x: W / 2 + dist * Math.cos(angle),
        y: H / 2 + dist * Math.sin(angle),
        tx: W / 2 + (Math.random() - 0.5) * 40,
        ty: H / 2 + (Math.random() - 0.5) * 40,
        size: 5 + Math.random() * 4,
        alpha: 1,
        progress: 0,
        speed: 0.015 + Math.random() * 0.02,
        spin: Math.random() * Math.PI * 2,
        spinSpeed: (Math.random() - 0.5) * 0.15,
      });
    }

    function drawProducer(x: number, y: number, wallet: string, t: number, idx: number) {
      const bob = Math.sin(t * 0.001 + idx * 1.2) * 4;
      const py = y + bob;
      ctx.beginPath();
      ctx.ellipse(x, py + 28, 14, 4, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fill();
      ctx.fillStyle = '#1c1c1c';
      ctx.fillRect(x - 11, py - 14, 22, 26);
      ctx.fillStyle = '#2a2a2a';
      ctx.fillRect(x - 8, py - 28, 16, 16);
      ctx.fillStyle = '#c8a96e';
      ctx.fillRect(x - 5, py - 22, 3, 3);
      ctx.fillRect(x + 2, py - 22, 3, 3);
      ctx.beginPath();
      ctx.arc(x, py - 22, 10, Math.PI, 0);
      ctx.strokeStyle = '#c8a96e';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.fillStyle = '#c8a96e';
      ctx.fillRect(x - 12, py - 24, 4, 6);
      ctx.fillRect(x + 8, py - 24, 4, 6);
      ctx.strokeStyle = '#1c1c1c';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x - 11, py - 5);
      ctx.lineTo(x - 22, py - 18);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + 11, py - 5);
      ctx.lineTo(x + 22, py - 18);
      ctx.stroke();
      ctx.fillStyle = '#111';
      ctx.fillRect(x - 10, py + 12, 8, 12);
      ctx.fillRect(x + 2, py + 12, 8, 12);
      ctx.fillStyle = 'rgba(20,20,20,0.9)';
      ctx.fillRect(x - 28, py + 28, 56, 14);
      ctx.fillStyle = '#555';
      ctx.font = '7px Space Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(wallet, x, py + 38);
    }

    function drawDJSetup(t: number) {
      const cx = W / 2, cy = H / 2;
      const rot = t * 0.0015;
      [1.6, 1.3, 1.0].forEach((r, i) => {
        ctx.beginPath();
        ctx.arc(cx, cy, Math.min(W, H) * 0.28 * r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(200,169,110,${0.04 + i * 0.02})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      });
      ctx.fillStyle = '#111';
      ctx.strokeStyle = '#1e1e1e';
      ctx.lineWidth = 1;
      ctx.fillRect(cx - 44, cy - 20, 88, 40);
      ctx.strokeRect(cx - 44, cy - 20, 88, 40);
      ctx.save();
      ctx.translate(cx - 22, cy);
      ctx.rotate(rot);
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fillStyle = '#0a0a0a';
      ctx.fill();
      [12, 8, 5, 3].forEach(r => {
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(200,169,110,0.12)';
        ctx.lineWidth = 1;
        ctx.stroke();
      });
      ctx.beginPath();
      ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = '#c8a96e';
      ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.translate(cx + 22, cy);
      ctx.rotate(-rot * 0.8);
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fillStyle = '#0a0a0a';
      ctx.fill();
      [12, 8, 5, 3].forEach(r => {
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(200,169,110,0.10)';
        ctx.lineWidth = 1;
        ctx.stroke();
      });
      ctx.beginPath();
      ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = '#c8a96e';
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = '#0d0d0d';
      ctx.fillRect(cx - 10, cy - 8, 20, 16);
      ctx.fillStyle = '#c8a96e';
      ctx.fillRect(cx - 6, cy - 4, 12, 3);
      ctx.fillRect(cx - 6, cy + 2, 8, 3);
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(200,169,110,0.5)';
      ctx.lineWidth = 1.5;
      for (let i = -30; i <= 30; i++) {
        const wh = Math.sin(i * 0.3 + t * 0.04) * 8 * Math.abs(Math.sin(t * 0.008));
        i === -30 ? ctx.moveTo(cx + i, cy - 30 - wh) : ctx.lineTo(cx + i, cy - 30 - wh);
      }
      ctx.stroke();
      const bVal = parseFloat(bounty) || 1.0;
      ctx.fillStyle = 'rgba(8,8,8,0.9)';
      ctx.fillRect(cx - 36, cy + 28, 72, 26);
      ctx.strokeStyle = 'rgba(200,169,110,0.2)';
      ctx.lineWidth = 1;
      ctx.strokeRect(cx - 36, cy + 28, 72, 26);
      ctx.fillStyle = '#c8a96e';
      ctx.font = 'bold 16px Bebas Neue, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(bVal.toFixed(1) + ' SOL PRIZE', cx, cy + 45);
    }

    function drawCoin(coin: any) {
      ctx.save();
      ctx.globalAlpha = coin.alpha;
      ctx.translate(coin.x, coin.y);
      ctx.rotate(coin.spin);
      ctx.beginPath();
      ctx.arc(0, 0, coin.size, 0, Math.PI * 2);
      ctx.fillStyle = '#c8a96e';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(-coin.size * 0.2, -coin.size * 0.2, coin.size * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fill();
      ctx.fillStyle = 'rgba(8,8,8,0.6)';
      ctx.font = `bold ${coin.size * 1.4}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText('◎', 0, coin.size * 0.45);
      ctx.restore();
    }

    function animate(t: number) {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#080808';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(255,255,255,0.015)';
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 48) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 48) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      const grad = ctx.createLinearGradient(0, H * 0.5, 0, H);
      grad.addColorStop(0, 'transparent');
      grad.addColorStop(1, '#080808');
      ctx.fillStyle = grad;
      ctx.fillRect(0, H * 0.5, W, H * 0.5);
      drawDJSetup(t);
      const r = Math.min(W, H) * 0.3;
      producers.forEach((p, i) => {
        const angle = (i / producers.length) * Math.PI * 2 - Math.PI / 2;
        drawProducer(W / 2 + r * Math.cos(angle), H / 2 + r * Math.sin(angle), p.wallet, t, i);
      });
      const bVal = parseFloat(bounty) || 1.0;
      if (Math.random() < Math.min(0.12, bVal * 0.06)) spawnCoin();
      coins = coins.filter(c => c.progress < 1 && c.alpha > 0.05);
      coins.forEach(c => {
        c.progress += c.speed;
        c.x += (c.tx - c.x) * c.speed * 3;
        c.y += (c.ty - c.y) * c.speed * 3;
        c.spin += c.spinSpeed;
        if (c.progress > 0.6) c.alpha -= 0.035;
        drawCoin(c);
      });
      animRef.current = requestAnimationFrame(animate);
    }

    resize();
    window.addEventListener('resize', resize);
    animRef.current = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [bounty]);

  const handleFile = (f: File) => {
    if (f.size > 50 * 1024 * 1024) { setErrorMsg('FILE TOO LARGE — MAX 50MB'); setStatus('error'); return; }
    setFile(f); setStatus('idle'); setErrorMsg('');
  };

  const handleSubmit = async () => {
    if (!publicKey) { setErrorMsg('WALLET NOT CONNECTED'); setStatus('error'); return; }
    if (!title.trim()) { setErrorMsg('TITLE REQUIRED'); setStatus('error'); return; }
    if (!file) { setErrorMsg('NO AUDIO FILE SELECTED'); setStatus('error'); return; }
    if (parseFloat(bounty) <= 0) { setErrorMsg('BOUNTY MUST BE GREATER THAN 0'); setStatus('error'); return; }

    try {
      // STEP 1 — Upload to IPFS
      setStatus('uploading');
      const cid = await uploadAudio(file);

      // STEP 2 — Send SOL via Phantom
      setStatus('signing');
      const bountyLamports = Math.floor(parseFloat(bounty) * LAMPORTS_PER_SOL);
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: PLATFORM_WALLET,
          lamports: bountyLamports,
        })
      );
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;
      setStatus('confirming');
      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, 'confirmed');

      // STEP 3 — Save to Supabase
      setStatus('saving' as any);
      const { error } = await supabase.from('challenges').insert({
        title: title.trim(),
        description: description.trim(),
        bounty: parseFloat(bounty),
        composer_wallet: publicKey.toString(),
        audio_cid: cid,
        is_open: true,
        on_chain_address: signature,
      });
      if (error) throw new Error(error.message);

      setTxSig(signature);
      setStatus('done');

    } catch (e: any) {
      setErrorMsg(e.message || 'TRANSACTION FAILED');
      setStatus('error');
    }
  };

  const inputStyle = {
    width: '100%', background: 'transparent', border: 'none',
    borderBottom: '1px solid #1e1e1e', padding: '14px 0',
    fontSize: '16px', color: '#f5f5f5', fontFamily: 'DM Sans, sans-serif',
    outline: 'none', transition: 'border-color 0.2s',
  } as React.CSSProperties;

  const labelStyle = {
    fontSize: '11px', letterSpacing: '3px', color: '#555',
    fontFamily: '"Courier New", monospace', marginBottom: '10px', display: 'block',
  } as React.CSSProperties;

  if (status === 'done') return (
    <div style={{ background: '#080808', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans, sans-serif', color: '#f5f5f5', padding: '32px' }}>
      <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: '11px', letterSpacing: '6px', color: '#c8a96e', marginBottom: '24px', fontFamily: '"Courier New", monospace' }}>── CHALLENGE POSTED ──</div>
        <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '80px', lineHeight: 0.9, marginBottom: '32px' }}>
          ON<br/><span style={{ color: 'transparent', WebkitTextStroke: '1.5px #f5f5f5' }}>CHAIN</span><br/>NOW
        </div>
        <div style={{ fontSize: '12px', color: '#555', letterSpacing: '1px', marginBottom: '8px', fontFamily: '"Courier New", monospace' }}>TX SIGNATURE</div>
        <div style={{ fontSize: '11px', color: '#c8a96e', wordBreak: 'break-all', marginBottom: '32px', border: '1px solid #1a1a1a', padding: '12px', fontFamily: '"Courier New", monospace' }}>{txSig}</div>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Link href="/" style={{ background: '#f5f5f5', color: '#080808', padding: '14px 28px', fontSize: '14px', letterSpacing: '2px', fontWeight: '600', textDecoration: 'none' }}>← HOME</Link>
          <Link href="/browse" style={{ border: '1px solid #333', color: '#f5f5f5', padding: '14px 28px', fontSize: '14px', letterSpacing: '2px', textDecoration: 'none' }}>BROWSE →</Link>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ background: '#080808', minHeight: '100vh', color: '#f5f5f5', fontFamily: 'DM Sans, sans-serif' }}>

      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '14px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(12px)', background: 'rgba(8,8,8,0.85)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link href="/">
            <img src="/soundchain-wordmark.svg" alt="SoundChain" style={{ height: '28px' }} />
          </Link>
          <div style={{ width: '1px', height: '16px', background: '#222' }} />
          <button
            onClick={() => router.back()}
            style={{ fontSize: '11px', letterSpacing: '3px', color: '#555', fontFamily: '"Courier New", monospace', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            onMouseEnter={e => (e.currentTarget.style.color = '#f5f5f5')}
            onMouseLeave={e => (e.currentTarget.style.color = '#555')}
            >← BACK</button>
        </div>
        <div style={{ fontSize: '11px', letterSpacing: '4px', color: '#444', fontFamily: '"Courier New", monospace' }}>
          POST A CHALLENGE
        </div>
        <WalletMultiButton style={{
          background: 'transparent', color: '#f5f5f5',
          border: '1px solid rgba(245,245,245,0.15)',
          fontFamily: '"Courier New", monospace', fontSize: '10px',
          letterSpacing: '2px', padding: '8px 18px', textTransform: 'uppercase',
        }} />
      </nav>

      <div style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
        <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '80px 40px 52px', zIndex: 10,
          background: 'linear-gradient(to top, rgba(8,8,8,0.98) 0%, transparent 100%)',
        }}>
          <div style={{ fontSize: '11px', letterSpacing: '6px', color: '#c8a96e', fontFamily: '"Courier New", monospace', marginBottom: '16px' }}>
            ── POST A CHALLENGE
          </div>
          <div style={{
            fontFamily: 'Bebas Neue, sans-serif',
            fontSize: 'clamp(56px, 9vw, 112px)',
            lineHeight: 0.88, letterSpacing: '3px', marginBottom: '24px',
          }}>
            THROW THE<br />
            <span style={{ color: '#c8a96e' }}>BOUNTY</span><br />
            <span style={{ color: 'transparent', WebkitTextStroke: '2px #f5f5f5' }}>START THE</span><br />
            BATTLE
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: '#444', fontFamily: '"Courier New", monospace' }}>
            <div style={{ width: '32px', height: '1px', background: '#333' }} />
            SCROLL TO POST YOUR CHALLENGE
            <div style={{ width: '32px', height: '1px', background: '#333' }} />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '80px 40px 120px' }}>
        <div style={{ marginBottom: '64px', borderBottom: '1px solid #111', paddingBottom: '32px' }}>
          <div style={{ fontSize: '11px', letterSpacing: '5px', color: '#c8a96e', fontFamily: '"Courier New", monospace', marginBottom: '10px' }}>
            01 ── YOUR CHALLENGE
          </div>
          <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '56px', letterSpacing: '2px' }}>
            SET THE STAGE
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px' }}>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>

            <div>
              <label style={labelStyle}>CHALLENGE TITLE</label>
              <input
                value={title} onChange={e => setTitle(e.target.value)}
                placeholder="Name your challenge..." maxLength={60}
                style={inputStyle}
                onFocus={e => (e.target.style.borderBottomColor = '#c8a96e')}
                onBlur={e => (e.target.style.borderBottomColor = '#1e1e1e')}
              />
              <div style={{ fontSize: '11px', color: '#2a2a2a', marginTop: '4px', textAlign: 'right', fontFamily: '"Courier New", monospace' }}>{title.length}/60</div>
            </div>

            <div>
              <label style={labelStyle}>DESCRIBE THE VIBE</label>
              <textarea
                value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Genre, mood, tempo, BPM, references..." maxLength={300} rows={4}
                style={{ ...inputStyle, resize: 'none', lineHeight: 1.8, fontSize: '15px' }}
                onFocus={e => (e.target.style.borderBottomColor = '#c8a96e')}
                onBlur={e => (e.target.style.borderBottomColor = '#1e1e1e')}
              />
            </div>

            <div>
              <label style={labelStyle}>UPLOAD YOUR STEM</label>
              <div
                onDragOver={e => { e.preventDefault(); (e.currentTarget as HTMLDivElement).style.borderColor = '#c8a96e'; }}
                onDragLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = file ? '#c8a96e' : '#1e1e1e'; }}
                onDrop={e => { e.preventDefault(); (e.currentTarget as HTMLDivElement).style.borderColor = '#1e1e1e'; const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                onClick={() => fileRef.current?.click()}
                style={{
                  border: `1px dashed ${file ? '#c8a96e' : '#1e1e1e'}`,
                  padding: '32px 24px', textAlign: 'center', cursor: 'pointer',
                  transition: 'all 0.2s', background: file ? 'rgba(200,169,110,0.03)' : 'transparent',
                }}
              >
                {file ? (
                  <>
                    <div style={{ fontSize: '14px', color: '#c8a96e', marginBottom: '4px', fontWeight: '500' }}>✓ {file.name}</div>
                    <div style={{ fontSize: '12px', color: '#555' }}>{(file.size / 1024 / 1024).toFixed(2)} MB · click to change</div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '14px', color: '#333', marginBottom: '8px' }}>Drop your audio file here</div>
                    <div style={{ fontSize: '12px', color: '#252525' }}>WAV · MP3 · FLAC — max 50MB</div>
                    <div style={{ fontSize: '11px', color: '#c8a96e', marginTop: '8px', letterSpacing: '1px', fontFamily: '"Courier New", monospace' }}>STORED PERMANENTLY ON IPFS</div>
                  </>
                )}
              </div>
              <input ref={fileRef} type="file" accept=".mp3,.wav,.flac" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
            </div>

            <div>
              <label style={labelStyle}>SOL BOUNTY — PRIZE POOL</label>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
                <input
                  type="number" value={bounty} onChange={e => setBounty(e.target.value)}
                  min="0.1" step="0.1"
                  style={{ ...inputStyle, fontSize: '48px', fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '2px', paddingBottom: '6px' }}
                  onFocus={e => (e.target.style.borderBottomColor = '#c8a96e')}
                  onBlur={e => (e.target.style.borderBottomColor = '#1e1e1e')}
                />
                <div style={{ fontSize: '16px', letterSpacing: '3px', color: '#c8a96e', paddingBottom: '12px', fontFamily: '"Courier New", monospace' }}>SOL</div>
              </div>
              <div style={{ fontSize: '12px', color: '#333', marginTop: '6px' }}>
                ≈ ${Math.round((parseFloat(bounty) || 0) * 142)} USD · locked in escrow on submit
              </div>
            </div>

            <div>
              <label style={labelStyle}>BATTLE DEADLINE</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['3', '7', '14', '30'].map(d => (
                  <button key={d} onClick={() => setDeadline(d)} style={{
                    flex: 1, background: deadline === d ? '#f5f5f5' : 'transparent',
                    color: deadline === d ? '#080808' : '#555',
                    border: `1px solid ${deadline === d ? '#f5f5f5' : '#1e1e1e'}`,
                    padding: '12px', fontSize: '14px', letterSpacing: '1px',
                    fontFamily: 'DM Sans, sans-serif', fontWeight: '500',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}>
                    {d} days
                  </button>
                ))}
              </div>
            </div>

          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

            <div>
              <div style={{ fontSize: '11px', letterSpacing: '5px', color: '#c8a96e', fontFamily: '"Courier New", monospace', marginBottom: '10px' }}>02 ── PREVIEW</div>
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '56px', letterSpacing: '2px' }}>CONFIRM</div>
            </div>

            <div style={{ border: '1px solid #111', padding: '28px', background: '#0a0a0a' }}>
              <div style={{ fontSize: '22px', fontWeight: '600', marginBottom: '8px', color: title ? '#f5f5f5' : '#2a2a2a', transition: 'color 0.3s' }}>
                {title || 'Your challenge title...'}
              </div>
              <div style={{ fontSize: '12px', color: '#333', letterSpacing: '1px', fontFamily: '"Courier New", monospace', marginBottom: '20px' }}>
                {publicKey ? publicKey.toString().slice(0, 8) + '...' + publicKey.toString().slice(-6) : 'WALLET_NOT_CONNECTED'} · OPEN · {deadline} DAYS
              </div>
              <div style={{ fontSize: '14px', color: '#444', lineHeight: 1.8, marginBottom: '24px', minHeight: '52px' }}>
                {description || 'Your description will appear here...'}
              </div>
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '56px', color: '#c8a96e', letterSpacing: '2px', lineHeight: 1 }}>
                {parseFloat(bounty) || 0} SOL
              </div>
              <div style={{ fontSize: '11px', color: '#444', letterSpacing: '2px', fontFamily: '"Courier New", monospace', marginBottom: '20px' }}>PRIZE POOL IN ESCROW</div>
              <div style={{ height: '3px', display: 'flex', gap: '1px', marginBottom: '12px' }}>
                <div style={{ flex: 70, background: '#c8a96e' }} />
                <div style={{ flex: 20, background: '#333' }} />
                <div style={{ flex: 10, background: '#1a1a1a' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', letterSpacing: '1px', fontFamily: '"Courier New", monospace' }}>
                <span style={{ color: '#c8a96e' }}>70% PRODUCER</span>
                <span style={{ color: '#555' }}>20% PLATFORM</span>
                <span style={{ color: '#333' }}>10% COMPOSER</span>
              </div>
            </div>

            <div>
              {[['NETWORK', 'SOLANA DEVNET'], ['CONTRACT', 'Bnuq1snx...ssmu'], ['STORAGE', 'IPFS / PERMANENT'], ['ESCROW', 'AUTO-LOCKED ON SUBMIT']].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #0d0d0d', fontSize: '12px', fontFamily: '"Courier New", monospace' }}>
                  <span style={{ color: '#333' }}>{k}</span>
                  <span style={{ color: '#555' }}>{v}</span>
                </div>
              ))}
            </div>

            {status === 'error' && (
              <div style={{ border: '1px solid rgba(255,46,0,0.3)', padding: '14px 16px', fontSize: '13px', color: '#ff2e00', fontFamily: '"Courier New", monospace', letterSpacing: '1px' }}>
                ✕ {errorMsg}
              </div>
            )}

            {status !== 'idle' && status !== 'error' && (
              <div style={{ border: '1px solid rgba(200,169,110,0.2)', padding: '14px 16px', fontSize: '13px', color: '#c8a96e', fontFamily: '"Courier New", monospace', letterSpacing: '1px' }}>
                {status === 'uploading' && '⬆ Uploading to IPFS...'}
                {status === 'signing' && '◎ Awaiting Phantom signature...'}
                {status === 'confirming' && '⟳ Confirming on Solana...'}
                {status === 'saving' && '🗃 Saving to database...'}
              </div>
            )}

            <div style={{ marginTop: 'auto' }}>
              {!publicKey ? (
                <WalletMultiButton style={{
                  width: '100%', background: '#f5f5f5', color: '#080808',
                  border: 'none', fontFamily: 'DM Sans, sans-serif', fontSize: '15px',
                  letterSpacing: '1px', padding: '18px', fontWeight: '600', justifyContent: 'center',
                }} />
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={status !== 'idle' && status !== 'error'}
                  style={{
                    width: '100%',
                    background: status === 'idle' || status === 'error' ? '#c8a96e' : '#1a1a1a',
                    color: status === 'idle' || status === 'error' ? '#080808' : '#444',
                    border: 'none', padding: '20px', fontSize: '15px', letterSpacing: '2px',
                    fontFamily: 'DM Sans, sans-serif', fontWeight: '700',
                    cursor: status === 'idle' || status === 'error' ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s', textTransform: 'uppercase',
                  }}
                >
                  {status === 'idle' || status === 'error' ? 'Post Challenge — Phantom Will Confirm' : 'Processing...'}
                </button>
              )}
              <div style={{ fontSize: '12px', color: '#2a2a2a', marginTop: '10px', textAlign: 'center', lineHeight: 1.6, fontFamily: '"Courier New", monospace' }}>
                {parseFloat(bounty) || 0} SOL locked in escrow · cannot be undone
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
