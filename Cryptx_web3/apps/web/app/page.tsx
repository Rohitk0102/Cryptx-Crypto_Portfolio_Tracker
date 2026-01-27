import ConnectWallet from '@/components/wallet/ConnectWallet';
import FeatureGrid from '@/components/home/FeatureGrid';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-text-primary">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Navbar */}
        <nav className="flex justify-between items-center mb-24 pb-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[2px] bg-accent flex items-center justify-center">
              <span className="text-xl font-bold text-background">C</span>
            </div>
            <h1 className="text-2xl font-semibold text-text-primary">
              CryptX
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <ConnectWallet />
          </div>
        </nav>

        {/* Hero Section */}
        <div className="max-w-4xl mx-auto mb-32">
          <div className="mb-6">
            <span className="text-sm uppercase tracking-wide text-text-secondary font-medium">
              WEB3 PORTFOLIO TRACKER
            </span>
          </div>

          <h2 className="text-5xl md:text-6xl font-bold text-text-primary mb-8 leading-tight">
            Track Your Crypto
            <br />
            <span className="text-text-secondary">
              Across Multiple Chains
            </span>
          </h2>

          <p className="text-lg text-text-secondary mb-12 max-w-2xl leading-relaxed">
            Centralized dashboard for decentralized assets. Aggregate wallets,
            track portfolio value, and monitor real-time market data.
          </p>
        </div>

        {/* Features Section */}
        <div className="mb-32">
          <FeatureGrid />
        </div>

        {/* Footer */}
        <footer className="text-center text-text-secondary py-12 border-t border-border">
          <p className="text-sm">© 2024 CryptX. Built for the decentralized future.</p>
        </footer>
      </div>
    </main>
  );
}
