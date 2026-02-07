import { useApp } from '@/context/AppContext';
import { SignalCard } from '@/components/shared/SignalCard';
import { ConfidenceBadge } from '@/components/shared/ConfidenceBadge';
import { TrendIndicator } from '@/components/shared/TrendIndicator';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { OrphanWarning } from '@/components/shared/OrphanWarning';
import { ConfidenceSparkline } from '@/components/shared/ConfidenceSparkline';
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
  Plus
} from 'lucide-react';
import { formatQuarter, getNextCheckInDate } from '@/types';
import { useMemo } from 'react';

export function HomePage() {
  const navigate = useNavigate();
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

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">
            {viewMode === 'exec' ? 'Executive Dashboard' : `${currentTeam?.name || 'Team'}`}
          </h1>
          <p className="helper-text mt-1">
            What are we trying to achieve, and are we on track?
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatQuarter(currentQuarter)} · Source of truth for quarterly business reviews
          </p>
        </div>
        
        {canRunCheckIn && hasOKRs && (
          <Button onClick={() => navigate('/checkin')} size="sm" className="gap-2">
            <PlayCircle className="w-4 h-4" />
            Run Check-in
          </Button>
        )}
      </div>

      {/* Signal Cards - calm briefing */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SignalCard
          title="Overall Confidence"
          value={
            hasOKRs ? (
              <div className="flex items-center gap-3">
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
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </div>
            ) : (
              <span className="text-lg font-medium text-muted-foreground">Not yet established</span>
            )
          }
          subtitle={hasOKRs ? "Aggregate across all OKRs" : "No OKRs have been defined for this quarter."}
          icon={<Target className="w-5 h-5" />}
        />
        
        <SignalCard
          title="On Track"
          value={hasOKRs ? onTrackCount : <span className="text-lg font-medium text-muted-foreground">No signal yet</span>}
          subtitle={hasOKRs ? `of ${teamOKRs.length} OKRs with confidence ≥40` : "OKRs appear here once teams define outcomes."}
          icon={<CheckCircle2 className="w-5 h-5" />}
          variant={hasOKRs && onTrackCount > 0 ? "success" : "default"}
        />
        
        <SignalCard
          title="At Risk"
          value={hasOKRs ? atRiskCount : <span className="text-lg font-medium text-muted-foreground">No signal yet</span>}
          subtitle={hasOKRs ? "OKRs with confidence <40" : "Risk becomes visible as confidence is tracked."}
          icon={<AlertTriangle className="w-5 h-5" />}
          variant={hasOKRs && atRiskCount > 0 ? 'danger' : 'default'}
        />
        
        <SignalCard
          title="Next Check-in"
          value={
            hasOKRs && nextCheckInDate 
              ? nextCheckInDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) 
              : <span className="text-lg font-medium text-muted-foreground">Not scheduled</span>
          }
          subtitle={hasOKRs ? `${currentTeam?.cadence === 'weekly' ? 'Weekly' : 'Bi-weekly'} cadence` : "Check-ins begin after OKRs are created."}
          icon={<Clock className="w-5 h-5" />}
        />
      </div>

      {/* Team OKRs */}
      <Card className="border-border/60">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-base font-medium">Your Team OKRs</CardTitle>
          {hasOKRs && (
            <Button variant="ghost" size="sm" onClick={() => navigate('/okrs')} className="gap-1 text-xs h-8">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          )}
        </CardHeader>
        <CardContent className="pt-0">
          {teamOKRs.length === 0 ? (
            <div className="empty-state py-16">
              <Target className="empty-state-icon" />
              <p className="empty-state-title text-lg">Get started with your first OKR</p>
              <p className="empty-state-description max-w-md mx-auto mt-2">
                TrueNorth helps teams align on outcomes and make confidence explicit.
                Define your first OKR to establish your signal for the quarter.
              </p>
              {canCreateOKR && (
                <>
                  <Button 
                    onClick={() => navigate('/okrs/create')} 
                    className="mt-6 gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Create OKR
                  </Button>
                  <p className="text-xs text-muted-foreground mt-3">
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
                  className="data-row flex items-center gap-4 py-3.5 px-2 cursor-pointer rounded-md -mx-2"
                  onClick={() => navigate(`/okrs/${okr.id}`)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{okr.objectiveText}</span>
                      {okr.isOrphaned && <OrphanWarning />}
                    </div>
                  </div>
                  
                  <div className="w-28">
                    <ProgressBar value={okr.latestCheckIn?.progress || 0} showLabel size="sm" />
                  </div>
                  
                  <div className="w-20">
                    <ConfidenceSparkline checkIns={okr.checkIns} />
                  </div>
                  
                  <div className="flex items-center gap-3 min-w-[140px] justify-end">
                    {okr.latestCheckIn && (
                      <ConfidenceBadge 
                        confidence={okr.latestCheckIn.confidence} 
                        label={okr.latestCheckIn.confidenceLabel}
                      />
                    )}
                    <TrendIndicator trend={okr.trend} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Peer Teams - only show if current team has OKRs OR any peer has OKRs */}
      {peerTeams.length > 0 && (hasOKRs || anyPeerHasOKRs) && (
        <Card className="border-border/60">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium">
              Peer Teams in {currentDomain?.name}
            </CardTitle>
            <p className="helper-text">
              Read-only view of team confidence levels within your domain
            </p>
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
                        <h4 className="font-medium text-sm">{team.name}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">PM: {team.pmName}</p>
                      </div>
                      <div className="text-right">
                        {hasTeamOKRs ? (
                          <>
                            <ConfidenceBadge confidence={confidence} />
                            {atRisk > 0 && (
                              <p className="text-xs text-confidence-low mt-1">
                                {atRisk} at risk
                              </p>
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
