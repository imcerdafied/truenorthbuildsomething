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
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'border-l-4 border-l-confidence-high';
      case 'warning':
        return 'border-l-4 border-l-confidence-medium';
      case 'danger':
        return 'border-l-4 border-l-confidence-low';
      default:
        return '';
    }
  };

  return (
    <div className={cn("signal-card", getVariantStyles(), className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <div className="metric-value mt-1">{value}</div>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="text-muted-foreground">{icon}</div>
        )}
      </div>
    </div>
  );
}
