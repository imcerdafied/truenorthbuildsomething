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
      case 'productArea': return <Layers className="w-4 h-4" />;
      case 'domain': return <Building2 className="w-4 h-4" />;
      case 'team': return <Users className="w-4 h-4" />;
    }
  };

  return (
    <div className="animate-fade-in">
      <div 
        className={cn(
          "flex items-center gap-2 py-3 px-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group",
          level > 0 && "ml-6 border-l-2 border-muted"
        )}
        style={{ marginLeft: level > 0 ? `${level * 24}px` : 0 }}
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
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
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
            <span className="font-medium truncate group-hover:text-primary transition-colors">
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
          />
        )}
      </div>

      {/* Children */}
      {expanded && hasChildren && (
        <div className="mt-1">
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
    productAreas,
    domains,
    teams,
    getOKRsByLevel,
    getOKRsByQuarter
  } = useApp();

  // Build the hierarchy
  const productAreaOKRs = getOKRsByLevel('productArea');
  const domainOKRs = getOKRsByLevel('domain');
  const teamOKRs = getOKRsByLevel('team');

  // Get orphaned OKRs (those without parents)
  const allOKRs = getOKRsByQuarter(currentQuarter);
  const orphanedOKRs = allOKRs.filter(o => o.isOrphaned);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Alignment</h1>
        <p className="helper-text mt-1">
          View how OKRs cascade from Product Area to Domain to Team · {formatQuarter(currentQuarter)}
        </p>
      </div>

      {/* Summary */}
      <div className="flex gap-4">
        <Badge variant="secondary" className="gap-2">
          <Layers className="w-3 h-3" />
          {productAreaOKRs.length} Product Area
        </Badge>
        <Badge variant="secondary" className="gap-2">
          <Building2 className="w-3 h-3" />
          {domainOKRs.length} Domain
        </Badge>
        <Badge variant="secondary" className="gap-2">
          <Users className="w-3 h-3" />
          {teamOKRs.length} Team
        </Badge>
        {orphanedOKRs.length > 0 && (
          <Badge variant="confidenceMedium" className="gap-2">
            {orphanedOKRs.length} not linked
          </Badge>
        )}
      </div>

      {/* Tree View */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">OKR Hierarchy</CardTitle>
        </CardHeader>
        <CardContent>
          {productAreaOKRs.length === 0 && domainOKRs.length === 0 && teamOKRs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Target className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No OKRs found for this quarter</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Product Area OKRs at the top */}
              {productAreaOKRs.map(okr => (
                <TreeNode key={okr.id} okr={okr} level={0} />
              ))}

              {/* Orphaned OKRs section */}
              {orphanedOKRs.length > 0 && (
                <div className="mt-8 pt-6 border-t">
                  <h3 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
                    <OrphanWarning />
                    <span>OKRs not linked to parent outcomes</span>
                  </h3>
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
