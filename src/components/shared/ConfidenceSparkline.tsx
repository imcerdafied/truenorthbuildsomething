import { CheckIn } from '@/types';
import { cn } from '@/lib/utils';

interface ConfidenceSparklineProps {
  checkIns: CheckIn[];
  maxPoints?: number;
  className?: string;
}

export function ConfidenceSparkline({ 
  checkIns, 
  maxPoints = 6,
  className 
}: ConfidenceSparklineProps) {
  const sortedCheckIns = [...checkIns]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-maxPoints);

  if (sortedCheckIns.length === 0) {
    return (
      <div className={cn("sparkline flex items-center justify-center text-xs text-muted-foreground", className)}>
        —
      </div>
    );
  }

  const maxConfidence = 100;
  const minConfidence = 0;
  const range = maxConfidence - minConfidence;
  const width = 80;
  const height = 24;
  const padding = 2;
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;

  const points = sortedCheckIns.map((ci, index) => {
    const x = padding + (index / (sortedCheckIns.length - 1 || 1)) * usableWidth;
    const y = padding + usableHeight - ((ci.confidence - minConfidence) / range) * usableHeight;
    return { x, y, confidence: ci.confidence };
  });

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  const getColor = (confidence: number) => {
    if (confidence >= 75) return 'hsl(var(--confidence-high))';
    if (confidence >= 40) return 'hsl(var(--confidence-medium))';
    return 'hsl(var(--confidence-low))';
  };

  const latestConfidence = sortedCheckIns[sortedCheckIns.length - 1]?.confidence || 0;

  return (
    <div className={cn("sparkline", className)}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke={getColor(latestConfidence)}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.7"
        />
        
        {/* End point */}
        {points.length > 0 && (
          <circle
            cx={points[points.length - 1].x}
            cy={points[points.length - 1].y}
            r="2.5"
            fill={getColor(latestConfidence)}
          />
        )}
      </svg>
    </div>
  );
}
