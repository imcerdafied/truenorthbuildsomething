import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { ConfidenceBadge } from '@/components/shared/ConfidenceBadge';
import { TrendIndicator } from '@/components/shared/TrendIndicator';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { OrphanWarning } from '@/components/shared/OrphanWarning';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { formatQuarter, OKRLevel, OKRWithDetails } from '@/types';
import { Target, Building2, Users, Layers } from 'lucide-react';

type StatusFilter = 'all' | 'at-risk' | 'on-track';

export function OKRsPage() {
  const navigate = useNavigate();
  const { 
    currentQuarter, 
    teams, 
    domains, 
    productAreas,
    getOKRsByLevel,
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
      // Level filter
      if (levelFilter !== 'all' && okr.level !== levelFilter) return false;
      
      // Owner filter
      if (ownerFilter !== 'all' && okr.ownerId !== ownerFilter) return false;
      
      // Status filter
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
      case 'productArea': return <Layers className="w-4 h-4" />;
      case 'domain': return <Building2 className="w-4 h-4" />;
      case 'team': return <Users className="w-4 h-4" />;
    }
  };

  const getLevelLabel = (level: OKRLevel) => {
    switch (level) {
      case 'productArea': return 'Product Area';
      case 'domain': return 'Domain';
      case 'team': return 'Team';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">OKRs</h1>
        <p className="helper-text mt-1">
          View and manage OKRs across all levels · {formatQuarter(currentQuarter)}
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            {/* Level Filter */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Level</label>
              <Select value={levelFilter} onValueChange={(v) => setLevelFilter(v as OKRLevel | 'all')}>
                <SelectTrigger className="w-40 bg-background">
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
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Owner</label>
              <Select value={ownerFilter} onValueChange={setOwnerFilter}>
                <SelectTrigger className="w-48 bg-background">
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
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                <SelectTrigger className="w-36 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="on-track">On Track</SelectItem>
                  <SelectItem value="at-risk">At Risk</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Results count */}
            <div className="flex items-end ml-auto">
              <span className="text-sm text-muted-foreground">
                {filteredOKRs.length} OKR{filteredOKRs.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* OKR List */}
      <Card>
        <CardContent className="pt-6">
          {filteredOKRs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Target className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No OKRs match your filters</p>
            </div>
          ) : (
            <div className="space-y-1">
              {/* Header */}
              <div className="grid grid-cols-12 gap-4 px-4 py-2 text-sm font-medium text-muted-foreground border-b">
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
                  className="grid grid-cols-12 gap-4 px-4 py-4 data-row cursor-pointer items-center rounded-lg"
                  onClick={() => navigate(`/okrs/${okr.id}`)}
                >
                  <div className="col-span-5">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{getLevelIcon(okr.level)}</span>
                      <span className="font-medium truncate">{okr.objectiveText}</span>
                      {okr.isOrphaned && <OrphanWarning />}
                    </div>
                  </div>
                  
                  <div className="col-span-2">
                    <Badge variant="secondary" className="font-normal">
                      {okr.ownerName}
                    </Badge>
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
                      <span className="text-muted-foreground text-sm">No check-in</span>
                    )}
                  </div>
                  
                  <div className="col-span-1">
                    <TrendIndicator trend={okr.trend} />
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
