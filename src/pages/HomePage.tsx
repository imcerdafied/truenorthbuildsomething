import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { SignalCard } from '@/components/shared/SignalCard';
import { ConfidenceBadge } from '@/components/shared/ConfidenceBadge';
import { TrendIndicator } from '@/components/shared/TrendIndicator';
import { OrphanWarning } from '@/components/shared/OrphanWarning';
import { TeamWeeklyView } from '@/components/views/TeamWeeklyView';
import { ProductAreaView } from '@/components/views/ProductAreaView';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Calendar
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

  // Calculate overall trend based on aggregated check-in history
  const overallTrend = useMemo(() => {
    if (!hasOKRs) return null;
    
    // Get all check-ins for team OKRs sorted by date
    const teamCheckIns = checkIns
      .filter(ci => allTeamOKRIds.includes(ci.okrId))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    if (teamCheckIns.length < 2) return null;
    
    // Get the two most recent dates with check-ins
    const dates = [...new Set(teamCheckIns.map(ci => ci.date))].sort((a, b) => 
      new Date(b).getTime() - new Date(a).getTime()
    );
    
    if (dates.length < 2) return null;
    
    const latestDate = dates[0];
    const previousDate = dates[1];
    
    const latestAvg = teamCheckIns
      .filter(ci => ci.date === latestDate)
      .reduce((sum, ci, _, arr) => sum + ci.confidence / arr.length, 0);
    
    const previousAvg = teamCheckIns
      .filter(ci => ci.date === previousDate)
      .reduce((sum, ci, _, arr) => sum + ci.confidence / arr.length, 0);
    
    if (latestAvg > previousAvg) return 'up';
    if (latestAvg < previousAvg) return 'down';
    return 'flat';
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
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <p className="t2">{currentTeam?.name || 'Team'}</p>
          <span className="t3">{formatQuarter(currentQuarter)}</span>
        </div>

        <div className="flex items-center gap-2">
          {hasOKRs && (
            <Button 
              variant="outline" 
              onClick={() => setShowWeeklyView(true)} 
              size="sm" 
              className="gap-2"
            >
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Weekly View</span>
            </Button>
          )}
          {canRunCheckIn && hasOKRs && (
            <Button onClick={() => navigate('/checkin')} size="sm" className="gap-2">
              <PlayCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Check-in</span>
            </Button>
          )}
        </div>
      </div>

      {/* Signal summary: compact strip for 1 OKR, 4-card grid for 2+ OKRs */}
      {hasOKRs && teamOKRs.length === 1 && (
        <Card className="border-border/60">
          <CardContent className="py-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="t3 uppercase tracking-wider">Confidence</span>
                  <span className="t3">{overallConfidence}</span>
                  <ConfidenceBadge confidence={overallConfidence} showValue={false} />
                  {overallTrend && <TrendIndicator trend={overallTrend} size="sm" />}
                </div>
                {latestCheckIn && (
                  <div className="flex items-center gap-2">
                    <span className="t3 uppercase tracking-wider">Last check-in</span>
                    <span className="t3">{new Date(latestCheckIn.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                )}
                {nextCheckInDate && (
                  <div className="flex items-center gap-2">
                    <span className="t3 uppercase tracking-wider">Next</span>
                    <span className="t3">{nextCheckInDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                )}
              </div>
              {hasOKRs && overallConfidence >= 60 && overallTrend !== 'down' && atRiskCount === 0 && (
                <span className="t3 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                  No action needed
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      {hasOKRs && teamOKRs.length > 1 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <SignalCard
            title="Overall Confidence"
            value={
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <span>{overallConfidence}</span>
                <ConfidenceBadge confidence={overallConfidence} showValue={false} />
                {overallTrend && (
                  <TrendIcon 
                    className={`w-4 h-4 ${
                      overallTrend === 'up' ? 'text-confidence-high' : 
                      overallTrend === 'down' ? 'text-confidence-low' : 
                      'text-muted-foreground'
                    }`} 
                  />
                )}
                {!overallTrend && hasOKRs && (
                  <span className="t3">—</span>
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
                : <span className="t3 font-medium">Not scheduled</span>
            }
            subtitle={`${currentTeam?.cadence === 'weekly' ? 'Weekly' : 'Bi-weekly'} cadence`}
            icon={<Clock className="w-5 h-5" />}
          />
        </div>
      )}

      {/* Team Outcomes */}
      <Card className="border-border/60">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="t2">Your Team Outcomes</CardTitle>
          {hasOKRs && (
            <Button variant="ghost" size="sm" onClick={() => navigate('/okrs')} className="gap-1 t3 h-8">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          )}
        </CardHeader>
        <CardContent className="pt-0">
          {teamOKRs.length === 0 ? (
            <div className="empty-state py-16">
              <Target className="empty-state-icon" />
              <p className="t1-medium mb-1">Get started with your first outcome</p>
              <p className="t3 max-w-md mx-auto mt-2">
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
                  <p className="t3 mt-3">
                    Start with an outcome your team owns this quarter.
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-0">
              {teamOKRs.map((okr) => (
                <div
                  key={okr.id}
                  className="py-4 px-2 cursor-pointer rounded-md -mx-2 hover:bg-muted/30 transition-colors"
                  onClick={() => navigate(`/okrs/${okr.id}`)}
                >
                  <p className="t1-medium">{okr.objectiveText}</p>

                  {okr.latestCheckIn && (
                    <p className="t1 mt-1 text-foreground/60">
                      {okr.checkIns.length >= 2 && (() => {
                        const sorted = [...okr.checkIns].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                        const latest = sorted[0];
                        const prev = sorted[1];
                        const delta = latest.confidence - prev.confidence;
                        const arrow = delta > 0 ? '↑' : delta < 0 ? '↓' : '→';
                        return `Confidence ${arrow} from ${prev.confidence} → ${latest.confidence} · `;
                      })()}
                      {`${okr.latestCheckIn.progress}% toward measures`}
                      {okr.latestCheckIn.reasonForChange && ` · ${okr.latestCheckIn.reasonForChange}`}
                      {okr.latestCheckIn.optionalNote && !okr.latestCheckIn.reasonForChange && ` · ${okr.latestCheckIn.optionalNote}`}
                    </p>
                  )}

                  <div className="flex items-center gap-4 mt-2">
                    <span className="t3">
                      {okr.latestCheckIn
                        ? `${okr.latestCheckIn.confidence} ${okr.latestCheckIn.confidenceLabel}`
                        : 'No signal yet'}
                    </span>
                    {okr.latestCheckIn && <TrendIndicator trend={okr.trend} size="sm" />}
                    {okr.isOrphaned && <OrphanWarning />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confidence narrative - single-outcome teams */}
      {teamOKRs.length === 1 && (
        <Card className="border-border/60">
          <CardContent className="py-5 space-y-4">
            {teamOKRs[0].latestCheckIn?.reasonForChange && (
              <div>
                <h3 className="t3 uppercase tracking-wider mb-2">
                  {teamOKRs[0].latestCheckIn.confidence >= 60 ? 'Why confidence is high' :
                    teamOKRs[0].latestCheckIn.confidence >= 40 ? 'Current confidence context' :
                    'Why confidence is low'}
                </h3>
                <p className="t1">
                  {teamOKRs[0].latestCheckIn.reasonForChange}
                </p>
              </div>
            )}
            <div>
              <h3 className="t3 uppercase tracking-wider mb-2">
                What could change confidence
              </h3>
              {teamOKRs[0].latestCheckIn?.optionalNote ? (
                <p className="t1">
                  {teamOKRs[0].latestCheckIn.optionalNote}
                </p>
              ) : (
                <p className="t1 text-muted-foreground">
                  No check-ins yet. Your first check-in will capture what could change confidence.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {alignmentStats && (
        <div className="flex items-center justify-between px-1">
          <p className="t3">
            {alignmentStats.linked > 0
              ? `${alignmentStats.linked} of ${alignmentStats.total} outcome${alignmentStats.total !== 1 ? 's' : ''} linked to parent objectives`
              : `${alignmentStats.total} top-level outcome${alignmentStats.total !== 1 ? 's' : ''}`
            }
          </p>
          <Button variant="ghost" size="sm" onClick={() => navigate('/structure')} className="t3 h-6 px-2">
            View structure →
          </Button>
        </div>
      )}

      {/* Peer Teams - only show if current team has OKRs OR any peer has OKRs */}
      {peerTeams.length > 0 && (hasOKRs || anyPeerHasOKRs) && (
        <Card className="border-border/60">
          <CardHeader className="pb-4">
            <CardTitle className="t2">Related teams that influence this outcome</CardTitle>
            <p className="t3 mt-1">Teams whose work may impact your outcomes.</p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {peerTeams.map((team) => {
                const teamOkrs = getTeamOKRs(team.id);
                const okrIds = teamOkrs.map(o => o.id);
                const confidence = getOverallConfidence(okrIds);
                const atRisk = getAtRiskCount(okrIds);
                const hasTeamOKRs = teamOkrs.length > 0;
                
                return (
                  <div 
                    key={team.id}
                    className="border border-border/60 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="t2">{team.name}</h4>
                        <p className="t3 mt-0.5">PM: {team.pmName}</p>
                      </div>
                      <div className="text-right">
                        {hasTeamOKRs ? (
                          <>
                            <ConfidenceBadge confidence={confidence} />
                            {atRisk > 0 && (
                              <p className="t3 text-confidence-low mt-1">
                                {atRisk} at risk
                              </p>
                            )}
                          </>
                        ) : (
                          <span className="t3">No signal yet</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
