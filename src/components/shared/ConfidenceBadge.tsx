import { Badge } from '@/components/ui/badge';
import { ConfidenceLabel } from '@/types';

interface ConfidenceBadgeProps {
  confidence: number;
  label?: ConfidenceLabel;
  showValue?: boolean;
  size?: 'sm' | 'default';
}

export function ConfidenceBadge({ 
  confidence, 
  label, 
  showValue = true,
  size = 'default' 
}: ConfidenceBadgeProps) {
  const getVariant = () => {
    if (confidence >= 75) return 'confidenceHigh';
    if (confidence >= 40) return 'confidenceMedium';
    return 'confidenceLow';
  };

  const getLabel = () => {
    if (label) return label;
    if (confidence >= 75) return 'High';
    if (confidence >= 40) return 'Medium';
    return 'Low';
  };

  return (
    <Badge 
      variant={getVariant()} 
      className={size === 'sm' ? 'text-[10px] px-2 py-0' : ''}
    >
      {showValue && <span className="font-bold mr-1">{confidence}</span>}
      {getLabel()}
    </Badge>
  );
}
