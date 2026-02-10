import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { SignalCard } from '@/components/shared/SignalCard';
import { ConfidenceBadge } from '@/components/shared/ConfidenceBadge';
import { TrendIndicator } from '@/components/shared/TrendIndicator';
import { OrphanWarning } from '@/components/shared/OrphanWarning';
import { TeamWeeklyView } from '@/components/views/TeamWeeklyView';
import { ProductAreaView } from '@/components/views/ProductAreaView';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { 
  Target, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  ArrowRight,
  PlayCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
  Check,
  Circle
} from 'lucide-react';
import { formatQuarter, getNextCheckInDate } from '@/types';
import { useMemo } from 'react';

export function HomePage() {
  const navigate = useNavigate();
  const [showWeeklyView, setShowWeeklyView] = useState(false);
  const { 
    viewMode,
    currentQuarter,
    teams,
    domains,
    selectedTeamId,
    getTeamOKRs,
    getOverallConfidence,
    getAtRiskCount,
    getOnTrackCount,
    isCurrentUserPM,
    checkIns
  } = useApp();

  // Get the current team
  const currentTeam = teams.find(t => t.id === selectedTeamId);
  const currentDomain = domains.find(d => d.id === currentTeam?.domainId);
  
  // Get OKRs based on view mode
  const teamOKRs = getTeamOKRs(selectedTeamId);
  const allTeamOKRIds = teamOKRs.map(o => o.id);
  
  const hasOKRs = teamOKRs.length > 0;
  
  // Calculate overall stats
  const overallConfidence = getOverallConfidence(allTeamOKRIds);
  const atRiskCount = getAtRiskCount(allTeamOKRIds);
  const onTrackCount = getOnTrackCount(allTeamOKRIds);

  // Confidence color system: High 70+, Medium 40-69, Low 0-39
  const confidenceLevel = overallConfidence >= 70 ? 'high' : overallConfidence >= 40 ? 'medium' : 'low';
  const confidenceColor = confidenceLevel === 'high' ? 'emerald' : confidenceLevel === 'medium' ? 'amber' : 'red';
  const confidenceLabel =
    confidenceLevel === 'high' ? 'High Confidence' : confidenceLevel === 'medium' ? 'Medium Confidence' : 'Low Confidence';

  // Calculate overall trend and numeric delta from check-in history
  const { overallTrend, overallTrendDelta } = useMemo(() => {
    if (!hasOKRs) return { overallTrend: null as 'up' | 'down' | 'flat' | null, overallTrendDelta: null as number | null };
    const teamCheckIns = checkIns
      .filter(ci => allTeamOKRIds.includes(ci.okrId))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (teamCheckIns.length < 2) return { overallTrend: null, overallTrendDelta: null };
    const dates = [...new Set(teamCheckIns.map(ci => ci.date))].sort((a, b) =>
      new Date(b).getTime() - new Date(a).getTime()
    );
    if (dates.length < 2) return { overallTrend: null, overallTrendDelta: null };
    const latestDate = dates[0];
    const previousDate = dates[1];
    const latestAvg = teamCheckIns
      .filter(ci => ci.date === latestDate)
      .reduce((sum, ci, _, arr) => sum + ci.confidence / arr.length, 0);
    const previousAvg = teamCheckIns
      .filter(ci => ci.date === previousDate)
      .reduce((sum, ci, _, arr) => sum + ci.confidence / arr.length, 0);
    const delta = Math.round(latestAvg - previousAvg);
    const trend = latestAvg > previousAvg ? 'up' : latestAvg < previousAvg ? 'down' : 'flat';
    return { overallTrend: trend, overallTrendDelta: delta !== 0 ? delta : null };
  }, [checkIns, allTeamOKRIds, hasOKRs]);

  // Alignment summary (team mode, when OKRs exist)
  const alignmentStats = useMemo(() => {
    if (!hasOKRs) return null;
    const linked = teamOKRs.filter(o => o.parentOkrId);
    const unlinked = teamOKRs.filter(o => !o.parentOkrId);
    return {
      total: teamOKRs.length,
      linked: linked.length,
      unlinked: unlinked.length,
    };
  }, [teamOKRs, hasOKRs]);

  // Get peer teams in the same domain
  const peerTeams = teams.filter(t => t.domainId === currentTeam?.domainId && t.id !== selectedTeamId);

  // Check if any peer team has OKRs
  const peerTeamsWithOKRs = peerTeams.filter(team => getTeamOKRs(team.id).length > 0);
  const anyPeerHasOKRs = peerTeamsWithOKRs.length > 0;

  // Calculate next check-in date
  const latestCheckIn = teamOKRs
    .flatMap(o => o.checkIns)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  
  const nextCheckInDate = latestCheckIn 
    ? getNextCheckInDate(new Date(latestCheckIn.date), currentTeam?.cadence || 'biweekly')
    : null;

  const canRunCheckIn = isCurrentUserPM(selectedTeamId);
  const canCreateOKR = true; // Simplified for prototype

  const TrendIcon = overallTrend === 'up' ? TrendingUp : overallTrend === 'down' ? TrendingDown : Minus;

  // If in exec mode, or "All teams" selected in team view, show Product Area View
  if (viewMode === 'exec' || (viewMode === 'team' && !selectedTeamId)) {
    return <ProductAreaView />;
  }

  // If showing weekly view, render it
  if (showWeeklyView) {
    return <TeamWeeklyView onBack={() => setShowWeeklyView(false)} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <p className="text-sm font-medium text-foreground">{currentTeam?.name || 'Team'}</p>
        <span className="text-xs text-muted-foreground">{formatQuarter(currentQuarter)}</span>
      </div>

      {/* Confidence banner — bold signal header (single-outcome teams) */}
      {hasOKRs && teamOKRs.length === 1 && (
        <div
          className={`bg-white rounded-xl p-6 shadow-sm flex flex-wrap justify-between items-center gap-4 border-l-4 ${
            confidenceColor === 'emerald'
              ? 'border-emerald-500'
              : confidenceColor === 'amber'
                ? 'border-amber-500'
                : 'border-red-500'
          }`}
        >
          <div className="flex flex-col gap-0.5">
            <span
              className={`text-5xl font-bold tabular-nums ${
                confidenceColor === 'emerald'
                  ? 'text-emerald-600'
                  : confidenceColor === 'amber'
                    ? 'text-amber-500'
                    : 'text-red-500'
              }`}
            >
              {overallConfidence}
            </span>
            <span
              className={`text-sm font-medium ${
                confidenceColor === 'emerald'
                  ? 'text-emerald-600'
                  : confidenceColor === 'amber'
                    ? 'text-amber-500'
                    : 'text-red-500'
              }`}
            >
              {confidenceLabel}
            </span>
            {overallTrend && overallTrendDelta !== null && (
              <span className="text-xs text-muted-foreground">
                {overallTrend === 'up' && '↑'}
                {overallTrend === 'down' && '↓'}
                {overallTrend === 'flat' && '→'}{' '}
                {overallTrendDelta > 0 && '+'}
                {overallTrendDelta} from last check-in
              </span>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            {latestCheckIn && (
              <span className="text-xs text-muted-foreground">
                Last check-in: {new Date(latestCheckIn.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}
            {nextCheckInDate && (
              <span className="text-xs text-muted-foreground">
                Next: {nextCheckInDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}
            {canRunCheckIn && hasOKRs && (
              <Button onClick={() => navigate('/checkin')} size="sm" className="gap-1.5 mt-2">
                <PlayCircle className="w-3.5 h-3.5" />
                Check-in
              </Button>
            )}
          </div>
        </div>
      )}
      {hasOKRs && teamOKRs.length > 1 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <SignalCard
            title="Overall Confidence"
            value={
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <span className={confidenceColor === 'emerald' ? 'text-emerald-600' : confidenceColor === 'amber' ? 'text-amber-500' : 'text-red-500'}>{overallConfidence}</span>
                <ConfidenceBadge confidence={overallConfidence} showValue={false} />
                {overallTrend && (
                  <TrendIcon
                    className={`w-4 h-4 ${
                      overallTrend === 'up' ? 'text-emerald-600' :
                      overallTrend === 'down' ? 'text-red-500' :
                      'text-muted-foreground'
                    }`}
                  />
                )}
                {!overallTrend && hasOKRs && (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </div>
            }
            subtitle="Aggregate across all outcomes"
            icon={<Target className="w-5 h-5" />}
          />
          <SignalCard
            title="On Track"
            value={onTrackCount}
            subtitle={`of ${teamOKRs.length} outcomes with confidence ≥40`}
            icon={<CheckCircle2 className="w-5 h-5" />}
            variant={onTrackCount > 0 ? "success" : "default"}
          />
          <SignalCard
            title="At Risk"
            value={atRiskCount}
            subtitle="Outcomes with confidence <40"
            icon={<AlertTriangle className="w-5 h-5" />}
            variant={atRiskCount > 0 ? 'danger' : 'default'}
          />
          <SignalCard
            title="Next Check-in"
            value={
              nextCheckInDate
                ? nextCheckInDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : <span className="text-xs font-medium text-muted-foreground">Not scheduled</span>
            }
            subtitle={`${currentTeam?.cadence === 'weekly' ? 'Weekly' : 'Bi-weekly'} cadence`}
            icon={<Clock className="w-5 h-5" />}
          />
        </div>
      )}

      {/* Team Outcomes */}
      <div className="bg-white rounded-xl shadow-sm py-2">
        <div className="flex flex-row items-center justify-between px-4 pb-3">
          <h2 className="text-xs uppercase tracking-wide font-medium text-muted-foreground">Your Team Outcomes</h2>
          {hasOKRs && (
            <Button variant="ghost" size="sm" onClick={() => navigate('/okrs')} className="gap-1 text-xs text-muted-foreground h-8">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
        <div className="px-4 pb-4">
          {teamOKRs.length === 0 ? (
            <div className="empty-state py-16">
              <Target className="empty-state-icon" />
              <p className="text-xl font-semibold text-foreground mb-1">Get started with your first outcome</p>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mt-2">
                TrueNorthOS helps teams align on outcomes and make confidence explicit.
                Define your first outcome to establish your signal for the quarter.
              </p>
              {canCreateOKR && (
                <>
                  <Button
                    onClick={() => navigate('/okrs/create')}
                    className="mt-6 gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Create outcome
                  </Button>
                  <p className="text-xs text-muted-foreground mt-3">
                    Start with an outcome your team owns this quarter.
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-0">
              {teamOKRs.map((okr) => {
                const prevCheckIn = okr.checkIns.length >= 2
                  ? [...okr.checkIns].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[1]
                  : null;
                const latest = okr.latestCheckIn;
                const okrConfLevel = latest ? (latest.confidence >= 70 ? 'high' : latest.confidence >= 40 ? 'medium' : 'low') : null;
                const okrConfColor = okrConfLevel === 'high' ? 'emerald' : okrConfLevel === 'medium' ? 'amber' : 'red';
                const trendColor = okr.trend === 'up' ? 'text-emerald-600' : okr.trend === 'down' ? 'text-red-500' : 'text-muted-foreground';
                return (
                  <div
                    key={okr.id}
                    className="py-4 px-2 cursor-pointer rounded-md -mx-2 hover:bg-muted/30 transition-colors"
                    onClick={() => navigate(`/okrs/${okr.id}`)}
                  >
                    <p className="text-xl font-semibold text-foreground">{okr.objectiveText}</p>

                    {latest && (
                      <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 mt-2">
                        <span className="text-xs text-muted-foreground font-medium">Confidence</span>
                        <span className={`text-sm text-foreground ${trendColor}`}>
                          {prevCheckIn
                            ? `${okr.trend === 'up' ? '↑' : okr.trend === 'down' ? '↓' : '→'} ${prevCheckIn.confidence} → ${latest.confidence}`
                            : `${latest.confidence}`}
                        </span>
                        <span className="text-xs text-muted-foreground font-medium">Progress</span>
                        <span className="text-sm text-foreground">{latest.progress}% toward measures</span>
                        <span className="text-xs text-muted-foreground font-medium">Signal</span>
                        <span className="text-sm text-foreground flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${okrConfColor === 'emerald' ? 'bg-emerald-500' : okrConfColor === 'amber' ? 'bg-amber-500' : 'bg-red-500'}`} />
                          {latest.reasonForChange ? latest.reasonForChange.split(/[.!?]+/).filter(Boolean)[0]?.trim() || latest.reasonForChange : 'No signal yet'}
                        </span>
                      </div>
                    )}

                    {!latest && (
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs text-muted-foreground">No signal yet</span>
                        {okr.isOrphaned && <OrphanWarning />}
                      </div>
                    )}
                    {latest && okr.isOrphaned && (
                      <div className="mt-2">
                        <OrphanWarning />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Why confidence / What could change — structured (single-outcome teams) */}
      {teamOKRs.length === 1 && (
        <div className="bg-muted/30 rounded-lg p-5">
          {teamOKRs[0].latestCheckIn?.reasonForChange && (
            <div>
              <h3 className="text-xs uppercase tracking-wide font-medium text-muted-foreground mb-3">
                {teamOKRs[0].latestCheckIn.confidence >= 70 ? 'Why confidence is high' :
                  teamOKRs[0].latestCheckIn.confidence >= 40 ? 'Current confidence context' :
                  'Why confidence is low'}
              </h3>
              <ul className="space-y-2">
                {teamOKRs[0].latestCheckIn.reasonForChange
                  .split(/[.!?]+/)
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .map((point, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      {point}.
                    </li>
                  ))}
              </ul>
            </div>
          )}
          <div className={teamOKRs[0].latestCheckIn?.reasonForChange ? 'border-t border-muted my-4 pt-4' : ''}>
            <h3 className="text-xs uppercase tracking-wide font-medium text-muted-foreground mb-3">
              What could change confidence
            </h3>
            <ul className="space-y-2">
              {teamOKRs[0].latestCheckIn?.optionalNote ? (
                teamOKRs[0].latestCheckIn.optionalNote
                  .split(/[.!?]+/)
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .map((point, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Circle className="w-3 h-3 text-muted-foreground shrink-0 mt-1.5 fill-current" />
                      {point}.
                    </li>
                  ))
              ) : (
                <li className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Circle className="w-3 h-3 text-muted-foreground shrink-0 mt-1.5 fill-current" />
                  No check-ins yet. Your first check-in will capture what could change confidence.
                </li>
              )}
            </ul>
          </div>
        </div>
      )}

      {alignmentStats && (
        <div className="px-1">
          <p className="text-xs text-muted-foreground">
            {alignmentStats.linked > 0
              ? `${alignmentStats.linked} of ${alignmentStats.total} outcome${alignmentStats.total !== 1 ? 's' : ''} linked to parent objectives`
              : `${alignmentStats.total} top-level outcome${alignmentStats.total !== 1 ? 's' : ''}`
            }
          </p>
        </div>
      )}

      {/* Related teams */}
      {peerTeams.length > 0 && (hasOKRs || anyPeerHasOKRs) && (
        <div className="bg-muted/20 rounded-lg p-5">
          <h2 className="text-xs uppercase tracking-wide font-medium text-muted-foreground mb-1">Related teams that influence this outcome</h2>
          <p className="text-xs text-muted-foreground/80 mb-4">Teams whose work may impact your outcomes.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {peerTeams.map((team) => {
              const teamOkrs = getTeamOKRs(team.id);
              const okrIds = teamOkrs.map(o => o.id);
              const confidence = getOverallConfidence(okrIds);
              const atRisk = getAtRiskCount(okrIds);
              const hasTeamOKRs = teamOkrs.length > 0;
              const teamConfLevel = confidence >= 70 ? 'high' : confidence >= 40 ? 'medium' : 'low';
              const teamConfColor = teamConfLevel === 'high' ? 'emerald' : teamConfLevel === 'medium' ? 'amber' : 'red';
              return (
                <div
                  key={team.id}
                  className="border border-muted/40 rounded-lg p-4 bg-white"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-foreground">{team.name}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">PM: {team.pmName}</p>
                    </div>
                    <div className="text-right">
                      {hasTeamOKRs ? (
                        <>
                          <span className={`text-xs font-medium tabular-nums ${
                            teamConfColor === 'emerald' ? 'text-emerald-600' : teamConfColor === 'amber' ? 'text-amber-500' : 'text-red-500'
                          }`}>
                            {confidence} {teamConfLevel === 'high' ? 'High' : teamConfLevel === 'medium' ? 'Medium' : 'Low'}
                          </span>
                          {atRisk > 0 && (
                            <p className="text-xs text-red-500 mt-1">{atRisk} at risk</p>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">No signal yet</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
