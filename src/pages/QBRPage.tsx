import { useMemo } from 'react';
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
import { formatQuarter, getConfidenceLabel } from '@/types';
import { Target, TrendingUp, TrendingDown, RefreshCcw } from 'lucide-react';
import { useState } from 'react';

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

  // Calculate stats
  const stats = useMemo(() => {
    const okrIds = quarterOKRs.map(o => o.id);
    
    // Get all check-ins for these OKRs
    const quarterCheckIns = checkIns.filter(ci => okrIds.includes(ci.okrId));
    
    // First check-ins (committed state)
    const firstCheckIns: Record<string, typeof checkIns[0]> = {};
    quarterCheckIns.forEach(ci => {
      if (!firstCheckIns[ci.okrId] || new Date(ci.date) < new Date(firstCheckIns[ci.okrId].date)) {
        firstCheckIns[ci.okrId] = ci;
      }
    });
    
    // Latest check-ins
    const latestCheckIns: Record<string, typeof checkIns[0]> = {};
    quarterCheckIns.forEach(ci => {
      if (!latestCheckIns[ci.okrId] || new Date(ci.date) > new Date(latestCheckIns[ci.okrId].date)) {
        latestCheckIns[ci.okrId] = ci;
      }
    });

    // Average confidence at start vs end
    const firstConfidences = Object.values(firstCheckIns).map(ci => ci.confidence);
    const latestConfidences = Object.values(latestCheckIns).map(ci => ci.confidence);
    
    const avgStartConfidence = firstConfidences.length > 0 
      ? Math.round(firstConfidences.reduce((a, b) => a + b, 0) / firstConfidences.length)
      : 0;
    
    const avgEndConfidence = latestConfidences.length > 0
      ? Math.round(latestConfidences.reduce((a, b) => a + b, 0) / latestConfidences.length)
      : 0;

    // Confidence changes with reasons
    const significantChanges = quarterCheckIns
      .filter(ci => ci.reasonForChange)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Rolled over OKRs
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

  const quarters = ['2024-Q4', '2024-Q3', '2024-Q2', '2024-Q1', '2025-Q1'];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Quarterly Business Review</h1>
          <p className="helper-text mt-1">
            QBR-ready summary for leadership review
          </p>
        </div>
        
        <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
          <SelectTrigger className="w-32 bg-background">
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
          value={stats.totalOKRs}
          subtitle={`${stats.onTrackCount} on track, ${stats.atRiskCount} at risk`}
          icon={<Target className="w-5 h-5" />}
        />
        
        <SignalCard
          title="Starting Confidence"
          value={
            <div className="flex items-center gap-2">
              <span>{stats.avgStartConfidence}</span>
              <ConfidenceBadge confidence={stats.avgStartConfidence} showValue={false} />
            </div>
          }
          subtitle="Average at quarter start"
        />
        
        <SignalCard
          title="Current Confidence"
          value={
            <div className="flex items-center gap-2">
              <span>{stats.avgEndConfidence}</span>
              <ConfidenceBadge confidence={stats.avgEndConfidence} showValue={false} />
            </div>
          }
          subtitle="Latest average"
        />
        
        <SignalCard
          title="Confidence Trend"
          value={
            <div className="flex items-center gap-2">
              <span>{stats.confidenceDelta > 0 ? '+' : ''}{stats.confidenceDelta}</span>
              {stats.confidenceDelta > 0 ? (
                <TrendingUp className="w-5 h-5 text-confidence-high" />
              ) : stats.confidenceDelta < 0 ? (
                <TrendingDown className="w-5 h-5 text-confidence-low" />
              ) : null}
            </div>
          }
          subtitle="Change over quarter"
          variant={stats.confidenceDelta > 0 ? 'success' : stats.confidenceDelta < 0 ? 'danger' : 'default'}
        />
      </div>

      {/* OKR Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">OKR Results</CardTitle>
        </CardHeader>
        <CardContent>
          {quarterOKRs.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No OKRs for this quarter</p>
          ) : (
            <div className="space-y-1">
              <div className="grid grid-cols-12 gap-4 px-4 py-2 text-sm font-medium text-muted-foreground border-b">
                <div className="col-span-5">Objective</div>
                <div className="col-span-2">Owner</div>
                <div className="col-span-2">Progress</div>
                <div className="col-span-2">Confidence</div>
                <div className="col-span-1">Trend</div>
              </div>
              
              {quarterOKRs.map((okr) => (
                <div
                  key={okr.id}
                  className="grid grid-cols-12 gap-4 px-4 py-3 data-row items-center"
                >
                  <div className="col-span-5">
                    <span className="font-medium truncate">{okr.objectiveText}</span>
                  </div>
                  <div className="col-span-2">
                    <Badge variant="secondary" className="font-normal">
                      {okr.ownerName}
                    </Badge>
                  </div>
                  <div className="col-span-2">
                    <ProgressBar 
                      value={okr.latestCheckIn?.progress || 0} 
                      showLabel 
                      size="sm" 
                    />
                  </div>
                  <div className="col-span-2">
                    {okr.latestCheckIn && (
                      <ConfidenceBadge 
                        confidence={okr.latestCheckIn.confidence}
                        label={okr.latestCheckIn.confidenceLabel}
                      />
                    )}
                  </div>
                  <div className="col-span-1">
                    <TrendIndicator trend={okr.trend} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* What Changed */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">What Changed</CardTitle>
          <p className="helper-text">
            Significant confidence changes and the reasons behind them
          </p>
        </CardHeader>
        <CardContent>
          {stats.significantChanges.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No documented changes</p>
          ) : (
            <div className="space-y-4">
              {stats.significantChanges.slice(0, 10).map((ci) => {
                const okr = quarterOKRs.find(o => o.id === ci.okrId);
                return (
                  <div key={ci.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium">{okr?.objectiveText}</p>
                        <p className="text-sm text-muted-foreground">{okr?.ownerName}</p>
                      </div>
                      <div className="text-right">
                        <ConfidenceBadge confidence={ci.confidence} label={ci.confidenceLabel} />
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(ci.date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm italic text-muted-foreground">
                      "{ci.reasonForChange}"
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Next Quarter Decisions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <RefreshCcw className="w-4 h-4" />
            Next Quarter Decisions
          </CardTitle>
          <p className="helper-text">
            OKRs that have been rolled over to continue next quarter
          </p>
        </CardHeader>
        <CardContent>
          {stats.rolledOver.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No OKRs rolled over from this quarter yet
            </p>
          ) : (
            <div className="space-y-2">
              {stats.rolledOver.map((okr) => {
                const originalOkr = quarterOKRs.find(o => o.id === okr.rolledOverFrom);
                return (
                  <div key={okr.id} className="flex items-center justify-between border rounded-lg p-4">
                    <div>
                      <p className="font-medium">{okr.objectiveText}</p>
                      <p className="text-sm text-muted-foreground">
                        Rolled over to {formatQuarter(okr.quarter)}
                      </p>
                    </div>
                    <Badge variant="secondary">Rolled Over</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
