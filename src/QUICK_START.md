# OpenBox - Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Seed Sample Evidence Data
Click the **"Seed Evidence Data"** button in the header to load example evidence for **35+ companies across all 12 GICS sectors**:

**Information Technology**: PANW, ZS, SNOW  
**Healthcare**: UNH, JNJ, TMO  
**Financials**: JPM, V, BLK  
**Consumer Discretionary**: TSLA, AMZN, NKE  
**Consumer Staples**: KO, PG, WMT  
**Energy**: NEE, XOM, ENPH  
**Industrials**: CRH, BA, CAT  
**Materials**: LIN, NEM, SHW  
**Real Estate**: PLD, AMT, WELL  
**Utilities**: DUK, SO, AEP  
**Communication Services**: GOOGL, META, DIS  
**Transportation**: UPS, DAL

### Step 2: Clear Cache
Click **"Clear Cache"** to ensure fresh data with evidence is loaded.

### Step 3: Search Stocks
Search for any of the 35+ seeded symbols to see:
- 🏷️ **Evidence badges** on stock cards
- 📊 **Detailed evidence** in modal view
- ➕ **Score boosts** applied transparently

**Quick test**: Try PANW (IT), JNJ (Healthcare), JPM (Financials), or TSLA (Auto)

## 📋 What You'll See

### Stock Cards
- Small evidence badges at the bottom showing top 3 sources
- Color-coded by tier (green = Leader, amber = Strong Performer, etc.)

### Detail Modal
- Full evidence section with all sources
- Dates showing when evidence was published
- Explanation of how evidence boosts scoring pillars

## 🎯 Key Features

### 🔄 Auto-Refresh (NEW!)
- **Automatic Updates**: Enable auto-refresh to keep data current without manual intervention
- **Configurable Intervals**: Choose from 1 min to 1 hour refresh cycles
- **Background Updates**: Data refreshes seamlessly without disrupting your view
- **Live Status**: See exactly when data was last updated and when next refresh occurs
- **Manual Override**: Click "Refresh Now" anytime for immediate updates

📖 **Full details**: See `AUTO_UPDATE_GUIDE.md`

### Transparent Scoring
- Up to **+10 points** total from evidence
- Distributed across pillars: Leadership, Innovation, Market, etc.
- Time decay: older evidence has less impact

### Trusted Sources (Sector-Specific)
- **Tech**: Gartner MQ, Forrester Wave, G2
- **Healthcare**: NCQA, Clarivate, FDA Breakthrough
- **Financials**: Celent, Moody's, Fintech 100
- **Consumer**: J.D. Power, Interbrand, Fair Labor
- **Energy**: BloombergNEF, WoodMac, DNV
- **Industrials**: ENR, Flight Global, LEED
- **Materials**: ICIS, S&P Platts, RMI
- **Real Estate**: GRESB, NAREIT, WELL
- **Utilities**: J.D. Power, EPA Energy Star, EEI
- **Communication**: Gartner, App Annie, Hollywood Reporter
- **Transportation**: IATA, Skytrax

**See full catalog**: `guidelines/Sector_Evidence_Mapping.md`

### Protection
- ✅ Evidence **cannot override** ethics firewall
- ✅ Global **cap of +10 points** prevents dominance
- ✅ All evidence **fully transparent** and auditable

## 📖 Full Documentation

- **Technical Details**: See `EVIDENCE_FRAMEWORK.md`
- **User Guide**: See `guidelines/Evidence_Guide.md`
- **API Reference**: See evidence endpoints in backend

## 💡 Pro Tips

1. **Use smart search**: Type company names like "tesla" or "apple" instead of memorizing ticker symbols (NEW!)
2. **Enable auto-refresh**: Keep your portfolio updated automatically (5-10 min intervals recommended)
3. **Always seed first**: Sample evidence helps you understand the system
4. **Clear cache after seeding**: Ensures evidence is included in scores
5. **Check dates**: Recent evidence has more impact
6. **Read the legend**: Blue info box explains badge colors and sources
7. **Compare scores**: Load same stock before/after seeding to see effect
8. **Watch API limits**: Free tier has 25 calls/day - use longer intervals or rely on cache

## ❓ FAQ

**Q: Why don't I see evidence badges?**
- Make sure you clicked "Seed Evidence Data"
- Clear cache to reload stocks with evidence
- Only the 35+ seeded symbols have pre-loaded evidence
- Any symbol can have evidence added via backend

**Q: How much do badges affect scores?**
- Maximum +10 points across all pillars
- Typical range: +3 to +8 points
- Not enough to flip BUY/HOLD/SELL alone

**Q: Can I add my own evidence?**
- Yes, via backend KV store (requires admin access)
- See `EVIDENCE_FRAMEWORK.md` for format

**Q: What if evidence is old?**
- Time decay reduces impact exponentially
- 18-month half-life for most analyst reports
- Very old evidence (~3+ years) has minimal effect

---

**Ready to explore?** Click "Seed Evidence Data" and start searching! 🎉
