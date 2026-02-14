'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import DashboardNav from '@/components/dashboard/DashboardNav';
import ConnectWallet from '@/components/wallet/ConnectWallet';
import ClerkAuthSync from '@/components/auth/ClerkAuthSync';
import { memo } from 'react';

// Memoize header to prevent unnecessary re-renders
const DashboardHeader = memo(function DashboardHeader({
  userAddress,
  onBackClick
}: {
  userAddress?: string;
  onBackClick: () => void;
}) {
  return (
    <header className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-4">
        {/* Back Button */}
        <button
          onClick={onBackClick}
          className="p-2 rounded-[2px] bg-surface hover:bg-surface-elevated border border-border hover:border-accent transition group"
          title="Back to Home"
        >
          <svg
            className="w-6 h-6 text-text-secondary group-hover:text-accent transition"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
        </button>

        <div>
          <h1 className="text-3xl font-bold text-text-primary">
            Dashboard
          </h1>
          <p className="text-text-secondary text-sm mt-1 font-mono">
            {userAddress}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <ConnectWallet />
      </div>
    </header>
  );
});

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const [primaryWallet, setPrimaryWallet] = useState<string | undefined>();

  useEffect(() => {
    // Wait for Clerk to load before checking authentication
    if (isLoaded && !isSignedIn) {
      router.push('/');
    }
  }, [isLoaded, isSignedIn, router]);

  // Get primary wallet from user metadata if available
  useEffect(() => {
    if (user?.publicMetadata?.primaryWallet) {
      setPrimaryWallet(user.publicMetadata.primaryWallet as string);
    }
  }, [user]);

  // Show loading state while Clerk is loading
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <div className="text-xl" style={{ color: 'var(--text-secondary)' }}>Loading...</div>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl" style={{ color: 'var(--text-secondary)' }}>Redirecting to login...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-text-primary pb-20">
      {/* Sync Clerk auth with API client */}
      <ClerkAuthSync />
      
      {/* Navigation Tabs */}
      <DashboardNav />

      {/* Header */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        <DashboardHeader
          userAddress={primaryWallet || user?.primaryEmailAddress?.emailAddress}
          onBackClick={() => router.push('/')}
        />

        {/* Page Content */}
        {children}
      </div>
    </div>
  );
}
