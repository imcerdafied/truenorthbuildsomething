import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { TrendDirection } from '@/types';
import { cn } from '@/lib/utils';

interface TrendIndicatorProps {
  trend: TrendDirection;
  size?: 'sm' | 'default';
  showLabel?: boolean;
}

export function TrendIndicator({ trend, size = 'default', showLabel = false }: TrendIndicatorProps) {
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';
  
  if (trend === 'up') {
    return (
      <span className={cn("inline-flex items-center gap-1 trend-up", size === 'sm' && 'text-xs')}>
        <TrendingUp className={iconSize} strokeWidth={2} />
        {showLabel && <span className="font-medium">Up</span>}
      </span>
    );
  }
  
  if (trend === 'down') {
    return (
      <span className={cn("inline-flex items-center gap-1 trend-down", size === 'sm' && 'text-xs')}>
        <TrendingDown className={iconSize} strokeWidth={2} />
        {showLabel && <span className="font-medium">Down</span>}
      </span>
    );
  }
  
  return (
    <span className={cn("inline-flex items-center gap-1 trend-flat", size === 'sm' && 'text-xs')}>
      <Minus className={iconSize} strokeWidth={2} />
      {showLabel && <span className="font-medium">Flat</span>}
    </span>
  );
}
