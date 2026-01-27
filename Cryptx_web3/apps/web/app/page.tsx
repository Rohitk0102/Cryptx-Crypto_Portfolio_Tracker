import ConnectWallet from '@/components/wallet/ConnectWallet';
import FeatureGrid from '@/components/home/FeatureGrid';

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground relative overflow-hidden selection:bg-primary/30">
      {/* Dynamic Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px] animate-float" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent/10 blur-[120px] animate-float" style={{ animationDelay: '-3s' }} />
        <div className="absolute top-[40%] left-[50%] transform -translate-x-1/2 w-[60%] h-[40%] bg-blue-500/10 blur-[100px]" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Navbar */}
        <nav className="flex justify-between items-center mb-24 glass rounded-2xl p-4 mx-2 md:mx-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <span className="text-xl font-bold text-white">C</span>
            </div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              CryptX
            </h1>
          </div>
          <ConnectWallet />
        </nav>

        {/* Hero Section */}
        <div className="max-w-5xl mx-auto text-center relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-primary/5 to-transparent blur-3xl -z-10" />

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 border border-white/10 animate-fade-in-up">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm font-medium text-gray-300">Web3 Portfolio Tracker 2.0</span>
          </div>

          <h2 className="text-6xl md:text-8xl font-black text-white mb-8 tracking-tight leading-tight">
            Track Your Crypto <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
              Across the Metaverse
            </span>
          </h2>

          <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
            The ultimate dashboard for your decentralized life. Aggregate wallets,
            track DeFi yields, and manage NFTs in one stunning interface.
          </p>
        </div>

        {/* Features Section */}
        <div className="relative mt-12 mb-32">
          <FeatureGrid />
        </div>

        {/* Footer */}
        <footer className="text-center text-gray-600 py-12 border-t border-white/5">
          <p>© 2024 CryptX. Built for the decentralized future.</p>
        </footer>
      </div>
    </main>
  );
}

