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
  const getColor = () => {
    if (value >= 80) return 'bg-confidence-high';
    if (value >= 50) return 'bg-confidence-medium';
    return 'bg-confidence-low';
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn(
        "progress-bar flex-1",
        size === 'sm' ? 'h-1.5' : 'h-2'
      )}>
        <div 
          className={cn("progress-bar-fill", getColor())}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-sm text-muted-foreground font-medium min-w-[3ch]">
          {value}%
        </span>
      )}
    </div>
  );
}
