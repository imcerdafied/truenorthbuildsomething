import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { ConfidenceBadge } from '@/components/shared/ConfidenceBadge';
import { TrendIndicator } from '@/components/shared/TrendIndicator';
import { OrphanWarning } from '@/components/shared/OrphanWarning';
import { TeamWeeklyView } from '@/components/views/TeamWeeklyView';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatQuarter, OKRLevel } from '@/types';
import { Target, Building2, Users, Layers, Plus, Calendar } from 'lucide-react';

type StatusFilter = 'all' | 'at-risk' | 'on-track';
type ViewTab = 'list' | 'weekly';

export function OKRsPage() {
  const navigate = useNavigate();
  const { 
    currentQuarter, 
    teams,
    getOKRsByQuarter,
    viewMode,
    selectedTeamId,
    getTeamOKRs
  } = useApp();

  // In exec view, users can create OKRs; in team view, only PMs can
  // For this prototype, we allow creation in both modes
  const canCreateOKR = true;

  const [viewTab, setViewTab] = useState<ViewTab>('list');
  const [ownerFilter, setOwnerFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showAllParents, setShowAllParents] = useState(false);

  // Get all OKRs for current quarter
  const allOKRs = useMemo(() => {
    return getOKRsByQuarter(currentQuarter);
  }, [currentQuarter, getOKRsByQuarter]);

  // Check if current team has OKRs for weekly view
  const teamOKRs = getTeamOKRs(selectedTeamId);
  const hasTeamOKRs = teamOKRs.length > 0;

  // Apply filters
  const filteredOKRs = useMemo(() => {
    return allOKRs.filter(okr => {
      if (ownerFilter !== 'all' && okr.ownerId !== ownerFilter) return false;
      if (statusFilter !== 'all') {
        const confidence = okr.latestCheckIn?.confidence || 0;
        if (statusFilter === 'at-risk' && confidence >= 40) return false;
        if (statusFilter === 'on-track' && confidence < 40) return false;
      }
      return true;
    });
  }, [allOKRs, ownerFilter, statusFilter]);

  // Exec mode: sort by check-in first, then lowest confidence, then down trend first
  const sortedOKRsForExec = useMemo(() => {
    if (viewMode !== 'exec') return filteredOKRs;
    return [...filteredOKRs].sort((a, b) => {
      const aHas = a.latestCheckIn ? 1 : 0;
      const bHas = b.latestCheckIn ? 1 : 0;
      if (aHas !== bHas) return bHas - aHas; // with check-in first
      const aConf = a.latestCheckIn?.confidence ?? 0;
      const bConf = b.latestCheckIn?.confidence ?? 0;
      if (aConf !== bConf) return aConf - bConf; // lowest first
      const aDown = a.trend === 'down' ? 1 : 0;
      const bDown = b.trend === 'down' ? 1 : 0;
      return bDown - aDown; // down first
    });
  }, [filteredOKRs, viewMode]);

  // Team mode: group into my team, parent objectives, other teams (other teams only if they have check-in)
  const groupedOKRs = useMemo(() => {
    const myTeam = filteredOKRs.filter(o => o.level === 'team' && o.ownerId === selectedTeamId);
    const parentObjectives = filteredOKRs.filter(o => o.level === 'productArea' || o.level === 'domain');
    const otherTeams = filteredOKRs.filter(o =>
      o.level === 'team' && o.ownerId !== selectedTeamId && o.latestCheckIn
    );
    return { myTeam, parentObjectives, otherTeams };
  }, [filteredOKRs, selectedTeamId]);

  const getLevelIcon = (level: OKRLevel) => {
    switch (level) {
      case 'productArea': return <Layers className="w-3.5 h-3.5" />;
      case 'domain': return <Building2 className="w-3.5 h-3.5" />;
      case 'team': return <Users className="w-3.5 h-3.5" />;
    }
  };

  const renderOKRRow = (okr: (typeof filteredOKRs)[number]) => (
    <div
      key={okr.id}
      className="grid grid-cols-12 gap-4 px-2 py-3.5 data-row cursor-pointer items-center"
      onClick={() => navigate(`/okrs/${okr.id}`)}
    >
      <div className="col-span-5">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{getLevelIcon(okr.level)}</span>
          <span className="decision-text truncate">{okr.objectiveText}</span>
          {okr.isOrphaned && <OrphanWarning />}
        </div>
      </div>
      <div className="col-span-2">
        <span className="text-xs text-muted-foreground">{okr.ownerName}</span>
      </div>
      <div className="col-span-2">
        <span className="text-xs text-muted-foreground">
          {okr.latestCheckIn ? `${okr.latestCheckIn.progress}% toward KRs` : 'No signal yet'}
        </span>
      </div>
      <div className="col-span-2">
        {okr.latestCheckIn ? (
          <ConfidenceBadge
            confidence={okr.latestCheckIn.confidence}
            label={okr.latestCheckIn.confidenceLabel}
          />
        ) : (
          <span className="text-xs text-muted-foreground">No signal yet</span>
        )}
      </div>
      <div className="col-span-1">
        {okr.latestCheckIn ? (
          <TrendIndicator trend={okr.trend} size="sm" />
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </div>
    </div>
  );

  // If viewing weekly tab in team mode, show TeamWeeklyView
  if (viewTab === 'weekly' && viewMode === 'team') {
    return <TeamWeeklyView onBack={() => setViewTab('list')} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Outcomes</h1>
          <p className="helper-text mt-1">
            {formatQuarter(currentQuarter)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Toggle - only in team mode */}
          {viewMode === 'team' && hasTeamOKRs && (
            <div className="flex items-center bg-muted rounded-md p-0.5">
              <Button
                variant={viewTab === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewTab('list')}
                className="gap-1.5 h-7 px-3 text-xs"
              >
                <Target className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Browse all</span>
              </Button>
              <Button
                variant={viewTab === 'weekly' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewTab('weekly')}
                className="gap-1.5 h-7 px-3 text-xs"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Team Weekly</span>
              </Button>
            </div>
          )}
          {canCreateOKR && (
            <Button onClick={() => navigate('/okrs/create')} className="gap-2">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Create outcome</span>
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="border-border/60">
        <CardContent className="py-4">
          <div className="flex flex-wrap items-end gap-4">
            {/* Owner Filter */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Owner</label>
              <Select value={ownerFilter} onValueChange={setOwnerFilter}>
                <SelectTrigger className="w-44 bg-background h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="all">All Owners</SelectItem>
                  {teams.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</label>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                <SelectTrigger className="w-32 bg-background h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="on-track">On Track (≥40)</SelectItem>
                  <SelectItem value="at-risk">At Risk (&lt;40)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Results count */}
            <div className="ml-auto">
              <span className="text-xs text-muted-foreground">
                {filteredOKRs.length} outcome{filteredOKRs.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Outcome list */}
      <Card className="border-border/60">
        <CardContent className="py-0">
          {filteredOKRs.length === 0 ? (
            <div className="empty-state">
              <Target className="empty-state-icon" />
              <p className="empty-state-title">
                {allOKRs.length === 0 ? "No outcomes for this quarter" : "No outcomes match your filters"}
              </p>
              <p className="empty-state-description max-w-md mx-auto">
                {allOKRs.length === 0 
                  ? "TrueNorthOS helps teams align on outcomes and make confidence explicit. Create your first outcome to establish your signal for the quarter."
                  : "Try adjusting your filters to see more results."
                }
              </p>
              {allOKRs.length === 0 && canCreateOKR && (
                <Button 
                  onClick={() => navigate('/okrs/create')} 
                  className="mt-6 gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create your first outcome
                </Button>
              )}
            </div>
          ) : (
            <div>
              {viewMode === 'team' ? (
                <>
                  {groupedOKRs.myTeam.length > 0 && (
                    <>
                      <div className="section-header px-2 py-2.5 border-b bg-muted/30">
                        Your team
                      </div>
                      {groupedOKRs.myTeam.map((okr) => renderOKRRow(okr))}
                    </>
                  )}
                  {groupedOKRs.parentObjectives.length > 0 && (() => {
                    const directParentIds = new Set(
                      groupedOKRs.myTeam
                        .filter(o => o.parentOkrId)
                        .map(o => o.parentOkrId!)
                    );
                    const directParents = groupedOKRs.parentObjectives.filter(o => directParentIds.has(o.id));
                    const otherParents = groupedOKRs.parentObjectives.filter(o => !directParentIds.has(o.id));
                    const visibleByDefault = directParents.length > 0 ? directParents : groupedOKRs.parentObjectives.slice(0, 2);
                    const moreParents = directParents.length > 0 ? otherParents : groupedOKRs.parentObjectives.slice(2);
                    return (
                      <>
                        <div className="section-header px-2 py-2.5 border-b border-t bg-muted/30">
                          Business outcomes this team contributes to
                        </div>
                        {visibleByDefault.map((okr) => renderOKRRow(okr))}
                        {showAllParents && moreParents.map((okr) => renderOKRRow(okr))}
                        {moreParents.length > 0 && (
                          <button
                            onClick={() => setShowAllParents(!showAllParents)}
                            className="w-full px-2 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors text-left"
                          >
                            {showAllParents
                              ? 'Show less'
                              : `+ ${moreParents.length} more top-level objective${moreParents.length !== 1 ? 's' : ''}`}
                          </button>
                        )}
                      </>
                    );
                  })()}
                  {groupedOKRs.otherTeams.length > 0 && (
                    <>
                      <div className="section-header px-2 py-2.5 border-b border-t bg-muted/30">
                        Related teams
                      </div>
                      {groupedOKRs.otherTeams.map((okr) => renderOKRRow(okr))}
                    </>
                  )}
                </>
              ) : (
                <>
                  <div className="grid grid-cols-12 gap-4 px-2 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide border-b">
                    <div className="col-span-5">Objective</div>
                    <div className="col-span-2">Owner</div>
                    <div className="col-span-2">Progress</div>
                    <div className="col-span-2">Confidence</div>
                    <div className="col-span-1">Trend</div>
                  </div>
                  {sortedOKRsForExec.map((okr) => renderOKRRow(okr))}
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
