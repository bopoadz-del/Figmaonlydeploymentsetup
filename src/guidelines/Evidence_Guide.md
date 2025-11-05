# Evidence Layer - Quick Start Guide

## What is the Evidence Layer?

The Evidence Layer adds trusted third-party validation to OpenBox scores. When industry analysts like Gartner, Forrester, or G2 rank a company highly, or when companies earn certifications like LEED or Fair Trade, these achievements provide transparent score boosts.

## How It Works

### 1. Evidence Sources

Different industries use different trusted sources. OpenBox supports **all 12 GICS sectors**:

- **Information Technology**: Gartner Magic Quadrant, Forrester Wave, G2 reviews
- **Healthcare**: NCQA ratings, Clarivate R&D, FDA Breakthrough designations
- **Financials**: Celent, Moody's/S&P ratings, Fintech 100
- **Consumer Discretionary**: J.D. Power, IIHS safety, Interbrand, Fair Labor
- **Consumer Staples**: Interbrand, Sustainalytics ESG, Kantar Retail, Fair Trade
- **Energy**: BloombergNEF, WoodMac, DNV/EPA certifications
- **Industrials**: ENR Top 250, LEED, Flight Global, EquipmentWatch
- **Materials**: ICIS Top 100, S&P Platts, RMI certifications
- **Real Estate**: GRESB ESG, NAREIT, WELL/LEED certifications
- **Utilities**: J.D. Power, EPA Energy Star, EEI grid innovation
- **Communication Services**: Gartner, App Annie, Hollywood Reporter
- **Transportation**: IATA/Skytrax safety and quality ratings

**See detailed mapping**: `guidelines/Sector_Evidence_Mapping.md`

### 2. Score Boosts

Evidence provides **up to +10 points total** distributed across scoring pillars:

- **Leadership**: Industry analyst recognition, brand rankings
- **Innovation/AI**: Technology rankings, R&D certifications
- **Fundamentals**: Financial stability ratings
- **Market**: Customer satisfaction scores
- **Ethics**: Environmental and social certifications

### 3. Time Decay

Evidence loses relevance over time:
- **Fast decay (12 months)**: Customer reviews, satisfaction surveys
- **Medium decay (18 months)**: Analyst reports, industry rankings
- **Slow decay (36 months)**: Safety certifications, environmental standards

## Getting Started

### Step 1: Seed Sample Data

1. Click the **"Seed Evidence Data"** button in the header
2. This loads example evidence for **35+ stocks across all 12 sectors**:
   - **IT**: PANW, ZS, SNOW (Gartner, Forrester, G2)
   - **Healthcare**: UNH, JNJ, TMO (NCQA, Clarivate, FDA)
   - **Financials**: JPM, V, BLK (Celent, Moody's, Fintech 100)
   - **Consumer Disc**: TSLA, AMZN, NKE (J.D. Power, IIHS, Interbrand)
   - **Consumer Staples**: KO, PG, WMT (Interbrand, Sustainalytics)
   - **Energy**: NEE, XOM, ENPH (BloombergNEF, WoodMac, DNV)
   - **Industrials**: CRH, BA, CAT (ENR, Flight Global, LEED)
   - **Materials**: LIN, NEM, SHW (ICIS, S&P Platts, RMI)
   - **Real Estate**: PLD, AMT, WELL (GRESB, NAREIT)
   - **Utilities**: DUK, SO, AEP (J.D. Power, EPA, EEI)
   - **Comm Services**: GOOGL, META, DIS (Gartner, App Annie)
   - **Transportation**: UPS, DAL (IATA, Skytrax)

### Step 2: Clear Cache

1. Click **"Clear Cache"** to force fresh data
2. This ensures newly seeded evidence is included

### Step 3: Load Stocks

1. Search for any of the 35+ seeded symbols from all sectors
2. Evidence badges appear at bottom of stock cards
3. Click a card to see full evidence details

**Quick tests by sector:**
- Tech: PANW, ZS, SNOW
- Healthcare: JNJ, UNH, TMO  
- Finance: JPM, V, BLK
- Consumer: TSLA, AMZN, KO
- Energy: NEE, XOM, ENPH
- Industrials: CRH, BA, CAT

## Understanding Evidence Badges

### Badge Colors

- 🟢 **Green**: Leader / Tier 1 / Platinum (highest tier)
- 🟡 **Amber**: Strong Performer / Tier 2 / Gold
- 🔵 **Indigo**: Visionary / Contender / High Performer
- ⚫ **Gray**: Niche / Lower tiers

### Badge Content

Each badge shows:
- **Source name** (e.g., "Gartner MQ", "ENR Top 250")
- **Tier or score** (e.g., "Leader", "92/100")
- **Date** (in detail view)

## Examples

### Example 1: Tech Company (ZS - Zscaler)

**Evidence**:
- Gartner Magic Quadrant: Leader (Cloud Security)
- G2: Leader with 92/100 satisfaction from 640 reviews

**Effect**:
- +5 points to Leadership (Gartner recognition)
- +3 points to Innovation (high tech ranking)
- +2 points to Market (customer satisfaction)

### Example 2: Construction (CRH)

**Evidence**:
- ENR Top 250: Top 10 contractor
- LEED: Platinum certification

**Effect**:
- +6 points to Leadership (industry ranking)
- +4 points to Ethics (sustainability certification)

### Example 3: Energy (NEE)

**Evidence**:
- BloombergNEF: Tier 1 renewable energy developer
- DNV Certification: Platinum sustainability

**Effect**:
- +5 points to Fundamentals (financial stability)
- +3 points to Innovation (renewable tech)
- +4 points to Ethics (sustainability certification)

### Example 4: Healthcare (JNJ)

**Evidence**:
- Clarivate: Top 10 Pharma R&D Pipeline
- FDA Breakthrough Therapy: Multiple designations

**Effect**:
- +6 points to Innovation (R&D excellence)
- +2 points to Ethics (breakthrough therapies)

### Example 5: Financials (JPM)

**Evidence**:
- Celent Model Bank: Top 10 Banking Innovation
- Moody's: Tier 1 Credit Rating Upgrade

**Effect**:
- +3 points to Innovation (banking tech)
- +3 points to Leadership (industry recognition)
- +5 points to Balance Sheet (credit rating)

### Example 6: Consumer (TSLA)

**Evidence**:
- J.D. Power: High Performer (82/100) with 15,000 reviews
- IIHS: Top Safety Pick+

**Effect**:
- +4 points to Market (customer satisfaction)
- +2 points to Leadership (brand recognition)
- +4 points to Ethics (safety ratings)

## Adding Your Own Evidence

To add evidence for your stocks:

1. Prepare evidence data in this format:
```json
{
  "source": "J.D. Power",
  "domain": "Automotive",
  "symbol": "TSLA",
  "tier": "Top Rated",
  "as_of": "2025-09-01",
  "weight_vector": { "M": 0.6, "L": 0.4 },
  "decay_months": 12
}
```

2. Store in Supabase KV via backend endpoint (admin access required)

3. Clear cache and reload

## Best Practices

### ✅ Do

- Use evidence from recognized industry sources
- Keep evidence data up to date (check dates)
- Understand how evidence routes to pillars
- Review evidence in detail modal for context

### ❌ Don't

- Rely solely on evidence (it's capped at +10 points)
- Ignore time decay (old evidence has less impact)
- Override ethics firewall (evidence can't make bad actors good)
- Expect evidence to change BUY/HOLD/SELL (it refines, doesn't reverse)

## Transparency

OpenBox shows you:
- ✓ Which evidence sources are used
- ✓ What tier/score was achieved
- ✓ When the evidence was published
- ✓ How many points are added to each pillar

All evidence is **transparent and auditable**.

## FAQ

**Q: Can evidence override the ethics firewall?**  
A: No. Companies excluded by ethics remain excluded regardless of rankings.

**Q: Why is evidence capped at +10 points?**  
A: To prevent external validation from overwhelming fundamental financial analysis.

**Q: What happens to old evidence?**  
A: It decays exponentially. A 2-year-old Gartner report has ~37% of its original impact.

**Q: Can I disable evidence for certain stocks?**  
A: Not currently in the UI, but this is planned for future releases.

**Q: Do all stocks have evidence?**  
A: No. Only companies tracked by relevant industry analysts or holding certifications.

---

**Need help?** Check the full technical documentation in `EVIDENCE_FRAMEWORK.md`
