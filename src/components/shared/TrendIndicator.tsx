import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { TrendDirection } from '@/types';
import { cn } from '@/lib/utils';

interface TrendIndicatorProps {
  trend: TrendDirection;
  size?: 'sm' | 'default';
}

export function TrendIndicator({ trend, size = 'default' }: TrendIndicatorProps) {
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  
  if (trend === 'up') {
    return (
      <div className={cn("flex items-center gap-1 trend-up", iconSize)}>
        <TrendingUp className={iconSize} />
      </div>
    );
  }
  
  if (trend === 'down') {
    return (
      <div className={cn("flex items-center gap-1 trend-down", iconSize)}>
        <TrendingDown className={iconSize} />
      </div>
    );
  }
  
  return (
    <div className={cn("flex items-center gap-1 trend-flat", iconSize)}>
      <Minus className={iconSize} />
    </div>
  );
}
