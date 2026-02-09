import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { ConfidenceBadge } from '@/components/shared/ConfidenceBadge';
import { TrendIndicator } from '@/components/shared/TrendIndicator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatQuarter, OKRWithDetails } from '@/types';
import { 
  PlayCircle, 
  Download, 
  ArrowLeft,
  AlertTriangle,
  Target
} from 'lucide-react';

interface TeamWeeklyViewProps {
  teamId?: string;
  onBack?: () => void;
}

export function TeamWeeklyView({ teamId, onBack }: TeamWeeklyViewProps) {
  const navigate = useNavigate();
  const { 
    teams,
    currentQuarter,
    selectedTeamId,
    getTeamOKRs,
    isCurrentUserPM,
    keyResults
  } = useApp();

  const effectiveTeamId = teamId || selectedTeamId;
  const team = teams.find(t => t.id === effectiveTeamId);
  const teamOKRs = getTeamOKRs(effectiveTeamId);
  const canRunCheckIn = isCurrentUserPM(effectiveTeamId);

  // Sort OKRs by attention priority: declining confidence, low confidence, flagged KRs
  const sortedOKRs = useMemo(() => {
    return [...teamOKRs].sort((a, b) => {
      // Priority 1: Declining confidence (down trend)
      const aDecline = a.trend === 'down' ? 1 : 0;
      const bDecline = b.trend === 'down' ? 1 : 0;
      if (aDecline !== bDecline) return bDecline - aDecline;

      // Priority 2: Low confidence
      const aConf = a.latestCheckIn?.confidence || 50;
      const bConf = b.latestCheckIn?.confidence || 50;
      if (aConf !== bConf) return aConf - bConf;

      // Priority 3: Has KRs needing attention
      const aFlagged = getKRsNeedingAttention(a, keyResults).length;
      const bFlagged = getKRsNeedingAttention(b, keyResults).length;
      return bFlagged - aFlagged;
    });
  }, [teamOKRs, keyResults]);

  const handleExport = () => {
    navigate('/exports', { state: { view: 'team-weekly', teamId: effectiveTeamId } });
  };

  if (!team) {
    return (
      <div className="empty-state">
        <Target className="empty-state-icon" />
        <p className="empty-state-title">Team not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          {onBack && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBack} 
              className="gap-2 -ml-2 mb-2 text-muted-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          )}
          <h1 className="page-title text-xl sm:text-2xl">
            {team.name} — {formatQuarter(currentQuarter)}
          </h1>
          <p className="helper-text mt-1 text-sm">
            {onBack
              ? 'Review confidence changes and blockers before reaching out.'
              : `${team.cadence === 'weekly' ? 'Weekly' : 'Bi-weekly'} view of outcomes and confidence`
            }
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {canRunCheckIn && teamOKRs.length > 0 && (
            <Button onClick={() => navigate('/checkin')} size="sm" className="gap-2">
              <PlayCircle className="w-4 h-4" />
              Check-in
            </Button>
          )}
          {teamOKRs.length > 0 && (
            <Button variant="outline" onClick={handleExport} size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          )}
        </div>
      </div>

      {/* OKRs List */}
      {sortedOKRs.length === 0 ? (
        <Card className="border-border/60">
          <CardContent className="py-12">
            <div className="empty-state">
              <Target className="empty-state-icon" />
              <p className="empty-state-title">No OKRs for this quarter</p>
              <p className="empty-state-description">
                Create OKRs to start tracking outcomes and confidence.
              </p>
              <Button 
                onClick={() => navigate('/okrs/create')} 
                className="mt-4"
              >
                Create OKR
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedOKRs.map((okr) => (
            <OKRWeeklyCard 
              key={okr.id} 
              okr={okr} 
              allKeyResults={keyResults}
              onClick={() => navigate(`/okrs/${okr.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface OKRWeeklyCardProps {
  okr: OKRWithDetails;
  allKeyResults: { id: string; okrId: string; text: string; needsAttention?: boolean; attentionReason?: string }[];
  onClick: () => void;
}

function OKRWeeklyCard({ okr, allKeyResults, onClick }: OKRWeeklyCardProps) {
  const confidence = okr.latestCheckIn?.confidence || 0;
  const trend = okr.trend;
  const reasonForChange = okr.latestCheckIn?.reasonForChange;
  const hasReasonForChange = reasonForChange && reasonForChange.trim().length > 0;
  
  const okrKeyResults = allKeyResults.filter(kr => kr.okrId === okr.id);
  const flaggedKRs = okrKeyResults.filter(kr => kr.needsAttention);
  const hasFlaggedKRs = flaggedKRs.length > 0;

  return (
    <Card 
      className="border-border/60 hover:border-border/80 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="text-base font-medium leading-snug">
            {okr.objectiveText}
          </CardTitle>
          <div className="flex items-center gap-3 shrink-0">
            <ConfidenceBadge confidence={confidence} />
            <TrendIndicator trend={trend} />
          </div>
        </div>
        
        {/* Reason for change - only if confidence changed last check-in */}
        {hasReasonForChange && (
          <p className="text-sm text-muted-foreground mt-2 pl-0 border-l-2 border-confidence-medium/40 ml-0 italic">
            <span className="pl-3 block">{reasonForChange}</span>
          </p>
        )}
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Key Results */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Key Results
          </p>
          <div className="space-y-1.5">
            {okrKeyResults.map((kr) => (
              <div 
                key={kr.id} 
                className={`flex items-start gap-2 text-sm ${
                  kr.needsAttention ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {kr.needsAttention && (
                  <AlertTriangle className="w-3.5 h-3.5 text-confidence-medium shrink-0 mt-0.5" />
                )}
                <span className={kr.needsAttention ? 'font-medium' : ''}>
                  {kr.text}
                </span>
              </div>
            ))}
          </div>
          
          {hasFlaggedKRs && (
            <div className="mt-3 pt-3 border-t border-border/60">
              {flaggedKRs.map((kr) => (
                kr.attentionReason && (
                  <div key={kr.id} className="flex items-start gap-2 text-sm">
                    <AlertTriangle className="w-3.5 h-3.5 text-confidence-medium shrink-0 mt-0.5" />
                    <span className="text-muted-foreground italic">
                      {kr.attentionReason}
                    </span>
                  </div>
                )
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Helper to get KRs needing attention for an OKR
function getKRsNeedingAttention(
  okr: OKRWithDetails, 
  allKeyResults: { id: string; okrId: string; needsAttention?: boolean }[]
) {
  return allKeyResults.filter(kr => kr.okrId === okr.id && kr.needsAttention);
}
