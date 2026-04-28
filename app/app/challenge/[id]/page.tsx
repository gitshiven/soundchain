'use client';
import { useState, useRef, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { uploadAudio } from '../../../lib/ipfs';
import { LogoTransition } from '../../components/LogoTransition';

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

export default function SubmitVersion({ params }: { params: Promise<{ id: string }> }) {
  const { publicKey } = useWallet();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<'idle'|'launching'|'uploading'|'saving'|'done'|'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    async function load() {
      const resolvedParams = await params;
      const { data, error } = await supabase.from('challenges').select('*').eq('id', resolvedParams.id).single();
      if (!error && data) setChallenge(data);
      setLoading(false);
    }
    load();
  }, []);

  const handleFile = (f: File) => {
    if (f.size > 50*1024*1024) { setErrorMsg('FILE TOO LARGE — MAX 50MB'); setStatus('error'); return; }
    setFile(f); setStatus('idle'); setErrorMsg('');
  };

  const handlePlayOriginal = () => {
    if (!challenge?.audio_cid) return;
    const url = `https://gateway.pinata.cloud/ipfs/${challenge.audio_cid}`;
    if (audioRef.current) {
      if (playing) { audioRef.current.pause(); setPlaying(false); }
      else { audioRef.current.src = url; audioRef.current.play(); setPlaying(true); }
    }
  };

  const handleSubmit = async () => {
    if (!publicKey) { setErrorMsg('WALLET NOT CONNECTED'); setStatus('error'); return; }
    if (!file) { setErrorMsg('NO REMIX FILE SELECTED'); setStatus('error'); return; }
    if (!challenge) return;
    setStatus('launching');
  };

  const handleLaunchComplete = async () => {
    if (!publicKey || !file || !challenge) return;
    try {
      setStatus('uploading');
      const cid = await uploadAudio(file);
      setStatus('saving');
      const { error } = await supabase.from('submissions').insert({
        challenge_id: challenge.id,
        producer_wallet: publicKey.toString(),
        audio_cid: cid,
        note: note.trim(),
        is_winner: false,
      });
      if (error) throw new Error(error.message);
      setStatus('done');
    } catch (e: any) {
      setErrorMsg(e.message || 'SUBMISSION FAILED');
      setStatus('error');
    }
  };

  const daysLeft = (created: string) => Math.max(0, 7 - Math.floor((Date.now() - new Date(created).getTime()) / 86400000));

  const inputStyle = {
    width: '100%', background: 'transparent', border: 'none',
    borderBottom: '1px solid #1e1e1e', padding: '14px 0',
    fontSize: '15px', color: '#f5f5f5', fontFamily: 'DM Sans, sans-serif',
    outline: 'none', transition: 'border-color 0.2s',
  } as React.CSSProperties;

  const labelStyle = {
    fontSize: '11px', letterSpacing: '3px', color: '#555',
    fontFamily: '"Courier New", monospace', marginBottom: '10px', display: 'block',
  } as React.CSSProperties;

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

  if (status === 'launching') return <LogoTransition onComplete={handleLaunchComplete} />;

  if (status === 'done') return (
    <div style={{ background: '#080808', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Courier New", monospace', color: '#f5f5f5', padding: '32px' }}>
      <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: '11px', letterSpacing: '6px', color: '#c8a96e', marginBottom: '24px' }}>── VERSION SUBMITTED ──</div>
        <div style={{ fontFamily: '"Arial Black", sans-serif', fontSize: '72px', fontWeight: '900', lineHeight: 0.9, marginBottom: '32px' }}>
          IN THE<br />
          <span style={{ color: 'transparent', WebkitTextStroke: '1.5px #f5f5f5' }}>RING</span><br />
          NOW
        </div>
        <div style={{ fontSize: '14px', color: '#555', lineHeight: 1.8, marginBottom: '32px' }}>
          Your remix is on IPFS permanently.<br />
          The composer will review all submissions<br />
          and select a winner. May the best beat win.
        </div>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Link href="/browse" style={{ background: '#f5f5f5', color: '#080808', padding: '14px 28px', fontSize: '14px', letterSpacing: '2px', fontWeight: '700', textDecoration: 'none' }}>← BACK TO VAULT</Link>
          <Link href="/" style={{ border: '1px solid #333', color: '#f5f5f5', padding: '14px 28px', fontSize: '14px', letterSpacing: '2px', textDecoration: 'none' }}>HOME</Link>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ background: '#080808', minHeight: '100vh', color: '#f5f5f5', fontFamily: 'DM Sans, sans-serif' }}>
      <audio ref={audioRef} onEnded={() => setPlaying(false)} />

      {/* NAV */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)', background: 'rgba(8,8,8,0.85)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link href="/"><img src="/soundchain-wordmark.svg" alt="SoundChain" style={{ height: '28px' }} /></Link>
          <div style={{ width: '1px', height: '16px', background: '#222' }} />
          <button onClick={() => window.history.length > 1 ? router.back() : router.push('/browse')}
            style={{ fontSize: '11px', letterSpacing: '3px', color: '#555', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: '"Courier New", monospace' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#f5f5f5')}
            onMouseLeave={e => (e.currentTarget.style.color = '#555')}
          >← BACK</button>
        </div>
        <div style={{ fontSize: '11px', letterSpacing: '4px', color: '#444', fontFamily: '"Courier New", monospace' }}>SUBMIT VERSION</div>
        <WalletMultiButton style={{ background: 'transparent', color: '#f5f5f5', border: '1px solid rgba(245,245,245,0.15)', fontFamily: '"Courier New", monospace', fontSize: '10px', letterSpacing: '2px', padding: '8px 18px', textTransform: 'uppercase' }} />
      </nav>

      {/* HERO IMAGE */}
      <div style={{ position: 'relative', height: '60vh', overflow: 'hidden', marginTop: '57px' }}>
        <img src="/submit-hero.png" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />
        {/* Dark overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(8,8,8,0.3) 0%, rgba(8,8,8,0.1) 40%, rgba(8,8,8,0.97) 100%)' }} />
        {/* Amber bleed */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', background: 'linear-gradient(to bottom, transparent, rgba(180,100,30,0.08))' }} />

        {/* Hero text — bottom left */}
        <div style={{ position: 'absolute', bottom: '40px', left: '40px', zIndex: 10 }}>
          <div style={{ fontSize: '11px', letterSpacing: '6px', color: '#c8a96e', fontFamily: '"Courier New", monospace', marginBottom: '12px' }}>
            ── {challenge.title.toUpperCase()}
          </div>
          <div style={{ fontFamily: '"Arial Black", sans-serif', fontSize: 'clamp(48px, 7vw, 96px)', fontWeight: '900', lineHeight: 0.88, letterSpacing: '-3px' }}>
            DROP<br />
            YOUR<br />
            <span style={{ color: 'transparent', WebkitTextStroke: '2px #f5f5f5' }}>REMIX</span>
          </div>
        </div>

        {/* Bounty — bottom right */}
        <div style={{ position: 'absolute', bottom: '40px', right: '40px', zIndex: 10, textAlign: 'right' }}>
          <div style={{ fontSize: '10px', color: '#555', letterSpacing: '3px', fontFamily: '"Courier New", monospace', marginBottom: '4px' }}>WIN UP TO</div>
          <div style={{ fontFamily: '"Arial Black", sans-serif', fontSize: '56px', color: '#c8a96e', letterSpacing: '-2px', lineHeight: 1 }}>
            {(challenge.bounty * 0.7).toFixed(2)} SOL
          </div>
          <div style={{ fontSize: '10px', color: '#555', letterSpacing: '2px', fontFamily: '"Courier New", monospace', marginTop: '4px' }}>
            {daysLeft(challenge.created_at)} DAYS LEFT · {challenge.composer_wallet.slice(0, 8)}...
          </div>
          {challenge.audio_cid && (
            <button onClick={handlePlayOriginal}
              style={{ marginTop: '12px', background: 'transparent', border: '1px solid #333', color: '#888', padding: '10px 20px', fontSize: '12px', letterSpacing: '2px', fontFamily: '"Courier New", monospace', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#c8a96e'; (e.currentTarget as HTMLButtonElement).style.color = '#c8a96e'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#333'; (e.currentTarget as HTMLButtonElement).style.color = '#888'; }}
            >{playing ? '⏸ PAUSE' : '▶ PLAY ORIGINAL'}</button>
          )}
        </div>
      </div>

      {/* CHALLENGE BRIEF STRIP */}
      <div style={{ background: '#0a0a0a', borderTop: '1px solid #111', borderBottom: '1px solid #111', padding: '20px 40px' }}>
        <div style={{ fontSize: '14px', color: '#555', lineHeight: 1.7, maxWidth: '700px', fontFamily: 'DM Sans, sans-serif' }}>
          {challenge.description}
        </div>
      </div>

      {/* FORM */}
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '64px 40px 120px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px' }}>

          {/* LEFT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
            <div>
              <div style={{ fontSize: '11px', letterSpacing: '5px', color: '#c8a96e', fontFamily: '"Courier New", monospace', marginBottom: '10px' }}>01 ── YOUR REMIX</div>
              <div style={{ fontFamily: '"Arial Black", sans-serif', fontSize: '36px', fontWeight: '900', letterSpacing: '-1px', lineHeight: 1 }}>UPLOAD YOUR<br />VERSION</div>
            </div>

            <div>
              <label style={labelStyle}>AUDIO FILE</label>
              <div
                onDragOver={e => { e.preventDefault(); (e.currentTarget as HTMLDivElement).style.borderColor = '#c8a96e'; }}
                onDragLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = file ? '#c8a96e' : '#1e1e1e'; }}
                onDrop={e => { e.preventDefault(); (e.currentTarget as HTMLDivElement).style.borderColor = '#1e1e1e'; const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                onClick={() => fileRef.current?.click()}
                style={{ border: `1px dashed ${file ? '#c8a96e' : '#1e1e1e'}`, padding: '40px 24px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', background: file ? 'rgba(200,169,110,0.03)' : 'transparent' }}
              >
                {file ? (
                  <>
                    <div style={{ fontSize: '14px', color: '#c8a96e', marginBottom: '4px', fontWeight: '500' }}>✓ {file.name}</div>
                    <div style={{ fontSize: '12px', color: '#555' }}>{(file.size / 1024 / 1024).toFixed(2)} MB · click to change</div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '28px', color: '#1a1a1a', marginBottom: '12px' }}>▲</div>
                    <div style={{ fontSize: '14px', color: '#333', marginBottom: '8px' }}>Drop your remix here</div>
                    <div style={{ fontSize: '12px', color: '#252525' }}>WAV · MP3 · FLAC — max 50MB</div>
                    <div style={{ fontSize: '11px', color: '#c8a96e', marginTop: '10px', letterSpacing: '1px', fontFamily: '"Courier New", monospace' }}>STORED PERMANENTLY ON IPFS</div>
                  </>
                )}
              </div>
              <input ref={fileRef} type="file" accept=".mp3,.wav,.flac" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
            </div>

            <div>
              <label style={labelStyle}>NOTE TO COMPOSER (OPTIONAL)</label>
              <textarea value={note} onChange={e => setNote(e.target.value)}
                placeholder="Tell the composer about your approach, tools, influences..."
                maxLength={300} rows={5}
                style={{ ...inputStyle, resize: 'none', lineHeight: 1.8, fontSize: '15px' }}
                onFocus={e => (e.target.style.borderBottomColor = '#c8a96e')}
                onBlur={e => (e.target.style.borderBottomColor = '#1e1e1e')}
              />
              <div style={{ fontSize: '10px', color: '#2a2a2a', marginTop: '4px', textAlign: 'right', fontFamily: '"Courier New", monospace' }}>{note.length}/300</div>
            </div>
          </div>

          {/* RIGHT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div>
              <div style={{ fontSize: '11px', letterSpacing: '5px', color: '#c8a96e', fontFamily: '"Courier New", monospace', marginBottom: '10px' }}>02 ── IF YOU WIN</div>
              <div style={{ fontFamily: '"Arial Black", sans-serif', fontSize: '36px', fontWeight: '900', letterSpacing: '-1px', lineHeight: 1 }}>YOUR<br />ENTRY</div>
            </div>

            <div style={{ border: '1px solid #111', padding: '28px', background: '#0a0a0a' }}>
              <div style={{ fontSize: '13px', color: '#444', letterSpacing: '2px', fontFamily: '"Courier New", monospace', marginBottom: '12px' }}>CHALLENGE</div>
              <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '6px' }}>{challenge.title}</div>
              <div style={{ fontSize: '12px', color: '#333', letterSpacing: '1px', fontFamily: '"Courier New", monospace', marginBottom: '24px' }}>
                BY {challenge.composer_wallet.slice(0, 8)}...{challenge.composer_wallet.slice(-6)}
              </div>

              <div style={{ height: '3px', display: 'flex', gap: '1px', marginBottom: '12px' }}>
                <div style={{ flex: 70, background: '#c8a96e' }} />
                <div style={{ flex: 20, background: '#333' }} />
                <div style={{ flex: 10, background: '#1a1a1a' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', letterSpacing: '1px', fontFamily: '"Courier New", monospace', marginBottom: '24px' }}>
                <span style={{ color: '#c8a96e' }}>70% YOU WIN</span>
                <span style={{ color: '#555' }}>20% PLATFORM</span>
                <span style={{ color: '#333' }}>10% COMPOSER</span>
              </div>

              <div style={{ fontFamily: '"Arial Black", sans-serif', fontSize: '52px', color: '#c8a96e', letterSpacing: '-1px', lineHeight: 1 }}>
                {(challenge.bounty * 0.7).toFixed(2)} SOL
              </div>
              <div style={{ fontSize: '11px', color: '#444', letterSpacing: '2px', fontFamily: '"Courier New", monospace', marginTop: '6px' }}>SENT DIRECTLY TO YOUR WALLET</div>
            </div>

            <div>
              {[
                ['STORAGE', 'IPFS / PERMANENT'],
                ['NETWORK', 'SOLANA DEVNET'],
                ['PAYOUT', 'AUTO ON WINNER SELECT'],
                ['YOUR WALLET', publicKey ? publicKey.toString().slice(0, 8) + '...' + publicKey.toString().slice(-6) : 'NOT CONNECTED'],
              ].map(([k, v]) => (
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

            {status !== 'idle' && status !== 'error' && status !== 'done' && status !== 'launching' && (
              <div style={{ border: '1px solid rgba(200,169,110,0.2)', padding: '14px 16px', fontSize: '13px', color: '#c8a96e', fontFamily: '"Courier New", monospace', letterSpacing: '1px' }}>
                {status === 'uploading' && '▲ Uploading to IPFS...'}
                {status === 'saving' && '💾 Saving submission...'}
              </div>
            )}

            <div style={{ marginTop: 'auto' }}>
              {!publicKey ? (
                <WalletMultiButton style={{ width: '100%', background: '#f5f5f5', color: '#080808', border: 'none', fontFamily: 'DM Sans, sans-serif', fontSize: '15px', letterSpacing: '1px', padding: '18px', fontWeight: '600', justifyContent: 'center' }} />
              ) : (
                <button onClick={handleSubmit}
                  style={{ width: '100%', background: '#c8a96e', color: '#080808', border: 'none', padding: '20px', fontSize: '15px', letterSpacing: '2px', fontFamily: 'DM Sans, sans-serif', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', textTransform: 'uppercase' }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                >
                  Submit Version — Enter The Ring
                </button>
              )}
              <div style={{ fontSize: '12px', color: '#2a2a2a', marginTop: '10px', textAlign: 'center', lineHeight: 1.6, fontFamily: '"Courier New", monospace' }}>
                Free to submit · No SOL required · Winner gets {(challenge.bounty * 0.7).toFixed(2)} SOL
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
