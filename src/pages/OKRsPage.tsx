import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { ConfidenceBadge } from '@/components/shared/ConfidenceBadge';
import { TrendIndicator } from '@/components/shared/TrendIndicator';
import { ProgressBar } from '@/components/shared/ProgressBar';
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
import { formatQuarter, OKRLevel } from '@/types';
import { Target, Building2, Users, Layers, Plus } from 'lucide-react';

type StatusFilter = 'all' | 'at-risk' | 'on-track';

export function OKRsPage() {
  const navigate = useNavigate();
  const { 
    currentQuarter, 
    teams, 
    domains, 
    productAreas,
    getOKRsByQuarter
  } = useApp();

  const [levelFilter, setLevelFilter] = useState<OKRLevel | 'all'>('all');
  const [ownerFilter, setOwnerFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Get all OKRs for current quarter
  const allOKRs = useMemo(() => {
    return getOKRsByQuarter(currentQuarter);
  }, [currentQuarter, getOKRsByQuarter]);

  // Apply filters
  const filteredOKRs = useMemo(() => {
    return allOKRs.filter(okr => {
      if (levelFilter !== 'all' && okr.level !== levelFilter) return false;
      if (ownerFilter !== 'all' && okr.ownerId !== ownerFilter) return false;
      if (statusFilter !== 'all') {
        const confidence = okr.latestCheckIn?.confidence || 0;
        if (statusFilter === 'at-risk' && confidence >= 40) return false;
        if (statusFilter === 'on-track' && confidence < 40) return false;
      }
      return true;
    });
  }, [allOKRs, levelFilter, ownerFilter, statusFilter]);

  const getLevelIcon = (level: OKRLevel) => {
    switch (level) {
      case 'productArea': return <Layers className="w-3.5 h-3.5" />;
      case 'domain': return <Building2 className="w-3.5 h-3.5" />;
      case 'team': return <Users className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">OKRs</h1>
          <p className="helper-text mt-1">
            View and manage OKRs across all levels · {formatQuarter(currentQuarter)}
          </p>
        </div>
        <Button onClick={() => navigate('/okrs/create')} className="gap-2">
          <Plus className="w-4 h-4" />
          Create OKR
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-border/60">
        <CardContent className="py-4">
          <div className="flex flex-wrap items-end gap-4">
            {/* Level Filter */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Level</label>
              <Select value={levelFilter} onValueChange={(v) => setLevelFilter(v as OKRLevel | 'all')}>
                <SelectTrigger className="w-36 bg-background h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="productArea">Product Area</SelectItem>
                  <SelectItem value="domain">Domain</SelectItem>
                  <SelectItem value="team">Team</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Owner Filter */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Owner</label>
              <Select value={ownerFilter} onValueChange={setOwnerFilter}>
                <SelectTrigger className="w-44 bg-background h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="all">All Owners</SelectItem>
                  {productAreas.map(pa => (
                    <SelectItem key={pa.id} value={pa.id}>{pa.name}</SelectItem>
                  ))}
                  {domains.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
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
                {filteredOKRs.length} OKR{filteredOKRs.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* OKR List */}
      <Card className="border-border/60">
        <CardContent className="py-0">
          {filteredOKRs.length === 0 ? (
            <div className="empty-state">
              <Target className="empty-state-icon" />
              <p className="empty-state-title">
                {allOKRs.length === 0 ? "No OKRs for this quarter" : "No OKRs match your filters"}
              </p>
              <p className="empty-state-description max-w-md mx-auto">
                {allOKRs.length === 0 
                  ? "TrueNorth helps teams align on outcomes and make confidence explicit. Create your first OKR to establish your signal for the quarter."
                  : "Try adjusting your filters to see more results."
                }
              </p>
            </div>
          ) : (
            <div>
              {/* Header */}
              <div className="grid grid-cols-12 gap-4 px-2 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide border-b">
                <div className="col-span-5">Objective</div>
                <div className="col-span-2">Owner</div>
                <div className="col-span-2">Progress</div>
                <div className="col-span-2">Confidence</div>
                <div className="col-span-1">Trend</div>
              </div>

              {/* Rows */}
              {filteredOKRs.map((okr) => (
                <div
                  key={okr.id}
                  className="grid grid-cols-12 gap-4 px-2 py-3.5 data-row cursor-pointer items-center"
                  onClick={() => navigate(`/okrs/${okr.id}`)}
                >
                  <div className="col-span-5">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{getLevelIcon(okr.level)}</span>
                      <span className="font-medium text-sm truncate">{okr.objectiveText}</span>
                      {okr.isOrphaned && <OrphanWarning />}
                    </div>
                  </div>
                  
                  <div className="col-span-2">
                    <span className="text-xs text-muted-foreground">{okr.ownerName}</span>
                  </div>
                  
                  <div className="col-span-2">
                    <ProgressBar 
                      value={okr.latestCheckIn?.progress || 0} 
                      showLabel 
                      size="sm" 
                    />
                  </div>
                  
                  <div className="col-span-2">
                    {okr.latestCheckIn ? (
                      <ConfidenceBadge 
                        confidence={okr.latestCheckIn.confidence}
                        label={okr.latestCheckIn.confidenceLabel}
                      />
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </div>
                  
                  <div className="col-span-1">
                    <TrendIndicator trend={okr.trend} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
