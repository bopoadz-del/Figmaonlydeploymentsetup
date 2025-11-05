import { useState, useEffect } from 'react';
import { Database, Loader2, Trash2, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';

interface CachedStock {
  symbol: string;
  companyName: string;
  cachedAt: string;
}

interface CacheViewerProps {
  serverUrl: string;
  authToken: string;
}

export function CacheViewer({ serverUrl, authToken }: CacheViewerProps) {
  const [open, setOpen] = useState(false);
  const [cachedStocks, setCachedStocks] = useState<CachedStock[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadCachedStocks = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch(`${serverUrl}/cache/list`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load cached stocks');
      }

      const data = await response.json();
      setCachedStocks(data.stocks || []);
      setMessage(`✅ Found ${data.count} cached stocks`);
    } catch (error) {
      console.error('Error loading cached stocks:', error);
      setMessage(`❌ Failed to load cache: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadCachedStocks();
    }
  }, [open]);

  const formatDate = (dateStr: string) => {
    if (dateStr === 'unknown') return 'Unknown';
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const hours = Math.round((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      if (hours < 1) return 'Just now';
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    } catch {
      return dateStr;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Database className="w-4 h-4 mr-2" />
          View Cache
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Cached Stocks
          </DialogTitle>
          <DialogDescription>
            These stocks have cached data and will load even when you hit API rate limits.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {message && (
            <Alert>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button
              onClick={loadCachedStocks}
              disabled={loading}
              size="sm"
              variant="outline"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Refresh
            </Button>
          </div>

          <ScrollArea className="h-[400px] pr-4">
            {loading && cachedStocks.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : cachedStocks.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Database className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No cached stocks found</p>
                <p className="text-sm mt-2">Analyze some stocks to build your cache</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cachedStocks.map((stock) => (
                  <div
                    key={stock.symbol}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-blue-600">
                          {stock.symbol}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {formatDate(stock.cachedAt)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{stock.companyName}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <Alert className="border-blue-200 bg-blue-50">
            <AlertDescription className="text-sm text-blue-800">
              <strong>💡 Tip:</strong> When you hit the 25 calls/day rate limit, only these cached stocks can be loaded. 
              Build your cache by analyzing stocks when you have API quota available.
            </AlertDescription>
          </Alert>
        </div>
      </DialogContent>
    </Dialog>
  );
}
