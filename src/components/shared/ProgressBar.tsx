import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'default';
}

export function ProgressBar({ 
  value, 
  className, 
  showLabel = false,
  size = 'default' 
}: ProgressBarProps) {
  // Muted, sophisticated color based on progress
  const getColor = () => {
    if (value >= 80) return 'bg-confidence-high';
    if (value >= 50) return 'bg-muted-foreground/40';
    return 'bg-muted-foreground/30';
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn(
        "progress-bar flex-1",
        size === 'sm' ? 'h-1' : 'h-1.5'
      )}>
        <div 
          className={cn("progress-bar-fill", getColor())}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-muted-foreground font-medium tabular-nums min-w-[32px] text-right">
          {value}%
        </span>
      )}
    </div>
  );
}
