# 👁️ Visual Guide - What You Should See

## 1. Development Mode Banner

At the top of the app, you should see:

```
┌─────────────────────────────────────────────────────────────┐
│ 🔧 DEVELOPMENT MODE - Using demo data. Switch DEV_MODE to  │
│    false and deploy Edge Function to use live APIs.        │
└─────────────────────────────────────────────────────────────┘
```

**Colors**: Orange/Purple background with white text  
**Icon**: 🔧 Wrench emoji  
**Location**: Very top of the page, full width

---

## 2. Smart Search Input

In the **Ticker Manager** section:

```
┌─────────────────────────────────────────────────────────────┐
│ ℹ️ Smart Search: Type a company name (e.g., "Nokia",      │
│   "Apple") to search Yahoo Finance + FMP. Select from      │
│   dropdown or enter a ticker directly (e.g., "NOK",        │
│   "AAPL"). No rate limits!                                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 🔍 Type company name (e.g., Nokia) or ticker...      [Add]  │
└─────────────────────────────────────────────────────────────┘
```

**Icon**: 🔍 Magnifying glass (inside input on left)  
**Placeholder**: Gray text showing examples  
**Add Button**: Blue button on the right

---

## 3. Autocomplete Dropdown

When you type "apple":

```
┌─────────────────────────────────────────────────────────────┐
│ 🔍 apple                                          [Add]      │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│ Found 1 match. Click to select.                             │
├─────────────────────────────────────────────────────────────┤
│ AAPL  [DEMO]                                          demo   │
│ Apple Inc.                                                   │
└─────────────────────────────────────────────────────────────┘
```

When you type "tech":

```
┌─────────────────────────────────────────────────────────────┐
│ 🔍 tech                                           [Add]      │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│ Found 5 matches. Click to select.                           │
├─────────────────────────────────────────────────────────────┤
│ AAPL  [NASDAQ]                                   demo-theme  │
│ Apple Inc.                                                   │
├─────────────────────────────────────────────────────────────┤
│ MSFT  [NASDAQ]                                   demo-theme  │
│ Microsoft Corporation                                        │
├─────────────────────────────────────────────────────────────┤
│ GOOGL [NASDAQ]                                   demo-theme  │
│ Alphabet Inc.                                                │
├─────────────────────────────────────────────────────────────┤
│ NVDA  [NASDAQ]                                   demo-theme  │
│ NVIDIA Corporation                                           │
├─────────────────────────────────────────────────────────────┤
│ META  [NASDAQ]                                   demo-theme  │
│ Meta Platforms Inc.                                          │
└─────────────────────────────────────────────────────────────┘
```

**Dropdown Features**:
- White background with gray borders
- Hover effect: Light blue background
- Max height: 80vh with scroll
- Ticker in **blue monospace** font
- Exchange badge in **blue rounded box**
- Company name in **gray**
- Source label in **light gray** on the right

---

## 4. Selection Confirmation

After clicking on a result:

```
┌─────────────────────────────────────────────────────────────┐
│ ✅ Selected: AAPL - Apple Inc.                              │
└─────────────────────────────────────────────────────────────┘
```

**Type**: Success toast/message  
**Color**: Green background  
**Duration**: 3 seconds  
**Location**: Above or below the input

---

## 5. Stock Card Display

After clicking [Add]:

```
┌─────────────────────────────────────────────────────────────┐
│ AAPL                                    📊 Score: 72 - BUY  │
│ Apple Inc.                                                   │
│                                                              │
│ $189.84        +2.5%        Market Cap: $2.94T             │
│                                                              │
│ Growth: 85  Value: 68  Health: 75  Momentum: 62            │
│                                                              │
│ P/E: 31.2    EPS: $6.08    Dividend: 0.43%                 │
│                                                              │
│ F M B L A E                                                  │
│ ▓ ▓ ░ ▓ ░ ▓  Evidence badges                               │
│                                                              │
│ [View Details]                                              │
└─────────────────────────────────────────────────────────────┘
```

**Card Style**:
- White background with shadow
- Rounded corners
- Ticker in large bold font
- Score badge (Green=Buy, Yellow=Hold, Red=Sell)
- Colored progress bars for dimensions
- Evidence badges at bottom
- Blue "View Details" button

---

## 6. Loading State

While searching (production mode only):

```
┌─────────────────────────────────────────────────────────────┐
│ 🔍 apple                                    ⏳ [Add]         │
└─────────────────────────────────────────────────────────────┘
```

**Loading Indicator**: Spinning circle animation on right side of input

---

## 7. Color Scheme

### Dev Mode Banner
- Background: `#FF6B35` (Orange) or `#7B68EE` (Purple)
- Text: White
- Icon: 🔧

### Search Input
- Background: White
- Border: Light gray (`#E5E7EB`)
- Focus border: Blue (`#3B82F6`)
- Placeholder: Gray (`#9CA3AF`)

### Autocomplete Dropdown
- Background: White
- Border: Gray (`#E5E7EB`)
- Hover: Light blue (`#EFF6FF`)
- Selected item border: Blue

### Badges
- Exchange: Light blue background (`#DBEAFE`), blue text (`#1E40AF`)
- Score BUY: Green background, white text
- Score HOLD: Yellow background, dark text
- Score SELL: Red background, white text

### Typography
- Ticker: Blue (`#2563EB`), monospace font
- Company name: Gray (`#6B7280`)
- Source label: Light gray (`#9CA3AF`)

---

## 8. Console Output

Open browser DevTools console to see:

```
[DEV MODE] Using demo search for: apple
[TickerManager] Using cached search results for: apple
[Smart Search] Demo search returning 1 result(s)
[TickerManager] Selected: AAPL - Apple Inc.
```

**In Dev Mode**: All searches use local demo data  
**In Production Mode**: You'll see API calls and timing info

---

## 9. Test Scenarios Visual Guide

### ✅ Scenario A: Company Name Search
```
Type: "nokia"
                     ↓
┌─────────────────────────────────────┐
│ NOK  [DEMO]                   demo  │
│ Nokia Corporation                   │
└─────────────────────────────────────┘
```

### ✅ Scenario B: Theme Search
```
Type: "gold"
                     ↓
┌─────────────────────────────────────┐
│ 5 results showing...                │
│ SGOL, GLD, GDX, AEM, FNV            │
└─────────────────────────────────────┘
```

### ✅ Scenario C: Direct Ticker
```
Type: "AAPL"
                     ↓
No dropdown (valid ticker detected)
Press Enter → Added directly
```

### ✅ Scenario D: Partial Name
```
Type: "micro"
                     ↓
┌─────────────────────────────────────┐
│ MSFT [NASDAQ]                 demo  │
│ Microsoft Corporation               │
└─────────────────────────────────────┘
```

---

## 10. Expected Behavior

### ✅ What SHOULD Happen
- Dropdown appears after 2+ characters
- Results show within 500ms
- Clicking result fills input
- Success message appears briefly
- Stock card appears after clicking Add
- No JavaScript errors in console

### ❌ What Should NOT Happen
- Dropdown for 1 character
- Dropdown for direct ticker (AAPL)
- Network errors (in dev mode)
- Blank/missing company names
- Duplicate results in dropdown

---

## 11. Keyboard Navigation

```
Type "tech" → Dropdown opens
                ↓
Press ↓       → Highlight first item
Press ↓       → Highlight second item  
Press Enter   → Select highlighted item
                OR
Press Escape  → Close dropdown
```

---

## 12. Mobile View

On smaller screens:
- Banner stacks text
- Input goes full width
- Dropdown adjusts to screen
- Cards stack vertically

---

## Quick Visual Checklist

Before reporting issues, verify:

- [ ] Orange/purple banner at top
- [ ] 🔍 icon inside search input
- [ ] Placeholder text visible
- [ ] Add button on the right
- [ ] Typing triggers dropdown after 500ms
- [ ] Dropdown has header "Found X matches"
- [ ] Results show ticker in blue
- [ ] Exchange badge visible
- [ ] Company name in gray
- [ ] Source label on right
- [ ] Hover changes background to light blue
- [ ] Click fills input field
- [ ] Success message appears
- [ ] Stock card renders with data

---

**All visuals should match this guide!**  
If something looks different, check the console for errors.
