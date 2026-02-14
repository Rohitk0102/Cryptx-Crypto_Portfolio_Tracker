# Wallet Persistence Fix

## Problem
Wallets were disconnecting when users logged out and logged back in. The wallets would only reappear after restarting the server.

## Root Cause
The issue was caused by **module-level caching** in the frontend portfolio page. The cache was not being cleared when users logged out, causing stale data to persist across login sessions.

```typescript
// This cache persisted across logout/login cycles
let portfolioCache: { data: PortfolioResponse; timestamp: number } | null = null;
```

When a user logged out and back in:
1. The Clerk authentication properly maintained the user ID
2. Wallets were correctly stored in the database with the user ID
3. BUT the frontend cache still contained old data (or no data)
4. The portfolio page would use the stale cache instead of fetching fresh data

## Solution
Implemented a proper cache invalidation system using browser events:

### 1. Auth Cleared Event
When user logs out, `clearClerkAuth()` now dispatches an `auth-cleared` event:

```typescript
// apps/web/lib/api.ts
export const clearClerkAuth = () => {
    clerkToken = null;
    clerkUserId = null;
    getClerkTokenFn = null;
    
    // Clear any cached data on logout
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth-cleared'));
    }
};
```

### 2. Auth Synced Event
When user logs in, `ClerkAuthSync` dispatches an `auth-synced` event:

```typescript
// apps/web/components/auth/ClerkAuthSync.tsx
if (!hasSynced) {
    setHasSynced(true);
    // Dispatch auth-synced event
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth-synced'));
    }
}
```

### 3. Portfolio Cache Invalidation
The portfolio page now listens for both events and clears its cache:

```typescript
// apps/web/app/dashboard/portfolio/page.tsx
useEffect(() => {
    loadPortfolio();
    
    // Listen for auth cleared event to reset cache
    const handleAuthCleared = () => {
        console.log('🔄 Auth cleared, resetting portfolio cache');
        portfolioCache = null;
        setPortfolio(null);
    };
    
    // Listen for auth synced event to reload portfolio
    const handleAuthSynced = () => {
        console.log('🔄 Auth synced, reloading portfolio');
        portfolioCache = null;
        loadPortfolio(true);
    };
    
    window.addEventListener('auth-cleared', handleAuthCleared);
    window.addEventListener('auth-synced', handleAuthSynced);
    
    return () => {
        window.removeEventListener('auth-cleared', handleAuthCleared);
        window.removeEventListener('auth-synced', handleAuthSynced);
    };
}, [loadPortfolio]);
```

## Testing
To verify the fix:

1. **Login** → Add a wallet → Verify it appears
2. **Logout** → Cache should be cleared
3. **Login again** → Wallet should still be there (fresh data loaded)
4. **No server restart needed** → Wallets persist across sessions

## Files Modified
- `apps/web/lib/api.ts` - Added auth-cleared event dispatch
- `apps/web/components/auth/ClerkAuthSync.tsx` - Added auth-synced event dispatch
- `apps/web/app/dashboard/portfolio/page.tsx` - Added event listeners for cache invalidation

## Database Verification
Verified that wallets are correctly stored in the database with proper user associations:
- User ID: `user_38wXOrLzZJZXpBf0bZMLcPeZ8nd` (Clerk user)
- Wallets are properly linked to this user ID
- `isActive` flag is correctly set to `true`

The database was never the issue - it was purely a frontend caching problem.
