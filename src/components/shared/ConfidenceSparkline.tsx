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
        No data
      </div>
    );
  }

  const maxConfidence = 100;
  const minConfidence = 0;
  const range = maxConfidence - minConfidence;
  const width = 96; // matches w-24
  const height = 32; // matches h-8
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
        {/* Gradient background */}
        <defs>
          <linearGradient id="sparklineGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={getColor(latestConfidence)} stopOpacity="0.2" />
            <stop offset="100%" stopColor={getColor(latestConfidence)} stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Area fill */}
        {points.length > 1 && (
          <path
            d={`${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`}
            fill="url(#sparklineGradient)"
          />
        )}
        
        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke={getColor(latestConfidence)}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* End point */}
        {points.length > 0 && (
          <circle
            cx={points[points.length - 1].x}
            cy={points[points.length - 1].y}
            r="3"
            fill={getColor(latestConfidence)}
          />
        )}
      </svg>
    </div>
  );
}
