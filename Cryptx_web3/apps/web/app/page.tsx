'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, SignInButton } from '@clerk/nextjs';
import ConnectWallet from '@/components/wallet/ConnectWallet';
import FeatureGrid from '@/components/home/FeatureGrid';
import ClerkAuthSync from '@/components/auth/ClerkAuthSync';
import { walletApi } from '@/lib/portfolioApi';
import { Button } from '@/components/ui/Button';

export default function Home() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();
  const [hasWallets, setHasWallets] = useState<boolean | null>(null);
  const [checkingWallets, setCheckingWallets] = useState(false);
  const [authSynced, setAuthSynced] = useState(false);

  // Check wallets after auth is synced
  const checkWallets = useCallback(async () => {
    setCheckingWallets(true);
    try {
      const wallets = await walletApi.getWallets();
      setHasWallets(wallets.length > 0);
    } catch (error) {
      console.error('Error checking wallets:', error);
      setHasWallets(false);
    } finally {
      setCheckingWallets(false);
    }
  }, []);

  // Called when ClerkAuthSync has synced the auth token
  const handleAuthSynced = useCallback(() => {
    setAuthSynced(true);
    checkWallets();
  }, [checkWallets]);

  // Reset state when user signs out
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      setHasWallets(null);
      setAuthSynced(false);
    }
  }, [isLoaded, isSignedIn]);

  // Show loading while Clerk is loading
  if (!isLoaded) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-text-primary">
      {/* Sync Clerk auth with API client when signed in */}
      {isSignedIn && <ClerkAuthSync onAuthSynced={handleAuthSynced} />}

      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-4xl w-full">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 rounded-[2px] bg-accent flex items-center justify-center">
              <span className="text-3xl font-bold text-white">C</span>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold text-text-primary mb-4">
              CryptX
            </h1>

            <p className="text-sm uppercase tracking-wide text-text-secondary font-medium mb-8">
              WEB3 PORTFOLIO TRACKER
            </p>

            {/* Step 1: Not signed in - Show Clerk Sign In */}
            {!isSignedIn && (
              <>
                <p className="text-lg text-text-secondary mb-8 max-w-xl mx-auto leading-relaxed">
                  Track your crypto portfolio across multiple chains.
                  Sign in to get started.
                </p>
                <div className="flex justify-center gap-4">
                  <SignInButton mode="modal">
                    <Button size="lg">
                      Sign In
                    </Button>
                  </SignInButton>
                </div>
              </>
            )}

            {/* Step 2: Signed in but syncing auth or checking wallets */}
            {isSignedIn && (!authSynced || checkingWallets) && (
              <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                <p className="text-text-secondary">
                  {!authSynced ? 'Setting up your session...' : 'Loading your wallets...'}
                </p>
              </div>
            )}

            {/* Step 3: Signed in but no wallets - Show Connect Wallet */}
            {isSignedIn && authSynced && !checkingWallets && hasWallets === false && (
              <>
                <p className="text-lg text-text-secondary mb-8 max-w-xl mx-auto leading-relaxed">
                  Great! Now connect your wallet to start tracking your portfolio.
                </p>
                <div className="flex justify-center">
                  <ConnectWallet 
                    showConnectButton={true} 
                    onWalletConnected={() => setHasWallets(true)} 
                  />
                </div>
              </>
            )}
          </div>

          {/* Step 4: Signed in AND has wallets - Show Feature Grid */}
          {isSignedIn && authSynced && !checkingWallets && hasWallets === true && (
            <div className="mb-12">
              <div className="flex justify-end mb-4">
                <ConnectWallet />
              </div>
              <h2 className="text-2xl font-semibold text-text-primary text-center mb-8">
                Choose Your View
              </h2>
              <FeatureGrid />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
