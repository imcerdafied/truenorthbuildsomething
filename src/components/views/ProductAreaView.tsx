import { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { ConfidenceBadge } from '@/components/shared/ConfidenceBadge';
import { TrendIndicator } from '@/components/shared/TrendIndicator';
import { TeamWeeklyView } from './TeamWeeklyView';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatQuarter, TrendDirection } from '@/types';
import { 
  Users, 
  Target,
  AlertTriangle,
  TrendingDown
} from 'lucide-react';

export function ProductAreaView() {
  const { 
    productAreas,
    domains,
    teams,
    currentQuarter,
    getTeamOKRs,
    getOverallConfidence,
    getAtRiskCount,
    checkIns,
    keyResults
  } = useApp();

  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  // Get the first product area (for demo purposes)
  const productArea = productAreas[0];

  // Get all teams in this product area
  const productAreaDomains = domains.filter(d => d.productAreaId === productArea?.id);
  const productAreaTeams = teams.filter(t => 
    productAreaDomains.some(d => d.id === t.domainId)
  );

  // Calculate team metrics with proper typing
  const teamsWithMetrics = useMemo(() => {
    return productAreaTeams.map(team => {
      const teamOKRs = getTeamOKRs(team.id);
      const okrIds = teamOKRs.map(o => o.id);
      const confidence = getOverallConfidence(okrIds);
      const atRiskCount = getAtRiskCount(okrIds);
      
      // Calculate KRs needing attention
      const teamKRs = keyResults.filter(kr => 
        teamOKRs.some(o => o.id === kr.okrId)
      );
      const krsNeedingAttention = teamKRs.filter(kr => 
        (kr as any).needsAttention
      ).length;

      // Calculate trend
      const teamCheckIns = checkIns
        .filter(ci => okrIds.includes(ci.okrId))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      let trend: TrendDirection = 'flat';
      if (teamCheckIns.length >= 2) {
        const dates = [...new Set(teamCheckIns.map(ci => ci.date))].sort((a, b) => 
          new Date(b).getTime() - new Date(a).getTime()
        );
        if (dates.length >= 2) {
          const latestAvg = teamCheckIns
            .filter(ci => ci.date === dates[0])
            .reduce((sum, ci, _, arr) => sum + ci.confidence / arr.length, 0);
          const previousAvg = teamCheckIns
            .filter(ci => ci.date === dates[1])
            .reduce((sum, ci, _, arr) => sum + ci.confidence / arr.length, 0);
          
          if (latestAvg > previousAvg) trend = 'up';
          else if (latestAvg < previousAvg) trend = 'down';
        }
      }

      // Check if confidence changed this week
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const recentCheckIns = teamCheckIns.filter(ci => 
        new Date(ci.date) >= oneWeekAgo
      );
      const confidenceChangedThisWeek = recentCheckIns.length > 0 && 
        teamCheckIns.length > recentCheckIns.length &&
        recentCheckIns[0]?.confidence !== teamCheckIns[recentCheckIns.length]?.confidence;

      return {
        ...team,
        okrCount: teamOKRs.length,
        confidence,
        atRiskCount,
        krsNeedingAttention,
        trend,
        confidenceChangedThisWeek,
        hasOKRs: teamOKRs.length > 0
      };
    });
  }, [productAreaTeams, getTeamOKRs, getOverallConfidence, getAtRiskCount, checkIns, keyResults]);

  const sortedTeams = useMemo(() => {
    return [...teamsWithMetrics].sort((a, b) => {
      // Priority 1: Has OKRs vs no OKRs
      if (a.hasOKRs !== b.hasOKRs) return b.hasOKRs ? 1 : -1;

      // Priority 2: Low confidence first (< 40)
      const aLow = a.confidence < 40 ? 1 : 0;
      const bLow = b.confidence < 40 ? 1 : 0;
      if (aLow !== bLow) return bLow - aLow;

      // Priority 3: Negative trend
      const aDown = a.trend === 'down' ? 1 : 0;
      const bDown = b.trend === 'down' ? 1 : 0;
      if (aDown !== bDown) return bDown - aDown;

      // Priority 4: KRs needing attention
      if (a.krsNeedingAttention !== b.krsNeedingAttention) return b.krsNeedingAttention - a.krsNeedingAttention;

      // Priority 5: Lower confidence first within same tier
      if (a.confidence !== b.confidence) return a.confidence - b.confidence;

      return 0;
    });
  }, [teamsWithMetrics]);

  const focusTeams = useMemo(() => {
    return sortedTeams
      .filter(t => t.hasOKRs && (t.confidence < 50 || t.trend === 'down' || t.krsNeedingAttention > 0))
      .sort((a, b) => a.confidence - b.confidence);
  }, [sortedTeams]);

  // Teams with changing confidence this week
  const teamsWithChangingConfidence = teamsWithMetrics.filter(t => 
    t.confidenceChangedThisWeek && t.trend !== 'flat'
  );

  // If a team is selected, show their weekly view
  if (selectedTeamId) {
    return (
      <TeamWeeklyView 
        teamId={selectedTeamId} 
        onBack={() => setSelectedTeamId(null)} 
      />
    );
  }

  if (!productArea) {
    return (
      <div className="empty-state">
        <Target className="empty-state-icon" />
        <p className="empty-state-title">No product area found</p>
        <p className="empty-state-description">
          Configure your organization structure in Settings.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="page-title text-xl sm:text-2xl">
          {productArea.name} — {formatQuarter(currentQuarter)}
        </h1>
        <p className="helper-text mt-1 text-sm">
          Where outcomes stand, and where intervention may help.
        </p>
      </div>

      {/* Focus this week */}
      {focusTeams.length > 0 && (
        <Card className="border-border/60 border-l-4 border-l-amber-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Focus this week
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Teams where confidence or blockers may need leadership attention.
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {focusTeams.slice(0, 5).map((team) => (
                <div
                  key={team.id}
                  className="flex items-center justify-between p-3 border border-border/60 rounded-lg cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setSelectedTeamId(team.id)}
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <span className="font-medium text-sm">{team.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">{team.pmName}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <ConfidenceBadge confidence={team.confidence} />
                    <TrendIndicator trend={team.trend} />
                    {team.krsNeedingAttention > 0 && (
                      <span className="text-xs text-amber-600 font-medium">
                        {team.krsNeedingAttention} need{team.krsNeedingAttention === 1 ? 's' : ''} help
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Teams Overview */}
      <Card className="border-border/60">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-medium">Teams Overview</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {sortedTeams.length === 0 ? (
            <div className="empty-state py-8">
              <Users className="empty-state-icon" />
              <p className="empty-state-title">No teams in this product area</p>
            </div>
          ) : (
            <div className="space-y-0">
              {/* Header */}
              <div className="grid grid-cols-12 gap-4 px-2 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide border-b">
                <div className="col-span-4">Team</div>
                <div className="col-span-2">Confidence</div>
                <div className="col-span-2">Trend</div>
                <div className="col-span-2">OKRs</div>
                <div className="col-span-2">Help needed</div>
              </div>

              {/* Rows */}
              {sortedTeams.map((team) => (
                <div
                  key={team.id}
                  className="grid grid-cols-12 gap-4 px-2 py-3.5 data-row cursor-pointer items-center"
                  onClick={() => setSelectedTeamId(team.id)}
                >
                  <div className="col-span-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{team.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 ml-6">
                      {team.pmName}
                    </p>
                  </div>
                  
                  <div className="col-span-2">
                    {team.hasOKRs ? (
                      <ConfidenceBadge confidence={team.confidence} />
                    ) : (
                      <span className="text-xs text-muted-foreground">No signal</span>
                    )}
                  </div>
                  
                  <div className="col-span-2">
                    {team.hasOKRs ? (
                      <TrendIndicator trend={team.trend} />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                  
                  <div className="col-span-2">
                    <span className="text-sm text-muted-foreground">
                      {team.okrCount}
                    </span>
                  </div>
                  
                  <div className="col-span-2">
                    {team.krsNeedingAttention > 0 ? (
                      <div className="flex items-center gap-1.5 text-confidence-medium">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span className="text-sm font-medium">
                          {team.krsNeedingAttention} item{team.krsNeedingAttention !== 1 ? 's' : ''}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Teams with changing confidence this week */}
      {teamsWithChangingConfidence.length > 0 && (
        <Card className="border-border/60">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-muted-foreground" />
              Teams with changing confidence this week
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {teamsWithChangingConfidence.map((team) => (
                <div
                  key={team.id}
                  className="flex items-center justify-between p-3 border border-border/60 rounded-lg cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setSelectedTeamId(team.id)}
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium text-sm">{team.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <ConfidenceBadge confidence={team.confidence} />
                    <TrendIndicator trend={team.trend} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
