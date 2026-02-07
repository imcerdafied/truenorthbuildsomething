import { useApp } from '@/context/AppContext';
import { ConfidenceBadge } from '@/components/shared/ConfidenceBadge';
import { OrphanWarning } from '@/components/shared/OrphanWarning';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatQuarter, OKRWithDetails } from '@/types';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronRight, 
  ChevronDown, 
  Layers, 
  Building2, 
  Users,
  Target
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface TreeNodeProps {
  okr: OKRWithDetails;
  level: number;
  defaultExpanded?: boolean;
}

function TreeNode({ okr, level, defaultExpanded = true }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const navigate = useNavigate();
  const hasChildren = okr.childOKRs.length > 0;

  const getLevelIcon = () => {
    switch (okr.level) {
      case 'productArea': return <Layers className="w-3.5 h-3.5" />;
      case 'domain': return <Building2 className="w-3.5 h-3.5" />;
      case 'team': return <Users className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="animate-fade-in">
      <div 
        className={cn(
          "flex items-center gap-2 py-2.5 px-2 rounded-md hover:bg-muted/40 transition-colors cursor-pointer group",
          level > 0 && "ml-5 border-l border-border/40 pl-4"
        )}
        style={{ marginLeft: level > 0 ? `${level * 20}px` : 0 }}
      >
        {/* Expand/collapse toggle */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className={cn(
            "p-0.5 rounded hover:bg-muted transition-colors",
            !hasChildren && "invisible"
          )}
        >
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          )}
        </button>

        {/* Level icon */}
        <span className="text-muted-foreground">{getLevelIcon()}</span>

        {/* Objective */}
        <div 
          className="flex-1 min-w-0"
          onClick={() => navigate(`/okrs/${okr.id}`)}
        >
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate group-hover:text-primary transition-colors">
              {okr.objectiveText}
            </span>
            {okr.isOrphaned && <OrphanWarning />}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{okr.ownerName}</p>
        </div>

        {/* Confidence */}
        {okr.latestCheckIn && (
          <ConfidenceBadge 
            confidence={okr.latestCheckIn.confidence}
            label={okr.latestCheckIn.confidenceLabel}
            size="sm"
          />
        )}
      </div>

      {/* Children */}
      {expanded && hasChildren && (
        <div className="mt-0.5">
          {okr.childOKRs.map(child => (
            <TreeNode 
              key={child.id} 
              okr={child} 
              level={level + 1}
              defaultExpanded={level < 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function AlignmentPage() {
  const { 
    currentQuarter,
    getOKRsByLevel,
    getOKRsByQuarter
  } = useApp();

  const productAreaOKRs = getOKRsByLevel('productArea');
  const domainOKRs = getOKRsByLevel('domain');
  const teamOKRs = getOKRsByLevel('team');

  const allOKRs = getOKRsByQuarter(currentQuarter);
  const orphanedOKRs = allOKRs.filter(o => o.isOrphaned);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="page-title">Alignment</h1>
        <p className="helper-text mt-1">
          View how OKRs cascade from Product Area to Domain to Team · {formatQuarter(currentQuarter)}
        </p>
      </div>

      {/* Summary */}
      <div className="flex gap-3 flex-wrap">
        <Badge variant="secondary" className="gap-1.5 text-xs font-normal">
          <Layers className="w-3 h-3" />
          {productAreaOKRs.length} Product Area
        </Badge>
        <Badge variant="secondary" className="gap-1.5 text-xs font-normal">
          <Building2 className="w-3 h-3" />
          {domainOKRs.length} Domain
        </Badge>
        <Badge variant="secondary" className="gap-1.5 text-xs font-normal">
          <Users className="w-3 h-3" />
          {teamOKRs.length} Team
        </Badge>
        {orphanedOKRs.length > 0 && (
          <Badge variant="confidenceMedium" className="gap-1.5 text-xs font-normal">
            {orphanedOKRs.length} not linked
          </Badge>
        )}
      </div>

      {/* Tree View */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">OKR Hierarchy</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {productAreaOKRs.length === 0 && domainOKRs.length === 0 && teamOKRs.length === 0 ? (
            <div className="empty-state">
              <Target className="empty-state-icon" />
              <p className="empty-state-title">No OKRs for this quarter</p>
              <p className="empty-state-description">
                Create OKRs at different levels to see how they align.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {productAreaOKRs.map(okr => (
                <TreeNode key={okr.id} okr={okr} level={0} />
              ))}

              {orphanedOKRs.length > 0 && (
                <div className="mt-6 pt-5 border-t">
                  <div className="flex items-center gap-2 mb-3">
                    <OrphanWarning />
                    <span className="text-xs text-muted-foreground">
                      OKRs not linked to parent outcomes
                    </span>
                  </div>
                  {orphanedOKRs.map(okr => (
                    <TreeNode key={okr.id} okr={okr} level={0} />
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
