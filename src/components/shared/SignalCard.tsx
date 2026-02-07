import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SignalCardProps {
  title: string;
  value: ReactNode;
  subtitle?: string;
  icon?: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  className?: string;
}

export function SignalCard({ 
  title, 
  value, 
  subtitle, 
  icon,
  variant = 'default',
  className 
}: SignalCardProps) {
  const getAccentClass = () => {
    switch (variant) {
      case 'success':
        return 'before:bg-confidence-high';
      case 'warning':
        return 'before:bg-confidence-medium';
      case 'danger':
        return 'before:bg-confidence-low';
      default:
        return '';
    }
  };

  return (
    <div className={cn(
      "signal-card relative",
      variant !== 'default' && "before:absolute before:left-0 before:top-4 before:bottom-4 before:w-0.5 before:rounded-full",
      getAccentClass(),
      className
    )}>
      <div className="flex items-start justify-between">
        <div className={cn(variant !== 'default' && "pl-3")}>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            {title}
          </p>
          <div className="metric-value">{value}</div>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1.5">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="text-muted-foreground/50">{icon}</div>
        )}
      </div>
    </div>
  );
}
