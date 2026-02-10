import { ConfidenceLabel } from '@/types';
import { cn } from '@/lib/utils';

interface ConfidenceBadgeProps {
  confidence: number;
  label?: ConfidenceLabel;
  showValue?: boolean;
  showDot?: boolean;
  size?: 'sm' | 'default';
  variant?: 'badge' | 'minimal' | 'dot';
  className?: string;
}

export function ConfidenceBadge({ 
  confidence, 
  label, 
  showValue = true,
  showDot = true,
  size = 'default',
  variant = 'minimal',
  className
}: ConfidenceBadgeProps) {
  const getLabel = () => {
    if (label) return label;
    if (confidence >= 75) return 'High';
    if (confidence >= 40) return 'Medium';
    return 'Low';
  };

  const getDotClass = () => {
    if (confidence >= 75) return 'confidence-dot-high';
    if (confidence >= 40) return 'confidence-dot-medium';
    return 'confidence-dot-low';
  };

  const getLabelClass = () => {
    if (confidence >= 75) return 'confidence-label-high';
    if (confidence >= 40) return 'confidence-label-medium';
    return 'confidence-label-low';
  };

  if (variant === 'dot') {
    return (
      <span className={cn('confidence-dot', getDotClass(), className)} />
    );
  }

  return (
    <span 
      className={cn(
        'confidence-label',
        getLabelClass(),
        className
      )}
    >
      {showDot && <span className={cn('confidence-dot', getDotClass())} />}
      {showValue && <span className="tabular-nums">{confidence}</span>}
      <span>{getLabel()}</span>
    </span>
  );
}
