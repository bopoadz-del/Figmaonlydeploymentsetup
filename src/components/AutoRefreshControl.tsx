import { useState, useEffect } from 'react';
import { RefreshCw, Clock, Power, Zap } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface AutoRefreshControlProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  interval: number;
  onIntervalChange: (interval: number) => void;
  lastUpdated: Date | null;
  isRefreshing: boolean;
  onManualRefresh: () => void;
  onForceRefresh?: () => void;
}

export function AutoRefreshControl({
  enabled,
  onToggle,
  interval,
  onIntervalChange,
  lastUpdated,
  isRefreshing,
  onManualRefresh,
  onForceRefresh,
}: AutoRefreshControlProps) {
  const [timeUntilRefresh, setTimeUntilRefresh] = useState<number>(interval);

  useEffect(() => {
    if (!enabled || !lastUpdated) return;

    const intervalId = setInterval(() => {
      const elapsed = Date.now() - lastUpdated.getTime();
      const remaining = Math.max(0, interval - elapsed);
      setTimeUntilRefresh(remaining);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [enabled, lastUpdated, interval]);

  const formatTimeUntilRefresh = () => {
    const seconds = Math.floor(timeUntilRefresh / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatLastUpdated = () => {
    if (!lastUpdated) return 'Never';
    const now = Date.now();
    const diff = now - lastUpdated.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return `${seconds}s ago`;
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
      <Button
        variant={enabled ? 'default' : 'outline'}
        size="sm"
        onClick={() => onToggle(!enabled)}
        className={enabled ? 'bg-green-600 hover:bg-green-700' : ''}
      >
        <Power className="w-4 h-4 mr-2" />
        {enabled ? 'Auto-Refresh ON' : 'Auto-Refresh OFF'}
      </Button>

      {enabled && (
        <>
          <Select
            value={interval.toString()}
            onValueChange={(value) => onIntervalChange(parseInt(value))}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Interval" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="60000">Every 1 min</SelectItem>
              <SelectItem value="300000">Every 5 min</SelectItem>
              <SelectItem value="600000">Every 10 min</SelectItem>
              <SelectItem value="1800000">Every 30 min</SelectItem>
              <SelectItem value="3600000">Every 1 hour</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-gray-600">Next in: {formatTimeUntilRefresh()}</span>
          </div>
        </>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={onManualRefresh}
        disabled={isRefreshing}
      >
        <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
        Refresh (Cache)
      </Button>

      {onForceRefresh && (
        <Button
          variant="outline"
          size="sm"
          onClick={onForceRefresh}
          disabled={isRefreshing}
          className="border-orange-300 text-orange-700 hover:bg-orange-50"
        >
          <Zap className="w-4 h-4 mr-2" />
          Force Refresh (API)
        </Button>
      )}

      <div className="flex items-center gap-2 ml-auto">
        <Badge variant="secondary" className="text-xs">
          {isRefreshing ? (
            <>
              <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
              Updating...
            </>
          ) : (
            <>
              <Clock className="w-3 h-3 mr-1" />
              {formatLastUpdated()}
            </>
          )}
        </Badge>
      </div>
    </div>
  );
}
