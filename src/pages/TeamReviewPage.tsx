import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { SignalCard } from '@/components/shared/SignalCard';
import { ConfidenceBadge } from '@/components/shared/ConfidenceBadge';
import { TrendIndicator } from '@/components/shared/TrendIndicator';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RootCauseBadge } from '@/components/shared/RootCauseBadge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatQuarter, type RootCauseCategory } from '@/types';
import { Target, Users } from 'lucide-react';
const QUARTERS = ['2026-Q1', '2025-Q4', '2025-Q3', '2025-Q2', '2025-Q1'];

type StatusFilter = 'all' | 'needs_attention' | 'on_track' | 'strong_momentum';
type SortBy = 'confidence' | 'progress' | 'recent_activity';

function getConfidenceTier(confidence: number): 'red' | 'amber' | 'green' {
  if (confidence < 40) return 'red';
  if (confidence < 70) return 'amber';
  return 'green';
}

function getAchievementBorderClass(achievement: 'achieved' | 'missed' | 'partially_achieved') {
  switch (achievement) {
    case 'achieved': return 'border-l-confidence-high';
    case 'partially_achieved': return 'border-l-confidence-medium';
    case 'missed': return 'border-l-confidence-low';
  }
}

function getAchievementBadgeVariant(achievement: 'achieved' | 'missed' | 'partially_achieved') {
  switch (achievement) {
    case 'achieved': return 'confidenceHigh';
    case 'partially_achieved': return 'confidenceMedium';
    case 'missed': return 'confidenceLow';
  }
}

export function TeamReviewPage() {
  const navigate = useNavigate();
  const { teams, getOKRsByQuarter, currentQuarter, checkIns } = useApp();

  const [selectedTeamId, setSelectedTeamId] = useState(teams[0]?.id ?? '');
  const [selectedQuarter, setSelectedQuarter] = useState(currentQuarter);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('confidence');

  // Sync selectedTeamId when teams load
  const effectiveTeamId = selectedTeamId || teams[0]?.id || '';

  const teamOKRs = useMemo(() => {
    const quarterOKRs = getOKRsByQuarter(selectedQuarter);
    return quarterOKRs.filter(
      (o) => o.level === 'team' && o.ownerId === effectiveTeamId
    );
  }, [selectedQuarter, effectiveTeamId, getOKRsByQuarter]);

  const selectedTeam = teams.find((t) => t.id === effectiveTeamId);

  const stats = useMemo(() => {
    const confidences = teamOKRs
      .map((o) => o.latestCheckIn?.confidence)
      .filter((c): c is number => c !== undefined);
    const progresses = teamOKRs
      .map((o) => o.latestCheckIn?.progress)
      .filter((p): p is number => p !== undefined);

    const avgConfidence =
      confidences.length > 0
        ? Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length)
        : 0;
    const avgProgress =
      progresses.length > 0
        ? Math.round(progresses.reduce((a, b) => a + b, 0) / progresses.length)
        : 0;
    const needsAttention = teamOKRs.filter(
      (o) => (o.latestCheckIn?.confidence ?? 100) < 40
    ).length;

    return {
      outcomeCount: teamOKRs.length,
      avgConfidence,
      avgProgress,
      needsAttention,
    };
  }, [teamOKRs]);

  const filteredAndSortedOKRs = useMemo(() => {
    let filtered = teamOKRs;

    if (statusFilter === 'needs_attention') {
      filtered = filtered.filter((o) => (o.latestCheckIn?.confidence ?? 100) < 40);
    } else if (statusFilter === 'on_track') {
      filtered = filtered.filter((o) => {
        const c = o.latestCheckIn?.confidence ?? 0;
        return c >= 40 && c < 70;
      });
    } else if (statusFilter === 'strong_momentum') {
      filtered = filtered.filter((o) => (o.latestCheckIn?.confidence ?? 0) >= 70);
    }

    const sorted = [...filtered];
    if (sortBy === 'confidence') {
      sorted.sort((a, b) => {
        const ca = a.latestCheckIn?.confidence ?? 100;
        const cb = b.latestCheckIn?.confidence ?? 100;
        return ca - cb;
      });
    } else if (sortBy === 'progress') {
      sorted.sort((a, b) => {
        const pa = a.latestCheckIn?.progress ?? 0;
        const pb = b.latestCheckIn?.progress ?? 0;
        return pa - pb;
      });
    } else {
      sorted.sort((a, b) => {
        const da = a.latestCheckIn?.date ?? '';
        const db = b.latestCheckIn?.date ?? '';
        return new Date(db).getTime() - new Date(da).getTime();
      });
    }

    return sorted;
  }, [teamOKRs, statusFilter, sortBy]);

  const confidenceTimelineCheckIns = useMemo(() => {
    const okrIds = new Set(teamOKRs.map((o) => o.id));
    return checkIns
      .filter((ci) => okrIds.has(ci.okrId))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  }, [teamOKRs, checkIns]);

  const riskDriverCounts = useMemo(() => {
    const okrIds = new Set(teamOKRs.map((o) => o.id));
    const counts: Record<RootCauseCategory, number> = {
      capacity: 0,
      dependency: 0,
      vendor: 0,
      compliance: 0,
      strategy_shift: 0,
      technical_debt: 0,
      data_quality: 0,
      scope_change: 0,
    };
    checkIns
      .filter((ci) => okrIds.has(ci.okrId) && ci.rootCause)
      .forEach((ci) => {
        if (ci.rootCause) counts[ci.rootCause]++;
      });
    return Object.entries(counts)
      .filter(([, n]) => n > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, n]) => ({ category: cat as RootCauseCategory, count: n }));
  }, [teamOKRs, checkIns]);

  const hasRiskDrivers = riskDriverCounts.length > 0;

  const hasOKRs = teamOKRs.length > 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">Team Review</h1>
          <p className="helper-text mt-1">
            Operational view for quarterly reviews · All outcomes for one team
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={effectiveTeamId}
            onValueChange={setSelectedTeamId}
            disabled={teams.length === 0}
          >
            <SelectTrigger className="w-40 bg-background h-8 text-sm">
              <SelectValue placeholder="Select team" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              {teams.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
            <SelectTrigger className="w-28 bg-background h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              {QUARTERS.map((q) => (
                <SelectItem key={q} value={q}>
                  {formatQuarter(q)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SignalCard
          title="Outcomes"
          value={
            hasOKRs ? (
              stats.outcomeCount
            ) : (
              <span className="text-lg font-medium text-muted-foreground">—</span>
            )
          }
          subtitle={hasOKRs ? 'Team OKRs this quarter' : 'No outcomes for this team'}
          icon={<Target className="w-5 h-5" />}
        />
        <SignalCard
          title="Avg Confidence"
          value={
            hasOKRs ? (
              <div className="flex items-center gap-3">
                <span>{stats.avgConfidence}</span>
                <ConfidenceBadge confidence={stats.avgConfidence} showValue={false} />
              </div>
            ) : (
              <span className="text-lg font-medium text-muted-foreground">—</span>
            )
          }
          subtitle={hasOKRs ? 'Latest average' : 'No check-in data'}
        />
        <SignalCard
          title="Needs Attention"
          value={
            hasOKRs ? (
              stats.needsAttention
            ) : (
              <span className="text-lg font-medium text-muted-foreground">—</span>
            )
          }
          subtitle={hasOKRs ? 'Confidence below 40' : 'No outcomes'}
          variant={stats.needsAttention > 0 ? 'danger' : 'default'}
        />
        <SignalCard
          title="Avg Progress"
          value={
            hasOKRs ? (
              <span className="tabular-nums">{stats.avgProgress}%</span>
            ) : (
              <span className="text-lg font-medium text-muted-foreground">—</span>
            )
          }
          subtitle={hasOKRs ? 'Latest average' : 'No check-in data'}
        />
      </div>

      {/* Filter bar */}
      {hasOKRs && (
        <div className="flex items-center gap-4 flex-wrap">
          <p className="text-xs uppercase tracking-wide font-medium text-muted-foreground">
            Status
          </p>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-40 bg-background h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="needs_attention">Needs Attention</SelectItem>
              <SelectItem value="on_track">On Track</SelectItem>
              <SelectItem value="strong_momentum">Strong Momentum</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs uppercase tracking-wide font-medium text-muted-foreground ml-4">
            Sort by
          </p>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
            <SelectTrigger className="w-40 bg-background h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="confidence">Confidence</SelectItem>
              <SelectItem value="progress">Progress</SelectItem>
              <SelectItem value="recent_activity">Recent activity</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* OKR Cards */}
      {!hasOKRs ? (
        <Card className="border-border/60">
          <CardContent className="py-16">
            <div className="empty-state">
              <Target className="empty-state-icon" />
              <p className="empty-state-title">
                No outcomes for {selectedTeam?.name ?? 'this team'} this quarter
              </p>
              <p className="empty-state-description max-w-md mx-auto">
                Outcomes will appear here once they are created and assigned to this team.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredAndSortedOKRs.map((okr) => {
            const isClosed = (okr.status ?? 'active') === 'closed' && okr.quarterClose;
            const borderClass = isClosed
              ? getAchievementBorderClass(okr.quarterClose!.achievement)
              : (() => {
                  const tier = getConfidenceTier(okr.latestCheckIn?.confidence ?? 70);
                  return tier === 'red'
                    ? 'border-l-confidence-low'
                    : tier === 'amber'
                      ? 'border-l-confidence-medium'
                      : 'border-l-confidence-high';
                })();

            return (
              <Card
                key={okr.id}
                className={`border-border/60 border-l-4 ${borderClass} cursor-pointer hover:bg-muted/30 transition-colors`}
                onClick={() => navigate(`/okrs/${okr.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <p className="font-medium text-sm flex-1 min-w-0">{okr.objectiveText}</p>
                    <div className="flex-shrink-0">
                      {isClosed ? (
                        <Badge variant={getAchievementBadgeVariant(okr.quarterClose!.achievement)} className="text-xs">
                          {okr.quarterClose!.achievement === 'achieved'
                            ? 'Achieved'
                            : okr.quarterClose!.achievement === 'partially_achieved'
                              ? 'Partially Achieved'
                              : 'Missed'}
                        </Badge>
                      ) : (
                        <ConfidenceBadge
                          confidence={okr.latestCheckIn?.confidence ?? 0}
                          label={okr.latestCheckIn?.confidenceLabel}
                          size="sm"
                        />
                      )}
                    </div>
                  </div>
                  <div className="mb-3">
                    <ProgressBar
                      value={okr.latestCheckIn?.progress ?? 0}
                      showLabel
                      size="sm"
                      className="w-full"
                    />
                  </div>
                  {isClosed && (
                    <p className="text-xs text-muted-foreground mb-2">Final: {okr.quarterClose!.finalValue}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                    <span>Last check-in: {formatCheckInDate(okr.latestCheckIn?.date)}</span>
                    <TrendIndicator trend={okr.trend} size="sm" />
                    <span>
                      {okr.checkIns.length} check-in{okr.checkIns.length !== 1 ? 's' : ''} this quarter
                    </span>
                  </div>
                  {isClosed && okr.quarterClose!.summary && (
                    <div className="mt-3 pl-3 border-l-2 border-border/60 text-xs text-muted-foreground italic">
                      {okr.quarterClose!.summary}
                    </div>
                  )}
                  {!isClosed && okr.latestCheckIn?.reasonForChange && (
                    <div className="mt-3 pl-3 border-l-2 border-border/60 text-xs text-muted-foreground italic">
                      &ldquo;{okr.latestCheckIn.reasonForChange}&rdquo;
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Risk Drivers - only if any check-ins have root causes */}
      {hasRiskDrivers && (
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Risk Drivers</CardTitle>
            <p className="helper-text">
              Root causes flagged across team check-ins this quarter
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {riskDriverCounts.map(({ category, count }) => (
                <span key={category} className="flex items-center gap-1.5">
                  <RootCauseBadge rootCause={category} size="sm" />
                  <span className="text-xs text-muted-foreground">({count})</span>
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confidence Timeline */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Confidence Over Time</CardTitle>
          <p className="helper-text">
            Recent check-ins for this team&apos;s outcomes, newest first
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          {confidenceTimelineCheckIns.length === 0 ? (
            <p className="text-muted-foreground text-sm py-6 text-center">
              {hasOKRs
                ? 'No check-ins yet'
                : 'Check-ins will appear after outcomes are created'}
            </p>
          ) : (
            <div className="space-y-3">
              {confidenceTimelineCheckIns.map((ci) => {
                const okr = teamOKRs.find((o) => o.id === ci.okrId);
                return (
                  <div
                    key={ci.id}
                    className="flex items-start justify-between gap-4 border border-border/60 rounded-lg p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground mb-0.5">
                        {new Date(ci.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                      <p className="font-medium text-sm truncate">{okr?.objectiveText}</p>
                      {ci.reasonForChange && (
                        <p className="text-xs text-muted-foreground italic mt-1">
                          {ci.reasonForChange}
                        </p>
                      )}
                      {ci.rootCauseNote && (
                        <p className="text-xs text-muted-foreground italic mt-1">
                          {ci.rootCauseNote}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <ConfidenceBadge
                        confidence={ci.confidence}
                        label={ci.confidenceLabel}
                        size="sm"
                      />
                      {ci.rootCause && (
                        <RootCauseBadge rootCause={ci.rootCause} size="sm" />
                      )}
                    </div>
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

function formatCheckInDate(date?: string): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}
