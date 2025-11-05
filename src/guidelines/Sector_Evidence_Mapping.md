# Sector Evidence Source Mapping - OpenBox

This guide provides a comprehensive mapping of evidence sources by industry sector to help add evidence data for new companies.

## Quick Reference by Sector

### 1️⃣ Information Technology

**Common Evidence Sources:**
- **Gartner Magic Quadrant** (18mo decay) - Cybersecurity, Cloud, Data, AI/ML
  - Routing: `L:0.6, A:0.4`
- **Forrester Wave** (9mo decay) - Cloud, DevOps, Data platforms
  - Routing: `L:0.7, A:0.3`
- **G2** (12mo decay) - User reviews across categories
  - Routing: `M:0.6, L:0.4`

**Example Stocks:** PANW, ZS, SNOW, MSFT, ORCL, CRM, ADBE

---

### 2️⃣ Healthcare

**Common Evidence Sources:**
- **NCQA** (12mo decay) - Health Insurance Plan Ratings
  - Routing: `M:0.5, L:0.5`
- **Clarivate** (12mo decay) - R&D Pipeline Innovation
  - Routing: `A:1.0`
- **FDA Breakthrough/Orphan** (24mo decay) - Special designations
  - Routing: `A:0.7, E:0.3`
- **Frost & Sullivan** (18mo decay) - Life sciences leadership
  - Routing: `L:0.6, A:0.4`

**Example Stocks:** UNH, JNJ, TMO, PFE, ABBV, LLY, MRNA

---

### 3️⃣ Financials

**Common Evidence Sources:**
- **Celent Model Bank** (12mo decay) - Banking innovation
  - Routing: `A:0.5, L:0.5`
- **Fintech 100** (12mo decay) - Payment/fintech innovation
  - Routing: `A:0.5, M:0.5`
- **Moody's/S&P** (18mo decay) - Credit rating upgrades
  - Routing: `B:0.7, L:0.3`
- **WealthTech 100** (12mo decay) - Asset management tech
  - Routing: `L:0.6, A:0.4`

**Example Stocks:** JPM, V, BLK, GS, BAC, MA, AXP

---

### 4️⃣ Consumer Discretionary

**Common Evidence Sources:**
- **J.D. Power** (12mo decay) - Automotive quality/satisfaction
  - Routing: `M:0.6, L:0.4`
- **IIHS/Euro NCAP** (24mo decay) - Safety ratings
  - Routing: `E:0.7, F:0.3`
- **Interbrand/Brand Finance** (12mo decay) - Brand value
  - Routing: `L:0.7, M:0.3`
- **Fair Labor Association** (36mo decay) - Ethical manufacturing
  - Routing: `E:1.0`

**Example Stocks:** TSLA, AMZN, NKE, HD, MCD, SBUX, TGT

---

### 5️⃣ Consumer Staples

**Common Evidence Sources:**
- **Interbrand/Brand Finance** (12mo decay) - Brand rankings
  - Routing: `L:0.7, M:0.3`
- **Sustainalytics** (24mo decay) - ESG ratings
  - Routing: `E:0.7, L:0.3`
- **Kantar Retail** (12mo decay) - Retail excellence
  - Routing: `M:0.5, L:0.5`
- **Fair Trade/Organic/FSC** (36mo decay) - Certifications
  - Routing: `E:1.0`

**Example Stocks:** KO, PG, WMT, COST, PEP, MDLZ, CL

---

### 6️⃣ Energy

**Common Evidence Sources:**
- **BloombergNEF** (18mo decay) - Renewable energy rankings
  - Routing: `F:0.6, A:0.4` or `A:0.6, F:0.4` (for tech)
- **WoodMac** (18mo decay) - Oil/gas/renewable analysis
  - Routing: `F:0.7, L:0.3`
- **DNV/TÜV Certification** (36mo decay) - Sustainability
  - Routing: `E:1.0`
- **EPA Energy Star** (24mo decay) - Efficiency programs
  - Routing: `E:0.8, F:0.2`

**Example Stocks:** NEE, XOM, ENPH, CVX, COP, SLB, OXY

---

### 7️⃣ Industrials

**Common Evidence Sources:**
- **ENR Top 250** (18mo decay) - Construction/contractors
  - Routing: `F:0.2, L:0.8`
- **LEED/BREEAM** (36mo decay) - Green building certifications
  - Routing: `E:1.0`
- **Flight Global** (18mo decay) - Aerospace rankings
  - Routing: `L:0.7, F:0.3`
- **EquipmentWatch** (18mo decay) - Heavy equipment
  - Routing: `M:0.5, L:0.5`

**Example Stocks:** CRH, BA, CAT, GE, HON, RTX, UNP

---

### 8️⃣ Materials

**Common Evidence Sources:**
- **ICIS Top 100** (18mo decay) - Chemical industry
  - Routing: `F:0.6, L:0.4`
- **S&P Global Platts** (18mo decay) - Mining/metals
  - Routing: `F:0.7, M:0.3`
- **RMI** (36mo decay) - Responsible Mining Initiative
  - Routing: `E:1.0`
- **Industry Week** (12mo decay) - Manufacturing excellence
  - Routing: `M:0.5, F:0.5`

**Example Stocks:** LIN, NEM, SHW, APD, FCX, NUE, DD

---

### 9️⃣ Real Estate

**Common Evidence Sources:**
- **GRESB** (24mo decay) - Real estate ESG benchmarks
  - Routing: `E:0.6, L:0.4`
- **NAREIT** (12mo decay) - REIT performance/governance
  - Routing: `F:0.6, M:0.4`
- **WELL/LEED Certification** (36mo decay) - Building certifications
  - Routing: `E:0.7, L:0.3`

**Example Stocks:** PLD, AMT, WELL, EQIX, PSA, SPG, O

---

### 🔟 Utilities

**Common Evidence Sources:**
- **J.D. Power** (12mo decay) - Customer satisfaction
  - Routing: `M:0.6, L:0.4`
- **EPA Energy Star** (24mo decay) - Efficiency programs
  - Routing: `E:0.8, F:0.2`
- **EEI** (18mo decay) - Grid modernization/innovation
  - Routing: `A:0.5, F:0.5`

**Example Stocks:** DUK, SO, AEP, NEE, D, EXC, SRE

---

### 1️⃣1️⃣ Communication Services

**Common Evidence Sources:**
- **Gartner MQ** (18mo decay) - Cloud/digital platforms
  - Routing: `L:0.6, A:0.4`
- **App Annie/data.ai** (12mo decay) - Mobile app rankings
  - Routing: `M:0.7, L:0.3`
- **Hollywood Reporter** (12mo decay) - Entertainment industry
  - Routing: `L:0.7, M:0.3`

**Example Stocks:** GOOGL, META, DIS, NFLX, CMCSA, T, VZ

---

### 1️⃣2️⃣ Transportation & Logistics

**Common Evidence Sources:**
- **IATA/IOSA Certification** (36mo decay) - Safety accreditation
  - Routing: `E:1.0`
- **Skytrax** (12mo decay) - Airline quality ratings
  - Routing: `M:0.5, L:0.5`
- **Supply Chain Dive** (12mo decay) - Logistics innovation
  - Routing: `M:0.5, A:0.5`

**Example Stocks:** UPS, DAL, FDX, AAL, UAL, LUV, JBHT

---

## Routing Weight Guidelines

### Pillar Definitions
- **F** (Fundamentals): Core financial metrics, revenue quality
- **M** (Market): Market position, customer satisfaction, brand
- **B** (Balance): Balance sheet strength, credit quality
- **L** (Leadership): Industry recognition, competitive position
- **A** (Innovation): R&D, technology, future-focused initiatives
- **E** (Ethics): ESG, safety, certifications, ethical practices

### Common Routing Patterns

**Analyst Rankings** (Gartner, Forrester):
- `L:0.6, A:0.4` - Leadership + Innovation
- `L:0.7, A:0.3` - Primarily leadership-focused

**Customer Satisfaction** (J.D. Power, G2):
- `M:0.6, L:0.4` - Market position + Leadership
- `M:0.5, L:0.5` - Balanced market/leadership

**Financial Ratings** (Moody's, S&P):
- `B:0.7, L:0.3` - Balance sheet + Leadership

**Innovation Rankings** (Clarivate, Fintech 100):
- `A:1.0` - Pure innovation boost
- `A:0.5, L:0.5` - Innovation + Leadership

**Certifications** (LEED, ISO, IATA):
- `E:1.0` - Pure ethics boost
- `E:0.7, F:0.3` - Ethics + Fundamentals (e.g., safety)

**Energy/Sustainability** (BloombergNEF, EPA):
- `E:0.8, F:0.2` - Primarily ethics
- `F:0.6, A:0.4` - Tech-focused energy (solar, batteries)

---

## Decay Month Guidelines

| Evidence Type | Typical Decay | Rationale |
|---------------|---------------|-----------|
| Analyst Reports (Gartner, Forrester) | 18 months | Annual/biannual refresh |
| User Reviews (G2, J.D. Power) | 12 months | Faster-changing sentiment |
| Credit Ratings | 18 months | More stable |
| Certifications (LEED, ISO, IATA) | 36 months | Long-term validity |
| ESG Ratings | 24 months | Annual refresh with lag |
| Tech Innovation Rankings | 12 months | Fast-moving |

---

## Adding Evidence for New Companies

### Step 1: Identify the Sector
Use GICS classification or business model to determine primary sector.

### Step 2: Choose Relevant Sources
Pick 1-3 evidence sources from the sector catalog above.

### Step 3: Define the Evidence Item
```typescript
{
  source: "Source Name",        // e.g., "Gartner MQ"
  domain: "Category",            // e.g., "Cybersecurity"
  symbol: "TICKER",
  tier: "Ranking",               // e.g., "Leader", "Top 10"
  score: 85,                     // Optional 0-100 score
  reviews: 500,                  // Optional review count
  as_of: "2025-08-15",           // Recent date
  weight_vector: { L: 0.6, A: 0.4 },  // Based on source type
  decay_months: 18,              // Based on source type
  notes: "Optional context"
}
```

### Step 4: Store in KV
```typescript
await kv.set(`evidence:TICKER`, JSON.stringify([evidenceItem1, evidenceItem2]));
```

---

## Quality Checklist

Before adding evidence, verify:

- ✅ Source is credible and industry-recognized
- ✅ Tier/ranking is current (within last 2 years)
- ✅ Weight vector sums to ≤ 1.0
- ✅ Routing makes logical sense for the source type
- ✅ Decay months are appropriate for source update frequency
- ✅ Multiple sources for same company don't double-count

---

**Version**: 1.0  
**Last Updated**: October 2025  
**Coverage**: All 12 GICS Sectors
