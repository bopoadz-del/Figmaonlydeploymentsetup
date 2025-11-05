# 🎮 Development Mode Guide

## What Is It?

Development Mode lets you test OpenBox **immediately** without deploying the Edge Function or setting up an API key. Perfect for mobile users or quick testing!

## How to Enable (Already Done!)

In `/App.tsx` line ~59:
```typescript
const DEV_MODE = true;  // ✅ Already enabled for you!
```

## What You See

### Purple Banner at Top
```
🎮 DEVELOPMENT MODE
Using demo data • No Edge Function needed • Set DEV_MODE = false in App.tsx when deployed
```

### Console Log
```
[DEV MODE] 🎮 Development mode enabled - using demo data (no Edge Function needed)
[DEV MODE] ✅ Using demo data symbols: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', ...]
[DEV MODE] ✅ Loaded AAPL from demo data
```

## What Works

✅ **12 Demo Stocks:**
- AAPL (Apple)
- MSFT (Microsoft)
- GOOGL (Alphabet)
- AMZN (Amazon)
- NVDA (NVIDIA)
- META (Meta)
- TSLA (Tesla)
- JPM (JPMorgan)
- NOK (Nokia)
- TSM (Taiwan Semi)
- PSA (Public Storage)
- SMC (SMC Corporation)

✅ **Full Features:**
- Stock cards with scores
- KPI tiles
- Evidence badges
- Portfolio cloning
- Stock details modal
- All UI components

✅ **No Requirements:**
- ❌ No Edge Function deployment
- ❌ No API key needed
- ❌ No terminal access required
- ❌ No Supabase setup

## What Doesn't Work

❌ **Limited to 12 stocks** - Only the symbols above have demo data  
❌ **Not real-time** - Data is static/frozen  
❌ **No custom tickers** - Can't search random stocks  
❌ **No live updates** - Prices don't change  
❌ **No auto-refresh** - Background updates use demo data too  

## Switching to Production Mode

When you have terminal access:

### Step 1: Deploy Edge Function
```bash
npm install -g supabase
supabase login
supabase functions deploy server --project-ref uiwwjglhpzfjpbdhzwkb
```

### Step 2: Add API Key
Get free key: https://www.alphavantage.co/support/#api-key  
Add to Supabase → Edge Functions → Secrets: `ALPHA_VANTAGE_KEY`

### Step 3: Disable Dev Mode
In `/App.tsx` line ~59:
```typescript
const DEV_MODE = false;  // Switch to production
```

### Step 4: Refresh Browser
All errors gone! Live data flows! 🎉

## Troubleshooting

### "No demo data for CHADI" (or other symbols)
**Cause:** That stock isn't in the demo data set  
**Fix:** Use one of the 12 available symbols above

### "I want to test more stocks"
**Fix:** Deploy the Edge Function for unlimited stocks

### "Banner won't go away"
**Fix:** Change `DEV_MODE = false` in `/App.tsx` and refresh

### "I deployed but still seeing demo data"
**Fix:** Make sure you set `DEV_MODE = false` after deployment

## Why Use Dev Mode?

✅ **Perfect for:**
- Mobile users (no terminal)
- Quick UI testing
- Demonstrating features
- Learning the interface
- Offline development

❌ **Not ideal for:**
- Real stock analysis
- Live trading decisions
- Portfolio tracking
- Production use

## Summary

```
┌────────────────────────────────────────────────────────┐
│                   DEV MODE vs PRODUCTION               │
├────────────────────────────────────────────────────────┤
│                                                        │
│  🎮 DEV MODE              │  🚀 PRODUCTION MODE       │
│  ────────────────          │  ─────────────────       │
│  • 12 demo stocks          │  • Any stock symbol      │
│  • Static data             │  • Live data             │
│  • No setup needed         │  • Requires deployment   │
│  • Works on mobile         │  • Needs terminal        │
│  • Instant start           │  • 5 min setup           │
│  • Great for testing       │  • Great for analysis    │
│                            │                          │
└────────────────────────────────────────────────────────┘
```

---

**Current Status:** 🎮 You're in DEV MODE - ready to use right now!

**Next Step:** Refresh your browser and explore the demo stocks!
