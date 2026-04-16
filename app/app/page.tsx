'use client';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';

export default function Home() {
  const { publicKey } = useWallet();

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/10">
        <div className="text-xl font-bold tracking-tight">
          🎵 SoundChain
        </div>
        <WalletMultiButton />
      </nav>

      {/* Hero */}
      <div className="flex flex-col items-center justify-center text-center px-4 pt-32 pb-20">
        <div className="text-sm font-mono text-purple-400 mb-4 tracking-widest uppercase">
          Built on Solana
        </div>
        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
          Music Collaboration<br />
          <span className="text-purple-400">On-Chain</span>
        </h1>
        <p className="text-lg text-white/60 max-w-xl mb-10">
          Composers post challenges. Producers compete. 
          Winners get paid automatically with royalties split forever on Solana.
        </p>

        {publicKey ? (
          <div className="flex flex-col items-center gap-4">
            <div className="text-green-400 text-sm font-mono">
              ✓ Wallet connected: {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
            </div>
            <div className="flex gap-4">
              <button className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-semibold transition">
                Post a Challenge
              </button>
              <button className="border border-white/20 hover:border-white/40 text-white px-8 py-3 rounded-lg font-semibold transition">
                Browse Challenges
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <p className="text-white/40 text-sm">Connect your Phantom wallet to get started</p>
            <WalletMultiButton />
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="flex justify-center gap-16 py-16 border-t border-white/10">
        <div className="text-center">
          <div className="text-3xl font-bold text-purple-400">$20B+</div>
          <div className="text-white/40 text-sm mt-1">Royalty market</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-purple-400">0%</div>
          <div className="text-white/40 text-sm mt-1">Middlemen</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-purple-400">100%</div>
          <div className="text-white/40 text-sm mt-1">On-chain</div>
        </div>
      </div>
    </main>
  );
}
