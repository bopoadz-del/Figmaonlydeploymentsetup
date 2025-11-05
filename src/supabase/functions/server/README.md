# OpenBox Edge Function - Deployment Guide

## Current Status

If you're seeing `TypeError: Failed to fetch` errors, it means this Edge Function has **not been deployed to Supabase yet**.

## Quick Deploy (2 minutes)

### Prerequisites
- Supabase CLI installed (`npm install -g supabase`)
- Logged into Supabase (`supabase login`)
- Your project reference ID (from Supabase dashboard URL)

### Deploy Command

```bash
# From your project root directory, run:
supabase functions deploy server --project-ref YOUR-PROJECT-REF

# Example:
supabase functions deploy server --project-ref uiwwjglhpzfjpbdhzwkb
```

### What Gets Deployed

This directory contains:
- `index.tsx` - Main server with all routes
- `evidence.tsx` - Evidence framework
- `financialScores.tsx` - Altman Z-Score & Piotroski F-Score
- `kv_store.tsx` - Database utilities (protected, do not edit)

All files are deployed together as a single Edge Function named "server".

## Verify Deployment

After deploying, check:

1. **In Supabase Dashboard:**
   - Go to Edge Functions section
   - You should see a function named "server"
   - Status should be "Active"

2. **In Your Browser:**
   - Open OpenBox application
   - The orange warning banner should disappear
   - Console should show: `[OpenBox] ✅ Edge Function is healthy`

3. **Manual Test:**
   Open this URL in your browser:
   ```
   https://YOUR-PROJECT-REF.supabase.co/functions/v1/server/make-server-517ac4ba/health
   ```
   
   You should see: `{"status":"ok"}`

## Routes Available

Once deployed, these routes will be available:

- `GET /make-server-517ac4ba/health` - Health check
- `GET /make-server-517ac4ba/stocks/popular` - Popular stock symbols
- `GET /make-server-517ac4ba/stock/:symbol` - Analyze a stock
- `POST /make-server-517ac4ba/ticker/correction` - Ticker autocorrection
- `GET /make-server-517ac4ba/search` - Search stock symbols
- `GET /make-server-517ac4ba/evidence/seed` - Seed evidence data
- `GET /make-server-517ac4ba/evidence/:symbol` - Get evidence for symbol
- `GET /make-server-517ac4ba/test-api` - Test Alpha Vantage API key

## Environment Variables Required

The function needs these secrets (already configured in your project):
- `ALPHA_VANTAGE_KEY` - For live stock data
- `SUPABASE_URL` - Auto-provided by Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Auto-provided by Supabase

## Troubleshooting

### "Function not found" error
**Fix:** The function must be named exactly "server" (matches the directory name).
```bash
supabase functions deploy server --project-ref YOUR-PROJECT-REF
```

### "Permission denied"
**Fix:** Make sure you're logged in:
```bash
supabase login
```

### Deployment succeeds but still getting errors
**Fix:** 
1. Hard refresh your browser (Ctrl+Shift+R / Cmd+Shift+R)
2. Check function logs in Supabase dashboard
3. Verify the function is showing as "Active"
4. Try the manual health check test above

### API rate limit errors after deployment
This is normal! Alpha Vantage free tier has 25 calls/day limit.
- Use the Cache Viewer to see which stocks are cached
- Cached stocks load instantly without API calls
- Consider upgrading your Alpha Vantage key for more calls

## Code Structure

```
index.tsx
├── Imports & Configuration
├── Helper Functions
│   ├── fetchStockData() - Alpha Vantage API calls
│   ├── passesEthicsFilter() - Controversial sector filtering
│   ├── calculateGrowthScore()
│   ├── calculateValueScore()
│   ├── calculateHealthScore()
│   ├── calculateMomentumScore()
│   └── calculateCompositeScore()
├── Route Handlers (all prefixed with /make-server-517ac4ba)
│   ├── GET /health
│   ├── GET /stocks/popular
│   ├── GET /stock/:symbol
│   ├── POST /ticker/correction
│   ├── GET /search
│   ├── GET /evidence/seed
│   ├── GET /evidence/:symbol
│   └── GET /test-api
└── Server Startup (Deno.serve)
```

## Architecture

```
Browser (OpenBox)
    ↓
    ↓ HTTPS Request
    ↓
Supabase Edge Function (This file)
    ↓
    ├─→ Alpha Vantage API (live stock data)
    ├─→ PostgreSQL KV Store (caching & evidence)
    └─→ Evidence Framework (scoring boosts)
```

## Need Help?

- **Full setup guide:** `/SETUP_COMPLETE.md` in project root
- **Quick deploy:** `/DEPLOY_EDGE_FUNCTION.md` in project root  
- **Supabase docs:** https://supabase.com/docs/guides/functions/deploy
- **Check logs:** Supabase Dashboard → Edge Functions → server → Logs

## Deploy Now!

```bash
# Run this command from your project root:
supabase functions deploy server --project-ref uiwwjglhpzfjpbdhzwkb
```

Replace `uiwwjglhpzfjpbdhzwkb` with your actual project reference ID.
