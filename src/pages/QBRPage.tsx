import { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { SignalCard } from '@/components/shared/SignalCard';
import { ConfidenceBadge } from '@/components/shared/ConfidenceBadge';
import { TrendIndicator } from '@/components/shared/TrendIndicator';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatQuarter } from '@/types';
import { Target, TrendingUp, TrendingDown, RefreshCcw } from 'lucide-react';

export function QBRPage() {
  const { 
    currentQuarter, 
    getOKRsByQuarter,
    checkIns,
    okrs
  } = useApp();

  const [selectedQuarter, setSelectedQuarter] = useState(currentQuarter);

  const quarterOKRs = useMemo(() => {
    return getOKRsByQuarter(selectedQuarter);
  }, [selectedQuarter, getOKRsByQuarter]);

  const hasOKRs = quarterOKRs.length > 0;

  const stats = useMemo(() => {
    const okrIds = quarterOKRs.map(o => o.id);
    const quarterCheckIns = checkIns.filter(ci => okrIds.includes(ci.okrId));
    
    const firstCheckIns: Record<string, typeof checkIns[0]> = {};
    quarterCheckIns.forEach(ci => {
      if (!firstCheckIns[ci.okrId] || new Date(ci.date) < new Date(firstCheckIns[ci.okrId].date)) {
        firstCheckIns[ci.okrId] = ci;
      }
    });
    
    const latestCheckIns: Record<string, typeof checkIns[0]> = {};
    quarterCheckIns.forEach(ci => {
      if (!latestCheckIns[ci.okrId] || new Date(ci.date) > new Date(latestCheckIns[ci.okrId].date)) {
        latestCheckIns[ci.okrId] = ci;
      }
    });

    const firstConfidences = Object.values(firstCheckIns).map(ci => ci.confidence);
    const latestConfidences = Object.values(latestCheckIns).map(ci => ci.confidence);
    
    const avgStartConfidence = firstConfidences.length > 0 
      ? Math.round(firstConfidences.reduce((a, b) => a + b, 0) / firstConfidences.length)
      : 0;
    
    const avgEndConfidence = latestConfidences.length > 0
      ? Math.round(latestConfidences.reduce((a, b) => a + b, 0) / latestConfidences.length)
      : 0;

    const significantChanges = quarterCheckIns
      .filter(ci => ci.reasonForChange)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const rolledOver = okrs.filter(o => 
      o.isRolledOver && 
      o.rolledOverFrom && 
      okrs.find(orig => orig.id === o.rolledOverFrom)?.quarter === selectedQuarter
    );

    return {
      totalOKRs: quarterOKRs.length,
      avgStartConfidence,
      avgEndConfidence,
      confidenceDelta: avgEndConfidence - avgStartConfidence,
      significantChanges,
      rolledOver,
      atRiskCount: quarterOKRs.filter(o => (o.latestCheckIn?.confidence || 0) < 40).length,
      onTrackCount: quarterOKRs.filter(o => (o.latestCheckIn?.confidence || 0) >= 40).length
    };
  }, [quarterOKRs, checkIns, okrs, selectedQuarter]);

  const quarters = ['2026-Q1', '2025-Q4', '2025-Q3', '2025-Q2', '2025-Q1'];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Quarterly Business Review</h1>
          <p className="helper-text mt-1">
            Source of truth for quarterly business reviews · Executive summary for leadership
          </p>
        </div>
        
        <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
          <SelectTrigger className="w-28 bg-background h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover">
            {quarters.map(q => (
              <SelectItem key={q} value={q}>
                {formatQuarter(q)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Signals */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SignalCard
          title="Total OKRs"
          value={hasOKRs ? stats.totalOKRs : <span className="text-lg font-medium text-muted-foreground">—</span>}
          subtitle={hasOKRs ? `${stats.onTrackCount} on track, ${stats.atRiskCount} at risk` : "No OKRs defined for this quarter"}
          icon={<Target className="w-5 h-5" />}
        />
        
        <SignalCard
          title="Starting Confidence"
          value={
            hasOKRs ? (
              <div className="flex items-center gap-3">
                <span>{stats.avgStartConfidence}</span>
                <ConfidenceBadge confidence={stats.avgStartConfidence} showValue={false} />
              </div>
            ) : (
              <span className="text-lg font-medium text-muted-foreground">Not yet established</span>
            )
          }
          subtitle={hasOKRs ? "Average at quarter start" : "No check-in data available"}
        />
        
        <SignalCard
          title="Current Confidence"
          value={
            hasOKRs ? (
              <div className="flex items-center gap-3">
                <span>{stats.avgEndConfidence}</span>
                <ConfidenceBadge confidence={stats.avgEndConfidence} showValue={false} />
              </div>
            ) : (
              <span className="text-lg font-medium text-muted-foreground">Not yet established</span>
            )
          }
          subtitle={hasOKRs ? "Latest average" : "No check-in data available"}
        />
        
        <SignalCard
          title="Confidence Trend"
          value={
            hasOKRs ? (
              <div className="flex items-center gap-3">
                <span className="tabular-nums">{stats.confidenceDelta > 0 ? '+' : ''}{stats.confidenceDelta}</span>
                {stats.confidenceDelta > 0 ? (
                  <TrendingUp className="w-5 h-5 text-confidence-high" />
                ) : stats.confidenceDelta < 0 ? (
                  <TrendingDown className="w-5 h-5 text-confidence-low" />
                ) : null}
              </div>
            ) : (
              <span className="text-lg font-medium text-muted-foreground">—</span>
            )
          }
          subtitle={hasOKRs ? "Change over quarter" : "Trend appears after check-ins"}
          variant={hasOKRs && stats.confidenceDelta > 0 ? 'success' : hasOKRs && stats.confidenceDelta < 0 ? 'danger' : 'default'}
        />
      </div>

      {/* OKR Summary Table */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">OKR Results</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {quarterOKRs.length === 0 ? (
            <div className="empty-state">
              <Target className="empty-state-icon" />
              <p className="empty-state-title">No OKRs for this quarter</p>
              <p className="empty-state-description max-w-md mx-auto">
                TrueNorthOS helps teams align on outcomes and make confidence explicit.
                OKR results will appear here once they are defined and checked in.
              </p>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-12 gap-4 px-2 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide border-b">
                <div className="col-span-5">Objective</div>
                <div className="col-span-2">Owner</div>
                <div className="col-span-2">Progress</div>
                <div className="col-span-2">Confidence</div>
                <div className="col-span-1">Trend</div>
              </div>
              
              {quarterOKRs.map((okr) => (
                <div
                  key={okr.id}
                  className="grid grid-cols-12 gap-4 px-2 py-3 data-row items-center"
                >
                  <div className="col-span-5">
                    <span className="font-medium text-sm truncate">{okr.objectiveText}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs text-muted-foreground">{okr.ownerName}</span>
                  </div>
                  <div className="col-span-2">
                    <ProgressBar 
                      value={okr.latestCheckIn?.progress || 0} 
                      showLabel 
                      size="sm" 
                    />
                  </div>
                  <div className="col-span-2">
                    {okr.latestCheckIn ? (
                      <ConfidenceBadge 
                        confidence={okr.latestCheckIn.confidence}
                        label={okr.latestCheckIn.confidenceLabel}
                        size="sm"
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">No check-in</span>
                    )}
                  </div>
                  <div className="col-span-1">
                    <TrendIndicator trend={okr.trend} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* What Changed */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">What Changed</CardTitle>
          <p className="helper-text">
            Significant confidence changes and the context behind them
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          {stats.significantChanges.length === 0 ? (
            <p className="text-muted-foreground text-sm py-6 text-center">
              {hasOKRs ? "No documented changes" : "Changes will appear after check-ins with confidence adjustments"}
            </p>
          ) : (
            <div className="space-y-3">
              {stats.significantChanges.slice(0, 8).map((ci) => {
                const okr = quarterOKRs.find(o => o.id === ci.okrId);
                return (
                  <div key={ci.id} className="border border-border/60 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{okr?.objectiveText}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{okr?.ownerName}</p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <ConfidenceBadge confidence={ci.confidence} label={ci.confidenceLabel} size="sm" />
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(ci.date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {ci.reasonForChange}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Next Quarter Decisions */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <RefreshCcw className="w-4 h-4 text-muted-foreground" />
            Next Quarter Decisions
          </CardTitle>
          <p className="helper-text">
            OKRs that have been rolled over to continue next quarter
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          {stats.rolledOver.length === 0 ? (
            <p className="text-muted-foreground text-sm py-6 text-center">
              No OKRs rolled over from this quarter yet
            </p>
          ) : (
            <div className="space-y-2">
              {stats.rolledOver.map((okr) => (
                <div key={okr.id} className="flex items-center justify-between border border-border/60 rounded-lg p-4">
                  <div>
                    <p className="font-medium text-sm">{okr.objectiveText}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Rolled over to {formatQuarter(okr.quarter)}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs">Rolled Over</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
