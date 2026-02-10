import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { OrphanWarning } from '@/components/shared/OrphanWarning';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { formatQuarter } from '@/types';
import { Target, Plus, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronRight } from 'lucide-react';
import type { OKRWithDetails } from '@/types';

type StatusFilter = 'all' | 'at-risk' | 'on-track';

const CONF_HIGH = 70;
const CONF_MEDIUM = 40;

function confidenceTier(confidence: number): 'low' | 'medium' | 'high' {
  if (confidence >= CONF_HIGH) return 'high';
  if (confidence >= CONF_MEDIUM) return 'medium';
  return 'low';
}

export function OKRsPage() {
  const navigate = useNavigate();
  const {
    currentQuarter,
    teams,
    getOKRsByQuarter,
    viewMode,
    selectedTeamId,
  } = useApp();

  const canCreateOKR = true;

  const [ownerFilter, setOwnerFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showAllParents, setShowAllParents] = useState(false);
  const [openLow, setOpenLow] = useState(true);
  const [openMedium, setOpenMedium] = useState(true);
  const [openHigh, setOpenHigh] = useState(true);
  const [openRelatedLow, setOpenRelatedLow] = useState(true);
  const [openRelatedMedium, setOpenRelatedMedium] = useState(true);
  const [openRelatedHigh, setOpenRelatedHigh] = useState(true);

  const allOKRs = useMemo(() => getOKRsByQuarter(currentQuarter), [currentQuarter, getOKRsByQuarter]);

  const filteredOKRs = useMemo(() => {
    return allOKRs.filter(okr => {
      if (ownerFilter !== 'all' && okr.ownerId !== ownerFilter) return false;
      if (statusFilter !== 'all') {
        const confidence = okr.latestCheckIn?.confidence ?? 0;
        if (statusFilter === 'at-risk' && confidence >= CONF_MEDIUM) return false;
        if (statusFilter === 'on-track' && confidence < CONF_MEDIUM) return false;
      }
      return true;
    });
  }, [allOKRs, ownerFilter, statusFilter]);

  // Team view: my team vs other teams
  const { myTeam, parentObjectives, otherTeams } = useMemo(() => {
    const myTeam = filteredOKRs.filter(o => o.level === 'team' && o.ownerId === selectedTeamId);
    const parentObjectives = filteredOKRs.filter(o => o.level === 'productArea' || o.level === 'domain');
    const otherTeams = filteredOKRs.filter(o =>
      o.level === 'team' && o.ownerId !== selectedTeamId && o.latestCheckIn
    );
    return { myTeam, parentObjectives, otherTeams };
  }, [filteredOKRs, selectedTeamId]);

  // Quarter health stats: tier counts, average confidence, trend vs previous check-in
  const { highCount, mediumCount, lowCount, avgConfidence, trendDelta } = useMemo(() => {
    const withConfidence = filteredOKRs.filter(o => o.latestCheckIn != null);
    let high = 0, medium = 0, low = 0, sum = 0;
    withConfidence.forEach(o => {
      const c = o.latestCheckIn!.confidence;
      sum += c;
      if (c >= CONF_HIGH) high++;
      else if (c >= CONF_MEDIUM) medium++;
      else low++;
    });
    const avg = withConfidence.length ? Math.round(sum / withConfidence.length) : 0;
    let delta: number | null = null;
    const withPrevious = filteredOKRs.filter(o => o.checkIns.length >= 2);
    if (withPrevious.length > 0) {
      const sorted = withPrevious.map(o => ({
        latest: o.latestCheckIn!.confidence,
        prev: [...o.checkIns].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[1].confidence,
      }));
      const currentAvg = sorted.reduce((s, x) => s + x.latest, 0) / sorted.length;
      const previousAvg = sorted.reduce((s, x) => s + x.prev, 0) / sorted.length;
      delta = Math.round(currentAvg - previousAvg);
    }
    return { highCount: high, mediumCount: medium, lowCount: low, avgConfidence: avg, trendDelta: delta };
  }, [filteredOKRs]);

  // Group by health: main list = my team (team view) or all (exec)
  const byHealth = useMemo(() => {
    const list = viewMode === 'team' ? myTeam : filteredOKRs;
    const low: OKRWithDetails[] = [];
    const medium: OKRWithDetails[] = [];
    const high: OKRWithDetails[] = [];
    list.forEach(okr => {
      const c = okr.latestCheckIn?.confidence ?? 0;
      const tier = confidenceTier(c);
      if (tier === 'low') low.push(okr);
      else if (tier === 'medium') medium.push(okr);
      else high.push(okr);
    });
    return { low, medium, high };
  }, [filteredOKRs, viewMode, myTeam]);

  const directParentIds = useMemo(() => new Set(
    myTeam.filter(o => o.parentOkrId).map(o => o.parentOkrId!)
  ), [myTeam]);
  const directParents = parentObjectives.filter(o => directParentIds.has(o.id));
  const otherParents = parentObjectives.filter(o => !directParentIds.has(o.id));
  const visibleParents = directParents.length > 0 ? directParents : parentObjectives.slice(0, 2);
  const moreParents = directParents.length > 0 ? otherParents : parentObjectives.slice(2);

  const renderOKRRow = (okr: OKRWithDetails) => {
    const conf = okr.latestCheckIn?.confidence ?? 0;
    const tier = confidenceTier(conf);
    const tierColor = tier === 'high' ? 'emerald' : tier === 'medium' ? 'amber' : 'red';
    const borderColor = tier === 'high' ? 'border-emerald-400' : tier === 'medium' ? 'border-amber-400' : 'border-red-400';
    const trendColor = okr.trend === 'up' ? 'text-emerald-600' : okr.trend === 'down' ? 'text-red-500' : 'text-muted-foreground';
    const TrendIcon = okr.trend === 'up' ? TrendingUp : okr.trend === 'down' ? TrendingDown : Minus;
    const progress = okr.latestCheckIn?.progress ?? 0;
    return (
      <div
        key={okr.id}
        className={`flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-3 rounded-md hover:bg-muted/30 transition-colors cursor-pointer border-l-[3px] ${borderColor}`}
        onClick={() => navigate(`/okrs/${okr.id}`)}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-medium text-foreground truncate">{okr.objectiveText}</span>
            {okr.isOrphaned && <OrphanWarning />}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-muted-foreground">{okr.ownerName}</span>
            <div className="flex items-center gap-2">
              <div className="w-16 h-1.5 rounded-full bg-muted/30 overflow-hidden">
                <div className="h-full rounded-full bg-foreground/60" style={{ width: `${Math.min(100, progress)}%` }} />
              </div>
              <span className="text-xs text-muted-foreground tabular-nums">{progress}%</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {okr.latestCheckIn ? (
            <>
              <span className={`text-sm font-bold tabular-nums ${tierColor === 'emerald' ? 'text-emerald-600' : tierColor === 'amber' ? 'text-amber-500' : 'text-red-500'}`}>
                {conf}
              </span>
              <TrendIcon className={`w-4 h-4 ${trendColor}`} />
            </>
          ) : (
            <span className="text-xs text-muted-foreground">No signal yet</span>
          )}
        </div>
      </div>
    );
  };

  const renderHealthSection = (
    title: string,
    count: number,
    open: boolean,
    onOpenChange: (v: boolean) => void,
    okrs: OKRWithDetails[],
    dotColor: 'red' | 'amber' | 'emerald'
  ) => {
    const bgTint = dotColor === 'red' ? 'bg-red-50/30' : '';
    const dotClass = dotColor === 'red' ? 'bg-red-500' : dotColor === 'amber' ? 'bg-amber-500' : 'bg-emerald-500';
    return (
      <Collapsible open={open} onOpenChange={onOpenChange} className={`mb-8 rounded-lg ${bgTint}`}>
        <CollapsibleTrigger className="flex items-center gap-2 w-full py-2 px-1 text-left rounded">
          {open ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
          <span className={`w-2 h-2 rounded-full shrink-0 ${dotClass}`} />
          <span className="text-sm font-semibold">{title} ({count})</span>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-0 pt-1">
            {okrs.map((okr) => renderOKRRow(okr))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Quarter Health header */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-xl font-semibold text-foreground">{formatQuarter(currentQuarter)} — Outcomes Overview</h1>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="rounded-lg px-4 py-2 text-sm font-medium bg-red-50 text-red-700 border border-red-200">
              {lowCount} Low
            </span>
            <span className="rounded-lg px-4 py-2 text-sm font-medium bg-amber-50 text-amber-700 border border-amber-200">
              {mediumCount} Medium
            </span>
            <span className="rounded-lg px-4 py-2 text-sm font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              {highCount} High
            </span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Average confidence: {avgConfidence}
          {trendDelta !== null && (
            <> · Trending: {trendDelta > 0 ? '↑' : trendDelta < 0 ? '↓' : '→'} {trendDelta > 0 ? '+' : ''}{trendDelta} from last check-in</>
          )}
        </p>
      </div>

      {/* Top controls: filters + Create outcome */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Owner</label>
            <Select value={ownerFilter} onValueChange={setOwnerFilter}>
              <SelectTrigger className="w-40 bg-background h-8 text-xs border border-border/60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="all">All Owners</SelectItem>
                {teams.filter(t => t.id).map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</label>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="w-28 bg-background h-8 text-xs border border-border/60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="on-track">On Track (≥40)</SelectItem>
                <SelectItem value="at-risk">At Risk (&lt;40)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {canCreateOKR && (
          <Button onClick={() => navigate('/okrs/create')} className="gap-2">
            <Plus className="w-4 h-4" />
            Create outcome
          </Button>
        )}
      </div>

      {/* Contributes to — team view only */}
      {viewMode === 'team' && (visibleParents.length > 0 || moreParents.length > 0) && (
        <div className="bg-muted/20 rounded-lg p-4 mb-4">
          <h2 className="text-xs uppercase tracking-wide font-medium text-muted-foreground mb-3">Contributes to</h2>
          <div className="space-y-2">
            {[...visibleParents, ...(showAllParents ? moreParents : [])].map((okr) => (
              <div key={okr.id} className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-sm font-medium text-foreground">{okr.objectiveText}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-muted rounded px-2 py-0.5 text-muted-foreground">Top-level</span>
                  {okr.latestCheckIn ? (
                    <span className={`text-xs font-medium tabular-nums ${confidenceTier(okr.latestCheckIn.confidence) === 'high' ? 'text-emerald-600' : confidenceTier(okr.latestCheckIn.confidence) === 'medium' ? 'text-amber-500' : 'text-red-500'}`}>
                      {okr.latestCheckIn.confidence}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">No signal</span>
                  )}
                </div>
              </div>
            ))}
            {moreParents.length > 0 && (
              <button
                type="button"
                onClick={() => setShowAllParents(!showAllParents)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {showAllParents ? 'Show less' : `Show ${moreParents.length} more`}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Outcome list — grouped by health */}
      {filteredOKRs.length === 0 ? (
        <div className="empty-state py-16">
          <Target className="empty-state-icon" />
          <p className="text-lg font-semibold text-foreground">
            {allOKRs.length === 0 ? 'No outcomes for this quarter' : 'No outcomes match your filters'}
          </p>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mt-2">
            {allOKRs.length === 0
              ? 'TrueNorthOS helps teams align on outcomes and make confidence explicit. Create your first outcome to establish your signal for the quarter.'
              : 'Try adjusting your filters to see more results.'}
          </p>
          {allOKRs.length === 0 && canCreateOKR && (
            <Button onClick={() => navigate('/okrs/create')} className="mt-6 gap-2">
              <Plus className="w-4 h-4" />
              Create your first outcome
            </Button>
          )}
        </div>
      ) : (
        <div>
          {renderHealthSection('Needs Attention', byHealth.low.length, openLow, setOpenLow, byHealth.low, 'red')}
          {renderHealthSection('On Track', byHealth.medium.length, openMedium, setOpenMedium, byHealth.medium, 'amber')}
          {renderHealthSection('Strong Momentum', byHealth.high.length, openHigh, setOpenHigh, byHealth.high, 'emerald')}
        </div>
      )}

      {/* Related teams — team view: other teams grouped by health */}
      {viewMode === 'team' && otherTeams.length > 0 && (() => {
        const otherLow = otherTeams.filter(o => confidenceTier(o.latestCheckIn?.confidence ?? 0) === 'low');
        const otherMedium = otherTeams.filter(o => confidenceTier(o.latestCheckIn?.confidence ?? 0) === 'medium');
        const otherHigh = otherTeams.filter(o => confidenceTier(o.latestCheckIn?.confidence ?? 0) === 'high');
        return (
          <div className="mt-8 pt-6 border-t border-muted/50">
            <h2 className="text-xs uppercase tracking-wide font-medium text-muted-foreground mb-4">Related teams</h2>
            <div>
              {otherLow.length > 0 && renderHealthSection('Needs Attention', otherLow.length, openRelatedLow, setOpenRelatedLow, otherLow, 'red')}
              {otherMedium.length > 0 && renderHealthSection('On Track', otherMedium.length, openRelatedMedium, setOpenRelatedMedium, otherMedium, 'amber')}
              {otherHigh.length > 0 && renderHealthSection('Strong Momentum', otherHigh.length, openRelatedHigh, setOpenRelatedHigh, otherHigh, 'emerald')}
            </div>
          </div>
        );
      })()}
      {viewMode === 'exec' && (
        <div className="mt-8 pt-6 border-t border-muted/50">
          <h2 className="text-xs uppercase tracking-wide font-medium text-muted-foreground mb-4">Across the organization</h2>
          <p className="text-sm text-muted-foreground">All outcomes above are org-wide. Use filters to narrow by owner.</p>
        </div>
      )}
    </div>
  );
}
