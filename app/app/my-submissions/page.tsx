'use client';
import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

interface Submission {
  id: string;
  challenge_id: string;
  producer_wallet: string;
  audio_cid: string;
  note: string;
  is_winner: boolean;
  created_at: string;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  bounty: number;
  composer_wallet: string;
  winner_wallet: string;
  is_open: boolean;
  created_at: string;
}

export default function MySubmissions() {
  const { publicKey } = useWallet();
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [challenges, setChallenges] = useState<Record<string, Challenge>>({});
  const [loading, setLoading] = useState(true);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!publicKey) { setLoading(false); return; }
    async function load() {
      const { data: subs } = await supabase
        .from('submissions')
        .select('*')
        .eq('producer_wallet', publicKey!.toString())
        .order('created_at', { ascending: false });

      if (subs && subs.length > 0) {
        setSubmissions(subs);
        const challengeIds = [...new Set(subs.map(s => s.challenge_id))];
        const { data: chals } = await supabase
          .from('challenges')
          .select('*')
          .in('id', challengeIds);
        if (chals) {
          const map: Record<string, Challenge> = {};
          chals.forEach(c => map[c.id] = c);
          setChallenges(map);
        }
      }
      setLoading(false);
    }
    load();
  }, [publicKey]);

  const wins = submissions.filter(s => s.is_winner);
  const pending = submissions.filter(s => !s.is_winner && challenges[s.challenge_id]?.is_open);
  const lost = submissions.filter(s => !s.is_winner && !challenges[s.challenge_id]?.is_open);

  return (
    <div style={{ background: '#080808', minHeight: '100vh', color: '#f5f5f5', fontFamily: '"Courier New", monospace' }}>

      {/* NAV */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)', background: 'rgba(8,8,8,0.9)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link href="/"><img src="/soundchain-wordmark.svg" alt="SoundChain" style={{ height: '28px' }} /></Link>
          <div style={{ width: '1px', height: '16px', background: '#222' }} />
          <button onClick={() => window.history.length > 1 ? router.back() : router.push('/browse')} style={{ fontSize: '11px', letterSpacing: '3px', color: '#555', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: '"Courier New", monospace' }} onMouseEnter={e => (e.currentTarget.style.color = '#f5f5f5')} onMouseLeave={e => (e.currentTarget.style.color = '#555')}>← BACK</button>
        </div>
        <div style={{ fontSize: '11px', letterSpacing: '4px', color: '#444' }}>MY SUBMISSIONS</div>
        <WalletMultiButton style={{ background: 'transparent', color: '#f5f5f5', border: '1px solid rgba(245,245,245,0.15)', fontFamily: '"Courier New", monospace', fontSize: '10px', letterSpacing: '2px', padding: '8px 18px', textTransform: 'uppercase' }} />
      </nav>

      {/* HERO */}
      <div style={{ position: 'relative', height: '100vh', overflow: 'hidden', display: 'flex', alignItems: 'flex-end' }}>
        <div style={{ position: 'absolute', inset: 0, transform: `translateY(${scrollY * 0.3}px)` }}>
          <img
            src="/submission-hero.png"
            alt=""
            style={{
              width: '100%', height: '110%',
              objectFit: 'cover',
              objectPosition: 'center 20%',
              filter: 'brightness(0.75)',
            }}
          />
        </div>
        {/* Crop jacket text by covering bottom portion */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%', background: 'linear-gradient(to bottom, transparent, #080808)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(8,8,8,0.3) 0%, transparent 40%, transparent 50%, rgba(8,8,8,0.95) 100%)' }} />

        <div style={{ position: 'relative', zIndex: 10, padding: '0 40px 60px', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: '11px', letterSpacing: '6px', color: '#c8a96e', marginBottom: '16px' }}>── YOUR SUBMISSIONS</div>
            <div style={{ fontFamily: '"Arial Black", sans-serif', fontSize: 'clamp(56px, 9vw, 120px)', fontWeight: '900', lineHeight: 0.85, letterSpacing: '-4px' }}>
              CHECK<br />
              <span style={{ color: 'transparent', WebkitTextStroke: '2px #f5f5f5' }}>YOUR</span><br />
              RESULTS
            </div>
          </div>
          <div style={{ textAlign: 'right', paddingBottom: '8px' }}>
            <div style={{ fontFamily: '"Arial Black", sans-serif', fontSize: 'clamp(36px, 5vw, 64px)', color: '#c8a96e', letterSpacing: '-1px', lineHeight: 1 }}>
              {submissions.length}
            </div>
            <div style={{ fontSize: '11px', color: '#555', letterSpacing: '4px', marginTop: '4px' }}>
              TOTAL SUBMISSION{submissions.length !== 1 ? 'S' : ''}
            </div>
            {wins.length > 0 && (
              <div style={{ fontSize: '13px', color: '#c8a96e', letterSpacing: '2px', marginTop: '8px', border: '1px solid rgba(200,169,110,0.3)', padding: '4px 12px', display: 'inline-block' }}>
                🏆 {wins.length} WIN{wins.length !== 1 ? 'S' : ''}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* NOT CONNECTED */}
      {!publicKey && (
        <div style={{ maxWidth: '480px', margin: '80px auto', textAlign: 'center', padding: '0 40px' }}>
          <div style={{ fontSize: '13px', color: '#444', letterSpacing: '3px', marginBottom: '24px' }}>CONNECT YOUR WALLET TO SEE YOUR SUBMISSIONS</div>
          <WalletMultiButton style={{ background: '#f5f5f5', color: '#080808', border: 'none', fontFamily: '"Courier New", monospace', fontSize: '13px', letterSpacing: '2px', padding: '14px 32px', fontWeight: '700' }} />
        </div>
      )}

      {/* CONTENT */}
      {publicKey && (
        <div style={{ maxWidth: '960px', margin: '0 auto', padding: '64px 40px 120px' }}>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '80px', fontSize: '11px', color: '#444', letterSpacing: '4px' }}>LOADING...</div>
          ) : submissions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px', border: '1px solid #111' }}>
              <div style={{ fontSize: '13px', color: '#333', letterSpacing: '3px', marginBottom: '16px' }}>NO SUBMISSIONS YET</div>
              <Link href="/browse" style={{ background: '#c8a96e', color: '#080808', padding: '14px 32px', fontSize: '13px', letterSpacing: '2px', fontFamily: '"Courier New", monospace', fontWeight: '700', textDecoration: 'none', display: 'inline-block' }}>
                BROWSE CHALLENGES →
              </Link>
            </div>
          ) : (
            <>
              {/* WINS */}
              {wins.length > 0 && (
                <div style={{ marginBottom: '64px' }}>
                  <div style={{ fontSize: '11px', letterSpacing: '5px', color: '#c8a96e', marginBottom: '8px' }}>── YOU WON</div>
                  <div style={{ fontFamily: '"Arial Black", sans-serif', fontSize: '36px', fontWeight: '900', letterSpacing: '-1px', marginBottom: '32px' }}>
                    🏆 WINNING SUBMISSIONS
                  </div>
                  {wins.map((sub, i) => {
                    const ch = challenges[sub.challenge_id];
                    return (
                      <div key={sub.id} style={{ border: '1px solid rgba(200,169,110,0.3)', background: 'rgba(200,169,110,0.04)', marginBottom: '12px' }}>
                        <div style={{ borderLeft: '4px solid #c8a96e', padding: '24px 28px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                            <div>
                              <div style={{ fontSize: '10px', color: '#c8a96e', letterSpacing: '4px', marginBottom: '6px' }}>WINNER 🏆</div>
                              <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px', fontFamily: '"Arial Black", sans-serif' }}>
                                {ch?.title?.toUpperCase() || 'CHALLENGE'}
                              </div>
                              <div style={{ fontSize: '12px', color: '#555', letterSpacing: '1px' }}>
                                {new Date(sub.created_at).toLocaleDateString()} · CLOSED
                              </div>
                              {sub.note && (
                                <div style={{ fontSize: '13px', color: '#666', lineHeight: 1.7, marginTop: '10px', maxWidth: '480px', fontFamily: 'DM Sans, sans-serif' }}>
                                  "{sub.note}"
                                </div>
                              )}
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontFamily: '"Arial Black", sans-serif', fontSize: '40px', color: '#c8a96e', letterSpacing: '-1px', lineHeight: 1 }}>
                                {ch ? (ch.bounty * 0.7).toFixed(2) : '—'} SOL
                              </div>
                              <div style={{ fontSize: '10px', color: '#888', letterSpacing: '2px', marginTop: '4px' }}>SENT TO YOUR WALLET</div>
                              {ch && (
                                <Link href={`/winner/${ch.id}`} style={{ display: 'inline-block', marginTop: '12px', background: '#c8a96e', color: '#080808', padding: '10px 20px', fontSize: '11px', letterSpacing: '2px', fontFamily: '"Courier New", monospace', fontWeight: '700', textDecoration: 'none' }}>
                                  VIEW WIN →
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* PENDING */}
              {pending.length > 0 && (
                <div style={{ marginBottom: '64px' }}>
                  <div style={{ fontSize: '11px', letterSpacing: '5px', color: '#555', marginBottom: '8px' }}>── IN THE RING</div>
                  <div style={{ fontFamily: '"Arial Black", sans-serif', fontSize: '36px', fontWeight: '900', letterSpacing: '-1px', marginBottom: '32px' }}>
                    AWAITING VERDICT
                  </div>
                  {pending.map((sub, i) => {
                    const ch = challenges[sub.challenge_id];
                    return (
                      <div key={sub.id} style={{ borderLeft: '4px solid #333', borderBottom: '1px solid #111', padding: '24px 28px', marginBottom: '0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                          <div>
                            <div style={{ fontSize: '10px', color: '#555', letterSpacing: '4px', marginBottom: '6px' }}>PENDING · OPEN</div>
                            <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px', fontFamily: '"Arial Black", sans-serif', color: '#888' }}>
                              {ch?.title?.toUpperCase() || 'CHALLENGE'}
                            </div>
                            <div style={{ fontSize: '12px', color: '#444', letterSpacing: '1px' }}>
                              {new Date(sub.created_at).toLocaleDateString()} · WAITING FOR COMPOSER
                            </div>
                            {sub.note && (
                              <div style={{ fontSize: '13px', color: '#555', lineHeight: 1.7, marginTop: '10px', maxWidth: '480px', fontFamily: 'DM Sans, sans-serif' }}>
                                "{sub.note}"
                              </div>
                            )}
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontFamily: '"Arial Black", sans-serif', fontSize: '32px', color: '#555', letterSpacing: '-1px', lineHeight: 1 }}>
                              {ch ? (ch.bounty * 0.7).toFixed(2) : '—'} SOL
                            </div>
                            <div style={{ fontSize: '10px', color: '#444', letterSpacing: '2px', marginTop: '4px' }}>IF YOU WIN</div>
                            {ch && (
                              <Link href={`/challenge/${ch.id}`} style={{ display: 'inline-block', marginTop: '12px', border: '1px solid #333', color: '#555', padding: '10px 20px', fontSize: '11px', letterSpacing: '2px', fontFamily: '"Courier New", monospace', textDecoration: 'none' }}>
                                VIEW CHALLENGE →
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* LOST */}
              {lost.length > 0 && (
                <div>
                  <div style={{ fontSize: '11px', letterSpacing: '5px', color: '#333', marginBottom: '8px' }}>── CLOSED</div>
                  <div style={{ fontFamily: '"Arial Black", sans-serif', fontSize: '36px', fontWeight: '900', letterSpacing: '-1px', marginBottom: '32px', color: '#444' }}>
                    PAST SUBMISSIONS
                  </div>
                  {lost.map((sub, i) => {
                    const ch = challenges[sub.challenge_id];
                    return (
                      <div key={sub.id} style={{ borderLeft: '4px solid #1a1a1a', borderBottom: '1px solid #0d0d0d', padding: '24px 28px', marginBottom: '0', opacity: 0.6 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                          <div>
                            <div style={{ fontSize: '10px', color: '#333', letterSpacing: '4px', marginBottom: '6px' }}>CLOSED · NOT SELECTED</div>
                            <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px', fontFamily: '"Arial Black", sans-serif', color: '#444' }}>
                              {ch?.title?.toUpperCase() || 'CHALLENGE'}
                            </div>
                            <div style={{ fontSize: '12px', color: '#333', letterSpacing: '1px' }}>
                              {new Date(sub.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontFamily: '"Arial Black", sans-serif', fontSize: '28px', color: '#333', letterSpacing: '-1px', lineHeight: 1 }}>
                              {ch ? (ch.bounty * 0.7).toFixed(2) : '—'} SOL
                            </div>
                            <div style={{ fontSize: '10px', color: '#2a2a2a', letterSpacing: '2px', marginTop: '4px' }}>NOT AWARDED</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}

      <style>{`
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #080808; }
        ::-webkit-scrollbar-thumb { background: #333; }
      `}</style>
    </div>
  );
}
