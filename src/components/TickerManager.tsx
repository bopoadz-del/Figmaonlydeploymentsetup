import { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Upload, Download, Save, RefreshCw, Search, Info } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Alert, AlertDescription } from './ui/alert';
import { SERVER_URL } from '../utils/api';
import { publicAnonKey } from '../utils/supabase/info';
import { getDemoSearchResults } from '../utils/demoData';

// 🔧 DEVELOPMENT MODE - Matches App.tsx setting
const DEV_MODE = true;

interface Ticker {
  id: string;
  symbol: string;
}

interface SearchResult {
  ticker: string;
  name: string;
  exch: string;
  source: string;
}

interface TickerManagerProps {
  onTickersChange: (symbols: string[]) => void;
}

export function TickerManager({ onTickersChange }: TickerManagerProps) {
  const [tickers, setTickers] = useState<Ticker[]>([]);
  const [newSymbol, setNewSymbol] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchCache, setSearchCache] = useState<Record<string, SearchResult[]>>({});
  const searchTimeoutRef = useRef<number | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  // Search for symbols using Smart Search (Yahoo + FMP + Themes + Aliases)
  const searchSymbols = async (query: string) => {
    const trimmedQuery = query.trim();

    if (trimmedQuery.length < 2) {
      setSearchResults([]);
      setShowSuggestions(false);
      return;
    }

    // If it's already a valid ticker format (all caps, 1-5 chars), don't search
    const isTicker = /^[A-Z]{1,5}$/.test(trimmedQuery);
    if (isTicker && trimmedQuery.length <= 5) {
      setSearchResults([]);
      setShowSuggestions(false);
      return;
    }

    // Check cache first
    const cacheKey = trimmedQuery.toLowerCase();
    if (searchCache[cacheKey]) {
      console.log('[TickerManager] Using cached search results for:', cacheKey);
      setSearchResults(searchCache[cacheKey]);
      setShowSuggestions(searchCache[cacheKey].length > 0);
      return;
    }

    setIsSearching(true);
    try {
      let results: SearchResult[] = [];

      // 🔧 DEVELOPMENT MODE - Use demo search
      if (DEV_MODE) {
        console.log('[DEV MODE] Using demo search for:', trimmedQuery);
        results = getDemoSearchResults(trimmedQuery);
      } else {
        // Production mode - use smart search endpoint
        const response = await fetch(
          `${SERVER_URL}/search-tickers?q=${encodeURIComponent(trimmedQuery)}`,
          {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Search failed: ${response.status}`);
        }

        const data = await response.json();
        results = data.items || [];
        console.log(`[TickerManager] Smart search found ${results.length} results`);
      }

      // Dedupe by ticker symbol
      const seen = new Set<string>();
      const combined: SearchResult[] = results.filter(r => {
        const ticker = r.ticker.toUpperCase();
        if (seen.has(ticker)) return false;
        seen.add(ticker);
        return true;
      }).slice(0, 10); // Limit to 10 results

      setSearchResults(combined);
      setShowSuggestions(combined.length > 0);

      // Cache the results
      setSearchCache(prev => ({
        ...prev,
        [cacheKey]: combined
      }));
    } catch (error) {
      console.error('[TickerManager] Search error:', error);
      // Fallback to demo data on error
      const demoResults = getDemoSearchResults(trimmedQuery);
      setSearchResults(demoResults);
      setShowSuggestions(demoResults.length > 0);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search handler removed duplicate code

  // (REMOVED ORPHANED CODE - LINES 131-168)

  // Debounced search
  const handleSearchInput = (value: string) => {
    setNewSymbol(value);
    
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for search (only if value contains non-letter characters or is long)
    if (value.trim().length >= 2) {
      searchTimeoutRef.current = window.setTimeout(() => {
        searchSymbols(value);
      }, 500); // Increased delay to reduce API calls
    } else {
      setSearchResults([]);
      setShowSuggestions(false);
    }
  };

  // Orphaned code removed - see next function for correct implementation
  /*
  const ORPHANED_CODE_DELETE_ME = () => {
          name: q.name || 'Unknown',
          type: q.exchangeShortName || 'N/A',
          region: q.exchangeShortName || '—',
          matchScore: 0.8 // FMP doesn't provide score; assume decent match
        }))
      ];

      // Deduplicate by symbol
      const seen = new Set<string>();
      const deduped = combined.filter(r => {
        const keep = !seen.has(r.symbol);
        if (keep) seen.add(r.symbol);
        return keep;
      });

      // Sort by match score descending
      const results = deduped.sort((a, b) => b.matchScore - a.matchScore);

      // Cache & update
      setSearchCache(prev => ({ ...prev, [cacheKey]: results }));
      setSearchResults(results);
      setShowSuggestions(results.length > 0);

      if (results.length > 0) {
        console.log(`[TickerManager] Found ${results.length} matches for "${trimmedQuery}"`);
      } else {
        showMessage('error', 'No matches found. Try a different search term.');
      }
    } catch (error) {
      console.error('[TickerManager] Parallel search error:', error);
      showMessage('error', 'Search failed. Please try again.');
      setSearchResults([]);
      setShowSuggestions(false);
    } finally {
      setIsSearching(false);
    }
  };
  */

  // Correct handleSearchInput is defined above (handleSearchInput_FIXED)
  // Removing duplicate below
  /*
  const handleSearchInput = (value: string) => {
    setNewSymbol(value);
    
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for search (only if value contains non-letter characters or is long)
    if (value.trim().length >= 2) {
      searchTimeoutRef.current = window.setTimeout(() => {
        searchSymbols(value);
      }, 500); // Increased delay to reduce API calls
    } else {
      setSearchResults([]);
      setShowSuggestions(false);
    }
  };
  */

  // Select a symbol from suggestions
  const selectSymbol = (symbol: string, name: string) => {
    const upperSymbol = symbol.toUpperCase();
    setNewSymbol(upperSymbol);
    setShowSuggestions(false);
    setSearchResults([]);
    showMessage('success', `Selected: ${upperSymbol} - ${name}`);
  };

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAdd = () => {
    const symbol = newSymbol.trim().toUpperCase();
    if (!symbol) return;

    if (tickers.some(t => t.symbol === symbol)) {
      showMessage('error', `${symbol} already exists`);
      return;
    }

    const newTicker: Ticker = {
      id: Date.now().toString(),
      symbol
    };

    const updated = [...tickers, newTicker];
    setTickers(updated);
    setNewSymbol('');
    notifyChange(updated);
    showMessage('success', `Added ${symbol}`);
  };

  const handleDelete = () => {
    if (selectedIds.size === 0) return;

    const updated = tickers.filter(t => !selectedIds.has(t.id));
    setTickers(updated);
    setSelectedIds(new Set());
    notifyChange(updated);
    showMessage('success', `Deleted ${selectedIds.size} ticker(s)`);
  };

  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleStartEdit = (ticker: Ticker) => {
    setEditingId(ticker.id);
    setEditValue(ticker.symbol);
  };

  const handleSaveEdit = (id: string) => {
    const newSymbol = editValue.trim().toUpperCase();
    if (!newSymbol) {
      setEditingId(null);
      return;
    }

    // Check for duplicates
    if (tickers.some(t => t.id !== id && t.symbol === newSymbol)) {
      showMessage('error', `${newSymbol} already exists`);
      return;
    }

    const updated = tickers.map(t => 
      t.id === id ? { ...t, symbol: newSymbol } : t
    );
    setTickers(updated);
    setEditingId(null);
    notifyChange(updated);
    showMessage('success', `Updated to ${newSymbol}`);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const notifyChange = (updatedTickers: Ticker[]) => {
    onTickersChange(updatedTickers.map(t => t.symbol));
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`${SERVER_URL}/tickers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ tickers: tickers.map(t => t.symbol) })
      });

      if (!response.ok) {
        throw new Error('Failed to save');
      }

      showMessage('success', 'Saved to cloud');
    } catch (error) {
      console.error('Save error:', error);
      showMessage('error', 'Failed to save');
    }
  };

  const handleLoad = async () => {
    try {
      const response = await fetch(`${SERVER_URL}/tickers`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load');
      }

      const data = await response.json();
      const symbols = data.tickers || [];
      
      const loaded = symbols.map((symbol: string, index: number) => ({
        id: `${Date.now()}-${index}`,
        symbol: symbol.toUpperCase()
      }));

      setTickers(loaded);
      notifyChange(loaded);
      showMessage('success', `Loaded ${symbols.length} ticker(s)`);
    } catch (error) {
      console.error('Load error:', error);
      showMessage('error', 'Failed to load');
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        let symbols: string[] = [];

        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(content);
          symbols = Array.isArray(parsed) ? parsed : parsed.tickers || [];
        } else if (file.name.endsWith('.csv')) {
          // Parse CSV - handle both single column and multi-column
          const lines = content.split('\n').filter(line => line.trim());
          symbols = lines.map(line => {
            // Take first column, remove quotes and trim
            return line.split(',')[0].replace(/['"]/g, '').trim();
          }).filter(s => s && s !== 'symbol' && s !== 'Symbol'); // Skip header
        }

        if (symbols.length === 0) {
          showMessage('error', 'No valid symbols found in file');
          return;
        }

        const imported = symbols.map((symbol, index) => ({
          id: `${Date.now()}-${index}`,
          symbol: symbol.toUpperCase()
        }));

        setTickers(imported);
        notifyChange(imported);
        showMessage('success', `Imported ${symbols.length} ticker(s)`);
      } catch (error) {
        console.error('Import error:', error);
        showMessage('error', 'Failed to parse file');
      }
    };

    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };

  const handleExportCSV = () => {
    const csv = ['Symbol', ...tickers.map(t => t.symbol)].join('\n');
    downloadFile(csv, 'tickers.csv', 'text/csv');
    showMessage('success', 'Exported to CSV');
  };

  const handleExportJSON = () => {
    const json = JSON.stringify(tickers.map(t => t.symbol), null, 2);
    downloadFile(json, 'tickers.json', 'application/json');
    showMessage('success', 'Exported to JSON');
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Smart Search Info */}
      <Alert className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800 text-sm">
          <strong>Smart Search:</strong> Type a company name (e.g., "Nokia", "Apple") to search Yahoo Finance + FMP. Select from dropdown or enter a ticker directly (e.g., "NOK", "AAPL"). No rate limits!
        </AlertDescription>
      </Alert>

      {/* Header with Actions */}
      <div className="flex flex-wrap gap-2 items-start">
        <div className="flex gap-2 flex-1 min-w-[200px] relative" ref={suggestionsRef}>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Type company name (e.g., Nokia) or ticker..."
              value={newSymbol}
              onChange={(e) => {
                const value = e.target.value;
                handleSearchInput(value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (showSuggestions && searchResults.length > 0) {
                    // Auto-select first result on Enter
                    selectSymbol(searchResults[0].ticker, searchResults[0].name);
                  } else {
                    handleAdd();
                  }
                  setShowSuggestions(false);
                } else if (e.key === 'Escape') {
                  setShowSuggestions(false);
                } else if (e.key === 'ArrowDown' && searchResults.length > 0) {
                  e.preventDefault();
                  setShowSuggestions(true);
                }
              }}
              onFocus={() => {
                // Show suggestions if we have results for current input
                if (searchResults.length > 0 && newSymbol.trim().length >= 2) {
                  setShowSuggestions(true);
                }
              }}
              className="pl-10"
            />
            
            {/* Search Suggestions Dropdown */}
            {showSuggestions && searchResults.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
                <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 text-xs text-gray-600">
                  Found {searchResults.length} {searchResults.length === 1 ? 'match' : 'matches'}. Click to select.
                </div>
                {searchResults.map((result) => (
                  <button
                    key={result.ticker}
                    onClick={() => selectSymbol(result.ticker, result.name)}
                    className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0 flex justify-between items-start gap-4 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-blue-600">{result.ticker}</span>
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                          {result.exch}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 truncate">{result.name}</div>
                    </div>
                    <div className="text-xs text-gray-400 whitespace-nowrap mt-1">
                      {result.source}
                    </div>
                  </button>
                ))}
              </div>
            )}
            
            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600"></div>
              </div>
            )}
          </div>
          
          <Button onClick={handleAdd} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={handleDelete} 
            size="sm" 
            variant="destructive"
            disabled={selectedIds.size === 0}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Delete ({selectedIds.size})
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.json"
            onChange={handleImport}
            className="hidden"
          />
          <Button 
            onClick={() => fileInputRef.current?.click()} 
            size="sm" 
            variant="outline"
          >
            <Upload className="w-4 h-4 mr-1" />
            Import
          </Button>

          <Button onClick={handleExportCSV} size="sm" variant="outline">
            <Download className="w-4 h-4 mr-1" />
            CSV
          </Button>

          <Button onClick={handleExportJSON} size="sm" variant="outline">
            <Download className="w-4 h-4 mr-1" />
            JSON
          </Button>

          <Button onClick={handleSave} size="sm" variant="outline">
            <Save className="w-4 h-4 mr-1" />
            Save
          </Button>

          <Button onClick={handleLoad} size="sm" variant="outline">
            <RefreshCw className="w-4 h-4 mr-1" />
            Load
          </Button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <Alert className={message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
          <AlertDescription className={message.type === 'error' ? 'text-red-800' : 'text-green-800'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Ticker Grid */}
      {tickers.length > 0 ? (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex gap-4">
            <div className="w-8">
              <input
                type="checkbox"
                checked={selectedIds.size === tickers.length && tickers.length > 0}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedIds(new Set(tickers.map(t => t.id)));
                  } else {
                    setSelectedIds(new Set());
                  }
                }}
                className="rounded"
              />
            </div>
            <div className="flex-1">Symbol</div>
          </div>
          
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {tickers.map((ticker) => (
              <div 
                key={ticker.id} 
                className="px-4 py-2 hover:bg-gray-50 flex gap-4 items-center"
              >
                <div className="w-8">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(ticker.id)}
                    onChange={() => handleToggleSelect(ticker.id)}
                    className="rounded"
                  />
                </div>
                <div className="flex-1">
                  {editingId === ticker.id ? (
                    <div className="flex gap-2">
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit(ticker.id);
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                        className="uppercase h-8"
                        autoFocus
                      />
                      <Button 
                        onClick={() => handleSaveEdit(ticker.id)} 
                        size="sm"
                        className="h-8"
                      >
                        Save
                      </Button>
                      <Button 
                        onClick={handleCancelEdit} 
                        size="sm" 
                        variant="outline"
                        className="h-8"
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleStartEdit(ticker)}
                      className="text-left w-full hover:text-blue-600"
                    >
                      {ticker.symbol}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 border border-gray-200 border-dashed rounded-lg">
          No tickers yet. Add symbols above or import from file.
        </div>
      )}

      <div className="text-sm text-gray-500">
        Total: {tickers.length} ticker(s) | Selected: {selectedIds.size}
      </div>
    </div>
  );
}
