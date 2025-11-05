# 🚀 Deployment Guide

## Quick Deploy (2 minutes)

### Step 1: Install Supabase CLI

```bash
npm install -g supabase
```

### Step 2: Login to Supabase

```bash
supabase login
```

This will open your browser to authenticate.

### Step 3: Deploy the Edge Function

```bash
supabase functions deploy server --project-ref uiwwjglhpzfjpbdhzwkb
```

**Important:** The function name is `server` (from the folder `/supabase/functions/server/`), NOT the slug shown in the Supabase dashboard.

### Step 4: Add API Key

1. Go to: https://www.alphavantage.co/support/#api-key
2. Get your free API key
3. In Supabase dashboard:
   - Project Settings → Edge Functions → Secrets
   - Add: `ALPHA_VANTAGE_KEY` = `your_key_here`

### Step 5: Test the Deployment

Open in your browser:
```
https://uiwwjglhpzfjpbdhzwkb.supabase.co/functions/v1/server/make-server-517ac4ba/health
```

Should see: `{"status":"ok"}`

---

## Verify Everything Works

### Test in Browser Console

```javascript
// 1. Test health check
fetch('https://uiwwjglhpzfjpbdhzwkb.supabase.co/functions/v1/server/make-server-517ac4ba/health', {
  headers: { 'Authorization': 'Bearer YOUR_ANON_KEY' }
})
.then(r => r.json())
.then(d => console.log('Health:', d))

// 2. Test stock fetch (AAPL)
fetch('https://uiwwjglhpzfjpbdhzwkb.supabase.co/functions/v1/server/make-server-517ac4ba/stock/AAPL', {
  headers: { 'Authorization': 'Bearer YOUR_ANON_KEY' }
})
.then(r => r.json())
.then(d => console.log('Stock:', d))

// 3. Test popular stocks
fetch('https://uiwwjglhpzfjpbdhzwkb.supabase.co/functions/v1/server/make-server-517ac4ba/stocks/popular', {
  headers: { 'Authorization': 'Bearer YOUR_ANON_KEY' }
})
.then(r => r.json())
.then(d => console.log('Popular:', d))
```

---

## Common Issues

### Issue: "Failed to fetch"

**Cause:** Edge Function not deployed or wrong URL

**Fix:**
1. Redeploy: `supabase functions deploy server --project-ref uiwwjglhpzfjpbdhzwkb`
2. Verify URL uses `/functions/v1/server/` (not `/smooth-action/`)
3. Check CORS is enabled (it is by default)

### Issue: "API key not configured"

**Cause:** Alpha Vantage key missing from Supabase

**Fix:**
1. Go to Supabase → Edge Functions → Secrets
2. Add `ALPHA_VANTAGE_KEY`
3. Redeploy: `supabase functions deploy server --project-ref uiwwjglhpzfjpbdhzwkb`

### Issue: "Rate limit reached"

**Cause:** Alpha Vantage free tier = 25 calls/day

**Fix:**
- Use cached data (don't Force Refresh)
- Wait 24 hours for reset
- Upgrade to premium API if needed

---

## Understanding the URL Structure

```
https://uiwwjglhpzfjpbdhzwkb.supabase.co/functions/v1/server/make-server-517ac4ba/health
       └──────┬──────┘                           └──┬──┘ └────────┬────────┘ └──┬──┘
          Project ID                         Function    Route Prefix      Route
                                              Name
```

- **Project ID**: Your Supabase project reference
- **Function Name**: Derived from folder name `/supabase/functions/server/`
- **Route Prefix**: `/make-server-517ac4ba` (hardcoded in all routes)
- **Route**: Specific endpoint (e.g., `/health`, `/stock/AAPL`)

**Note:** The "slug" you see in the Supabase dashboard (like "smooth-action") is just a display name. The actual function URL uses the **folder name** (`server`).

---

## Updating the Edge Function

When you make changes to code in `/supabase/functions/server/`:

```bash
# Redeploy
supabase functions deploy server --project-ref uiwwjglhpzfjpbdhzwkb

# View logs
supabase functions logs server --project-ref uiwwjglhpzfjpbdhzwkb
```

---

## Environment Variables

Your Edge Function needs:

```bash
ALPHA_VANTAGE_KEY=your_key_here
```

Already configured (no action needed):
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

---

## Next Steps

After deployment:
1. ✅ Test health endpoint
2. ✅ Search a stock (AAPL) in OpenBox
3. ✅ Click "Seed Evidence Data"
4. ✅ Try "Sync with OpenBox" in Trade Orchestrator
5. ✅ Enjoy live data!

---

**Need help?** Check the main README.md for troubleshooting.
