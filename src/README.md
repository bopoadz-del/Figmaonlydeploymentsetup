# 📊 OpenBox + Trade Orchestrator

> **Integrated financial analysis platform with live data, composite scoring, and automated portfolio management**

---

## ⚡ **NEW**: Smart Search Integration!

The app now features intelligent autocomplete search with:
- 🔍 **Multi-source search**: Yahoo Finance + FMP + curated themes
- 🎯 **Smart aliases**: Type "apple" → finds AAPL
- 📚 **Investment themes**: Search "tech", "gold", "banking", etc.
- 🚫 **Ethics filter**: Controversial sectors excluded
- ⚡ **Lightning fast**: Cached results, 500ms debounce

**👉 [START_HERE.md](./START_HERE.md) - Quick setup guide!**

---

## 🚀 Quick Start

### 🎮 Option 1: Development Mode (Immediate - No Setup)

**✨ Already enabled! Just refresh your browser and start exploring!**

You'll see an orange banner at the top: `🔧 DEVELOPMENT MODE`

**What you get:**
- ✅ **Smart autocomplete** - Type company names, get instant results
- ✅ Instant demo data for 12 popular stocks (AAPL, MSFT, GOOGL, etc.)
- ✅ **Theme search** - Type "tech", "gold", "banking" for curated lists
- ✅ Full UI functionality - test all features
- ✅ No Edge Function deployment needed
- ✅ No API key required
- ✅ Works on mobile devices
- ⚠️ Demo data only (not real-time)

**📖 Quick guides:**
- **[START_HERE.md](./START_HERE.md)** - 30-second quick start
- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Step-by-step testing
- **[DEV_MODE.md](./DEV_MODE.md)** - Development mode details

**When to use:** Testing, mobile browsing, or when you can't access terminal

---

### 🚀 Option 2: Production Mode (Full Live Data)

**Use this when you have terminal access:**

#### 1️⃣ Deploy the Edge Function (Required)

Your backend server needs to be deployed to Supabase first:

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Deploy the Edge Function
supabase functions deploy server --project-ref uiwwjglhpzfjpbdhzwkb
```

**Test it works:**
```
https://uiwwjglhpzfjpbdhzwkb.supabase.co/functions/v1/server/make-server-517ac4ba/health
```
Should return: `{"status":"ok"}`

#### 2️⃣ Switch Off Dev Mode

1. Open `/App.tsx`
2. Change line ~59 from `const DEV_MODE = true;` to `const DEV_MODE = false;`
3. Refresh browser

#### 3️⃣ Get Your Alpha Vantage API Key

1. Get a free key: https://www.alphavantage.co/support/#api-key
2. Add it to Supabase:
   - Go to your Supabase project → Edge Functions → Secrets
   - Add: `ALPHA_VANTAGE_KEY` = your key

#### 4️⃣ Start Using the Apps

**OpenBox (Financial Analysis)**
- Search stocks by symbol or company name
- View composite scores (0-100) with Buy/Hold/Sell recommendations
- See evidence badges from industry sources (Gartner, J.D. Power, etc.)
- Clone portfolios from famous investors (Buffett, Cathie Wood, etc.)

**Trade Orchestrator (Portfolio Management)**  
- Manage positions with category caps and limits
- Sync with OpenBox for live prices and scores
- Plan rotations based on category imbalances
- Execute orders with dry-run preview

---

## 🎯 What Is This?

### OpenBox
A financial data scoring system that computes composite scores (0-100) using specific weights across four dimensions:
- **Growth (30%)**: EPS growth, revenue growth, profit margins
- **Value (25%)**: P/E ratio, P/B ratio, dividend yield
- **Health (25%)**: ROE, current ratio, debt-to-equity
- **Momentum (20%)**: Price trends, 52-week position, market cap

**Recommendations:**
- 70-100 = BUY
- 50-69 = HOLD  
- 0-49 = SELL

### Trade Orchestrator
A portfolio rotation engine that:
- Manages positions across categories (GOLD, TECH_GROWTH, TELECOM, etc.)
- Enforces category caps (max % allocation per category)
- Plans trim/buy rotations to rebalance
- Syncs with OpenBox for scoring and prices
- Supports dry-run execution with Slack approval

---

## ✨ Key Features

### Shared Between Both Apps
- **Live Data Integration**: Alpha Vantage + Yahoo Finance fallback
- **Smart Ticker Validation**: Auto-corrects typos (APPL → AAPL)
- **Invalid Ticker Detection**: Warns about delisted stocks (TWTR, YHOO)
- **Category Mapping**: Automatic classification (AAPL → TECH_GROWTH)
- **Unified Backend**: Same Edge Function, same data sources

### OpenBox-Specific
- **KPI Tiles**: Quick overview of portfolio performance
- **Stock Cards**: Visual scoring with color-coded recommendations
- **Evidence Layer**: 80+ evidence items from 25+ industry sources
- **Portfolio Cloning**: One-click import of famous investor portfolios
- **Smart Search**: Search by company name with autocomplete
- **Auto-Refresh**: Configurable background updates
- **Cache Viewer**: See all cached stocks and manage data

### Orchestrator-Specific
- **Position Management**: Add/edit/remove positions
- **Category Caps**: Define max allocation per category
- **Rotation Planning**: Automatic trim/buy recommendations
- **Sync with OpenBox**: Pull live prices and composite scores
- **Execution Preview**: Dry-run with Slack notification
- **Import/Export**: JSON file support for portfolios

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     USER INTERFACE                          │
├──────────────────────┬──────────────────────────────────────┤
│    OpenBox App       │   Trade Orchestrator App             │
│  (Financial Analysis)│  (Portfolio Management)              │
└──────────────┬───────┴──────────────┬───────────────────────┘
               │                      │
               └──────────┬───────────┘
                          │
               ┌──────────▼───────────┐
               │   Shared Utilities    │
               │  /utils/stockData.tsx │
               │  /utils/api.tsx       │
               └──────────┬───────────┘
                          │
               ┌──────────▼───────────────────────────────────┐
               │      Supabase Edge Function                  │
               │  /supabase/functions/server/index.tsx        │
               ├──────────────────────────────────────────────┤
               │  Routes:                                     │
               │  • /health                                   │
               │  • /stock/:symbol                            │
               │  • /stocks/popular                           │
               │  • /tickers (CRUD)                           │
               │  • /search/symbols                           │
               │  • /orchestrator/plan-rotations              │
               │  • /orchestrator/execute                     │
               └──────────┬───────────────────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
   ┌─────▼─────┐   ┌─────▼─────┐   ┌─────▼─────┐
   │ Alpha     │   │  Yahoo    │   │ Supabase  │
   │ Vantage   │   │  Finance  │   │ KV Store  │
   │ API       │   │ (Fallback)│   │ (Cache)   │
   └───────────┘   └───────────┘   └───────────┘
```

---

## 📦 File Structure

```
├── App.tsx                          # Main OpenBox app
├── components/
│   ├── TradeOrchestrator.tsx        # Trade Orchestrator app
│   ├── StockCard.tsx                # Stock display card
│   ├── TickerManager.tsx            # Ticker CRUD interface
│   ├── PortfolioCloning.tsx         # Clone investor portfolios
│   ├── CacheViewer.tsx              # View/manage cached stocks
│   └── orchestrator/
│       ├── PortfolioView.tsx        # Portfolio overview
│       ├── RotationPlanner.tsx      # Plan rotations
│       └── ExecutionPanel.tsx       # Execute orders
├── utils/
│   ├── stockData.tsx                # Shared: fetch, validate, categories
│   ├── api.tsx                      # Shared: API utilities
│   └── supabase/info.tsx            # Supabase config
├── supabase/functions/server/
│   ├── index.tsx                    # Main Edge Function
│   ├── evidence.tsx                 # Evidence data seeding
│   ├── financialScores.tsx          # Altman Z & Piotroski F
│   └── kv_store.tsx                 # KV utilities (protected)
└── guidelines/
    └── Evidence_Guide.md            # Evidence source documentation
```

---

## 🔧 Shared Code Integration

Both apps use the same utilities from `/utils/stockData.tsx`:

```typescript
// Validate ticker with typo correction
import { validateTicker } from './utils/stockData';
const validation = validateTicker('APPL');
// → { valid: false, corrected: 'AAPL', reason: 'Did you mean "AAPL"?' }

// Fetch stock data with fallback
import { fetchStockData } from './utils/stockData';
const stock = await fetchStockData('AAPL');
// → { symbol, price, score, action, breakdown, metrics, ... }

// Get stock category
import { getStockCategory } from './utils/stockData';
const category = getStockCategory('AAPL');
// → 'TECH_GROWTH'
```

---

## 🎯 Use Cases

### OpenBox
- Research potential investments
- Monitor portfolio with auto-refresh
- Clone famous investor strategies
- Track evidence from industry analysts

### Trade Orchestrator
- Manage multi-category portfolios
- Enforce allocation caps automatically
- Plan rebalancing trades
- Preview executions before committing

### Combined Workflow
1. **Research** in OpenBox → Identify high-scoring stocks
2. **Add** positions in Orchestrator
3. **Sync** to get live OpenBox scores
4. **Plan** rotations based on category caps
5. **Execute** with confidence

---

## 🔒 Security & Best Practices

### API Keys
✅ Store `ALPHA_VANTAGE_KEY` in Supabase secrets  
✅ Never expose keys in frontend code  
✅ Use environment variables in Edge Function  

### Rate Limits
✅ Alpha Vantage: 25 calls/day (free tier)  
✅ Use cache to minimize API usage  
✅ Yahoo Finance fallback for unlimited basic data  

### Data Quality
✅ Primary: Alpha Vantage (full scoring)  
✅ Fallback: Yahoo Finance (price only, neutral scores)  
✅ Cache: Persistent storage, manual refresh  

---

## 📊 Scoring Weights

```
Growth:    30%
Value:     25%
Health:    25%
Momentum:  20%
────────────────
Composite: 100%
```

**Evidence Boosts:**
- Fundamentals pillar → Growth score (+0 to +10)
- Balance Sheet pillar → Health score (+0 to +10)
- Market pillar → Momentum score (+0 to +10)

---

## 🆘 Troubleshooting

### "Failed to fetch" errors
✅ Deploy the Edge Function (see Quick Start)  
✅ Check URL: `/functions/v1/server/` (not `/smooth-action/`)  
✅ Test health endpoint in browser  

### "API key not configured"
✅ Add `ALPHA_VANTAGE_KEY` to Supabase Edge Function secrets  
✅ Redeploy the Edge Function after adding  

### "Rate limit reached"
✅ Use cached data (click Refresh without Force)  
✅ Wait 24 hours for daily limit reset  
✅ Upgrade to premium API if needed  

### Invalid ticker errors
✅ Use Smart Search in Ticker Manager  
✅ Check for typos (APPL → AAPL)  
✅ Avoid delisted companies (TWTR, YHOO)  

---

## 📚 Additional Documentation

- `/supabase/functions/server/README.md` - Edge Function documentation
- `/guidelines/Evidence_Guide.md` - Evidence source details
- `Attributions.md` - Data source attributions

---

## 🚦 Status

**Version**: 3.0.0  
**Last Updated**: October 31, 2025  
**Status**: ✅ Production Ready

**Recent Updates:**
- ✅ Trade Orchestrator integration
- ✅ Shared code utilities
- ✅ Unified ticker validation
- ✅ Category mapping system
- ✅ Sync with OpenBox feature

---

Built with ❤️ using Figma Make · Powered by OpenBox Financial Intelligence
