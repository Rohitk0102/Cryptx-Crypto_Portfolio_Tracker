# Fix 404 Error - Connection Failed

## Problem
Getting "Connection Failed - Request failed with status code 404" error when trying to access the dashboard.

## Root Cause
The frontend needs to be restarted to pick up the environment variable changes we made earlier.

## Solution

### 1. Stop the Frontend Server
Press `Ctrl+C` in the terminal where the frontend is running.

### 2. Restart the Frontend
```bash
cd apps/web
npm run dev
```

### 3. Verify the API URL
The frontend should now use the correct API URL: `http://localhost:5001`

The routes are structured as:
- Backend: `http://localhost:5001/api/portfolio`
- Backend: `http://localhost:5001/api/wallets`
- Backend: `http://localhost:5001/api/forecasting`

## Environment Configuration

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:5001
```

### Backend (.env)
```
PORT=5001
```

## Verification Steps

1. **Check Backend is Running**
   ```bash
   curl http://localhost:5001/health
   ```
   Should return: `{"status":"ok",...}`

2. **Check API Routes**
   After logging in, check browser console for API calls:
   - Should see: `http://localhost:5001/api/portfolio`
   - Should NOT see: `http://localhost:5001/api/api/portfolio` (double /api)

3. **Test Portfolio Page**
   - Login with Clerk
   - Navigate to dashboard
   - Should see your wallets (if any)
   - No 404 errors in console

## Common Issues

### Issue: Still getting 404 after restart
**Solution**: Clear browser cache and hard reload (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)

### Issue: Backend not responding
**Solution**: Check if backend is running on port 5001:
```bash
cd apps/api
npm run dev
```

### Issue: Database connection error
**Solution**: Check if your Neon database is active (it may have paused)

## Files Modified
- `apps/web/.env.local` - Set `NEXT_PUBLIC_API_URL=http://localhost:5001`
- `apps/web/lib/api.ts` - Added cache invalidation events
- `apps/web/components/auth/ClerkAuthSync.tsx` - Added auth-synced event
- `apps/web/app/dashboard/portfolio/page.tsx` - Added event listeners

## Next Steps
After restarting the frontend:
1. Login with Clerk
2. Your wallets should persist across logout/login
3. No more 404 errors
4. Portfolio data loads correctly
