# 🧪 Testing Guide - Smart Search Integration

## Quick Test (5 minutes)

### 1. Verify Development Mode Banner
- **Expected**: Orange/purple banner at top saying "🔧 DEVELOPMENT MODE"
- **Action**: Refresh the browser
- **Status**: ✅ Should show immediately

### 2. Test Smart Search Autocomplete

Open the **Ticker Manager** section and test these searches:

#### Test A: Search by Company Name
```
Type: "apple"
Expected: Dropdown shows AAPL - Apple Inc. [DEMO]
```

#### Test B: Search by Theme
```
Type: "tech"
Expected: Dropdown shows 5 tech stocks:
  - AAPL - Apple Inc.
  - MSFT - Microsoft Corporation  
  - GOOGL - Alphabet Inc.
  - NVDA - NVIDIA Corporation
  - META - Meta Platforms Inc.
```

#### Test C: Search by Partial Name
```
Type: "micro"
Expected: Dropdown shows MSFT - Microsoft Corporation
```

#### Test D: Ticker Alias
```
Type: "nokia"
Expected: Dropdown shows NOK - Nokia Corporation
```

#### Test E: Direct Ticker Entry
```
Type: "AAPL" (all caps)
Expected: NO dropdown (direct ticker entry)
Press Enter to add it
```

### 3. Test Keyboard Navigation

With autocomplete dropdown open:
- **Press ↓ (Down Arrow)**: Dropdown should stay open
- **Press ↑ (Up Arrow)**: Navigate through results
- **Press Enter**: Select first result
- **Press Escape**: Close dropdown

### 4. Test Add Ticker Workflow

```
1. Type "apple"
2. Click on "AAPL - Apple Inc." in dropdown
3. Should show success message: "Selected: AAPL - Apple Inc."
4. Input field should now show "AAPL"
5. Click "Add" button
6. Stock card for AAPL should appear below
```

### 5. Verify Demo Data
Check that these demo stocks work when added:
- ✅ AAPL (Apple)
- ✅ MSFT (Microsoft)
- ✅ GOOGL (Google)
- ✅ AMZN (Amazon)
- ✅ NVDA (NVIDIA)
- ✅ META (Meta/Facebook)
- ✅ TSLA (Tesla)
- ✅ JPM (JPMorgan Chase)
- ✅ NOK (Nokia)
- ✅ TSM (Taiwan Semiconductor)
- ✅ PSA (Public Storage)
- ✅ SMC (Smith Micro)

## Demo Search Results

### Available Themes
| Search Term | Results |
|-------------|---------|
| `tech` | 5 major tech companies |
| `gold` | Gold ETFs and mining stocks |
| `telecom` | Telecom companies |
| `banking` | Major US banks |
| `electric` | EV companies |
| `healthcare` | Healthcare/pharma |
| `retail` | Retail giants |

### Available Aliases
| Search | Resolves To |
|--------|-------------|
| `apple` | AAPL |
| `microsoft` | MSFT |
| `google` | GOOGL |
| `amazon` | AMZN |
| `tesla` | TSLA |
| `facebook` | META |
| `nvidia` | NVDA |
| `nokia` | NOK |

## Expected UI Behavior

### Autocomplete Dropdown
- Appears after 2+ characters typed
- Shows up to 10 results
- Each result displays:
  - **Ticker** (blue, monospace font)
  - **Exchange** (badge: "DEMO", "NASDAQ", "NYSE", etc.)
  - **Company Name** (gray text)
  - **Source** (right side: "demo", "yahoo", "fmp", "theme", "alias")

### Search Timing
- **Debounce delay**: 500ms after last keystroke
- **Cache**: Results cached per query
- **Performance**: < 50ms in dev mode

## Common Issues

### ❌ Dropdown Not Appearing
**Cause**: Typing too fast or < 2 characters  
**Solution**: Type at least 2 characters and wait 500ms

### ❌ "No matches found"
**Cause**: Searching for stock not in demo data  
**Solution**: Try one of the test searches above or add ticker directly

### ❌ Ticker Already Exists
**Cause**: Trying to add duplicate ticker  
**Solution**: Remove existing ticker first or use a different symbol

## Production Mode Testing (After Edge Function Deployment)

When you deploy the Edge Function and set `DEV_MODE = false`:

### Additional Tests

1. **Real Yahoo Finance Search**
   ```
   Type: "berkshire"
   Expected: BRK-A, BRK-B results from Yahoo Finance
   ```

2. **FMP API Search** (if FMP_API_KEY configured)
   ```
   Type: "caterpillar"
   Expected: CAT - Caterpillar Inc. from FMP
   ```

3. **Cache Performance**
   ```
   Search "apple" → Wait for results
   Search "microsoft" → Search another term
   Search "apple" again → Should be instant (cached)
   ```

4. **Rate Limiting**
   ```
   Perform 10+ searches rapidly
   Expected: Caching should prevent API rate limits
   ```

## Success Criteria

✅ Dev mode banner visible  
✅ Autocomplete appears for company names  
✅ Theme searches work (tech, gold, etc.)  
✅ Aliases work (nokia → NOK)  
✅ Direct ticker entry works (no autocomplete for "AAPL")  
✅ Keyboard navigation functional  
✅ Stock cards display with demo data  
✅ No JavaScript errors in console  

## Debugging

### Check Console Logs
Look for these messages:
```
[DEV MODE] Using demo search for: apple
[TickerManager] Using cached search results for: apple
[Smart Search] Found 5 results
```

### Verify DEV_MODE Setting
```javascript
// In App.tsx and TickerManager.tsx
const DEV_MODE = true;  // Should be true for testing
```

### Check Network Tab
- In dev mode: NO API calls should be made
- All searches should use local demo data

## Next Steps After Testing

1. ✅ Confirm all tests pass
2. Deploy Edge Function: `supabase functions deploy server`
3. Set `DEV_MODE = false` in both files
4. Test production mode with real APIs
5. Add more stocks to portfolio and test scoring

---

**Last Updated**: After fixing TickerManager.tsx syntax errors  
**Status**: Ready for testing 🎉
