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
  PlayCircle
} from 'lucide-react';
import { formatQuarter, getNextCheckInDate } from '@/types';

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
    isCurrentUserPM
  } = useApp();

  // Get the current team
  const currentTeam = teams.find(t => t.id === selectedTeamId);
  const currentDomain = domains.find(d => d.id === currentTeam?.domainId);
  
  // Get OKRs based on view mode
  const teamOKRs = getTeamOKRs(selectedTeamId);
  const allTeamOKRIds = teamOKRs.map(o => o.id);
  
  // Calculate overall stats
  const overallConfidence = getOverallConfidence(allTeamOKRIds);
  const atRiskCount = getAtRiskCount(allTeamOKRIds);
  const onTrackCount = getOnTrackCount(allTeamOKRIds);

  // Get peer teams in the same domain
  const peerTeams = teams.filter(t => t.domainId === currentTeam?.domainId && t.id !== selectedTeamId);

  // Calculate next check-in date
  const latestCheckIn = teamOKRs
    .flatMap(o => o.checkIns)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  
  const nextCheckInDate = latestCheckIn 
    ? getNextCheckInDate(new Date(latestCheckIn.date), currentTeam?.cadence || 'biweekly')
    : new Date();

  const canRunCheckIn = isCurrentUserPM(selectedTeamId);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">
            {viewMode === 'exec' ? 'Executive Dashboard' : `${currentTeam?.name || 'Team'}`}
          </h1>
          <p className="helper-text mt-1">
            {formatQuarter(currentQuarter)} · What are we trying to achieve and are we on track?
          </p>
        </div>
        
        {canRunCheckIn && (
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
            <div className="flex items-center gap-3">
              <span>{overallConfidence}</span>
              <ConfidenceBadge confidence={overallConfidence} showValue={false} />
            </div>
          }
          subtitle="Aggregate across all OKRs"
          icon={<Target className="w-5 h-5" />}
        />
        
        <SignalCard
          title="On Track"
          value={onTrackCount}
          subtitle={`of ${teamOKRs.length} OKRs with confidence ≥40`}
          icon={<CheckCircle2 className="w-5 h-5" />}
          variant="success"
        />
        
        <SignalCard
          title="At Risk"
          value={atRiskCount}
          subtitle="OKRs with confidence <40"
          icon={<AlertTriangle className="w-5 h-5" />}
          variant={atRiskCount > 0 ? 'danger' : 'default'}
        />
        
        <SignalCard
          title="Next Check-in"
          value={nextCheckInDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          subtitle={`${currentTeam?.cadence === 'weekly' ? 'Weekly' : 'Bi-weekly'} cadence`}
          icon={<Clock className="w-5 h-5" />}
        />
      </div>

      {/* Team OKRs */}
      <Card className="border-border/60">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-base font-medium">Your Team OKRs</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/okrs')} className="gap-1 text-xs h-8">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </CardHeader>
        <CardContent className="pt-0">
          {teamOKRs.length === 0 ? (
            <div className="empty-state">
              <Target className="empty-state-icon" />
              <p className="empty-state-title">No OKRs for this quarter</p>
              <p className="empty-state-description">
                OKRs help teams align on what matters most. Create your first OKR to get started.
              </p>
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

      {/* Peer Teams - informational, not competitive */}
      {peerTeams.length > 0 && (
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
                        <ConfidenceBadge confidence={confidence} />
                        {atRisk > 0 && (
                          <p className="text-xs text-confidence-low mt-1">
                            {atRisk} at risk
                          </p>
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
