import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { ConfidenceBadge } from '@/components/shared/ConfidenceBadge';
import { TrendIndicator } from '@/components/shared/TrendIndicator';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { OrphanWarning } from '@/components/shared/OrphanWarning';
import { ConfidenceSparkline } from '@/components/shared/ConfidenceSparkline';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatQuarter, OKRLevel } from '@/types';
import { 
  ArrowLeft, 
  Target, 
  Building2, 
  Users, 
  Layers,
  Plus,
  Link2,
  ExternalLink,
  RefreshCcw,
  Calendar,
  X,
  GitBranch
} from 'lucide-react';
import { useState } from 'react';

export function OKRDetailPage() {
  const { okrId } = useParams<{ okrId: string }>();
  const navigate = useNavigate();
  const { 
    getOKRWithDetails, 
    canEditOKR, 
    addJiraLink, 
    removeJiraLink,
    rolloverOKR,
    addOKRLink,
    getOKRsByQuarter,
    currentQuarter
  } = useApp();

  const [jiraInput, setJiraInput] = useState('');
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<string>('');

  const okr = okrId ? getOKRWithDetails(okrId) : null;

  if (!okr) {
    return (
      <div className="empty-state">
        <Target className="empty-state-icon" />
        <p className="empty-state-title">OKR not found</p>
        <Button variant="ghost" onClick={() => navigate('/okrs')} className="mt-4">
          Back to OKRs
        </Button>
      </div>
    );
  }

  const canEdit = canEditOKR(okr.id);

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

  const handleAddJiraLink = () => {
    if (jiraInput.trim()) {
      addJiraLink(okr.id, jiraInput.trim());
      setJiraInput('');
    }
  };

  const handleRollover = () => {
    rolloverOKR(okr.id);
  };

  const handleLinkToParent = () => {
    if (selectedParentId) {
      addOKRLink(selectedParentId, okr.id);
      setIsLinkDialogOpen(false);
      setSelectedParentId('');
    }
  };

  const potentialParents = getOKRsByQuarter(currentQuarter).filter(o => {
    if (okr.level === 'team') return o.level === 'domain' || o.level === 'productArea';
    if (okr.level === 'domain') return o.level === 'productArea';
    return false;
  });

  const parentOkr = okr.parentOkrId ? getOKRWithDetails(okr.parentOkrId) : null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={() => navigate('/okrs')} className="gap-2 -ml-2 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" />
        Back to OKRs
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between gap-6">
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-muted-foreground">{getLevelIcon(okr.level)}</span>
            <Badge variant="secondary" className="text-xs">{getLevelLabel(okr.level)}</Badge>
            <Badge variant="outline" className="text-xs">{formatQuarter(okr.quarter)}</Badge>
            {okr.isRolledOver && (
              <Badge variant="secondary" className="gap-1 text-xs">
                <RefreshCcw className="w-3 h-3" />
                Rolled over
              </Badge>
            )}
          </div>
          <h1 className="text-xl font-semibold tracking-tight leading-tight">{okr.objectiveText}</h1>
          <p className="text-sm text-muted-foreground">Owner: {okr.ownerName}</p>
          {okr.isOrphaned && (
            <div className="flex items-center gap-2 pt-1">
              <OrphanWarning />
              <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1 h-7 text-xs">
                    <Link2 className="w-3 h-3" />
                    Link to parent
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card">
                  <DialogHeader>
                    <DialogTitle>Link to Parent OKR</DialogTitle>
                  </DialogHeader>
                  <div className="py-4">
                    <Select value={selectedParentId} onValueChange={setSelectedParentId}>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Select a parent OKR" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        {potentialParents.map(p => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.objectiveText}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsLinkDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleLinkToParent} disabled={!selectedParentId}>Link</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>

        {canEdit && (
          <div className="flex gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" onClick={() => navigate(`/checkin?okrId=${okr.id}`)} className="gap-2">
              <Plus className="w-3.5 h-3.5" />
              Add Check-in
            </Button>
            <Button variant="outline" size="sm" onClick={handleRollover} className="gap-2">
              <RefreshCcw className="w-3.5 h-3.5" />
              Roll over
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Card */}
          <Card className="border-border/60">
            <CardContent className="py-5">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="section-header mb-3">Progress</p>
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-semibold tabular-nums">
                      {okr.latestCheckIn?.progress || 0}%
                    </span>
                    <ProgressBar 
                      value={okr.latestCheckIn?.progress || 0} 
                      className="flex-1" 
                    />
                  </div>
                </div>
                <div>
                  <p className="section-header mb-3">Confidence</p>
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-semibold tabular-nums">
                      {okr.latestCheckIn?.confidence || 0}
                    </span>
                    {okr.latestCheckIn && (
                      <ConfidenceBadge 
                        confidence={okr.latestCheckIn.confidence}
                        label={okr.latestCheckIn.confidenceLabel}
                        showValue={false}
                      />
                    )}
                    <TrendIndicator trend={okr.trend} />
                  </div>
                </div>
              </div>
              
              {/* Inline sparkline */}
              {okr.checkIns.length > 1 && (
                <div className="mt-6 pt-5 border-t">
                  <p className="section-header mb-3">Confidence Trend</p>
                  <div className="h-16">
                    <ConfidenceSparkline checkIns={okr.checkIns} className="h-full w-full" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Key Results */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Key Results</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {okr.keyResults.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4">No key results defined</p>
              ) : (
                <div className="space-y-3">
                  {okr.keyResults.map((kr, index) => {
                    const progress = kr.targetValue > 0 
                      ? Math.round((kr.currentValue / kr.targetValue) * 100) 
                      : 0;
                    return (
                      <div key={kr.id} className="border border-border/60 rounded-lg p-4">
                        <p className="text-sm font-medium mb-3">
                          <span className="text-muted-foreground">KR{index + 1}:</span> {kr.text}
                        </p>
                        <div className="flex items-center gap-4">
                          <ProgressBar value={progress} className="flex-1" />
                          <span className="text-xs text-muted-foreground tabular-nums min-w-[80px] text-right">
                            {kr.currentValue} / {kr.targetValue}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Confidence History */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Check-in History</CardTitle>
              <p className="helper-text">Recent confidence updates and context</p>
            </CardHeader>
            <CardContent className="pt-0">
              {okr.checkIns.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4">No check-ins yet</p>
              ) : (
                <div className="space-y-0">
                  {okr.checkIns.slice(0, 6).map((ci) => (
                    <div key={ci.id} className="flex items-start gap-4 py-3 border-b border-border/40 last:border-0">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-[80px]">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(ci.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                      <ConfidenceBadge confidence={ci.confidence} label={ci.confidenceLabel} size="sm" />
                      <span className="text-xs text-muted-foreground">
                        {ci.progress}%
                      </span>
                      {ci.reasonForChange && (
                        <p className="text-xs text-muted-foreground flex-1 truncate">
                          {ci.reasonForChange}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Parent/Child Links */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-muted-foreground" />
                Alignment
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              {parentOkr && (
                <div>
                  <p className="section-header mb-2">Parent OKR</p>
                  <div 
                    className="border border-border/60 rounded-lg p-3 cursor-pointer hover:bg-muted/40 transition-colors"
                    onClick={() => navigate(`/okrs/${parentOkr.id}`)}
                  >
                    <p className="text-sm font-medium truncate">{parentOkr.objectiveText}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-muted-foreground">{parentOkr.ownerName}</span>
                      {parentOkr.latestCheckIn && (
                        <ConfidenceBadge 
                          confidence={parentOkr.latestCheckIn.confidence} 
                          size="sm"
                          showValue={false}
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {okr.childOKRs.length > 0 && (
                <div>
                  <p className="section-header mb-2">Child OKRs</p>
                  <div className="space-y-2">
                    {okr.childOKRs.map(child => (
                      <div 
                        key={child.id}
                        className="border border-border/60 rounded-lg p-3 cursor-pointer hover:bg-muted/40 transition-colors"
                        onClick={() => navigate(`/okrs/${child.id}`)}
                      >
                        <p className="text-sm font-medium truncate">{child.objectiveText}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-muted-foreground">{child.ownerName}</span>
                          {child.latestCheckIn && (
                            <ConfidenceBadge 
                              confidence={child.latestCheckIn.confidence} 
                              size="sm"
                              showValue={false}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!parentOkr && okr.childOKRs.length === 0 && (
                <p className="text-muted-foreground text-sm">
                  No linked OKRs
                </p>
              )}
            </CardContent>
          </Card>

          {/* Jira Links */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
                Linked Work
              </CardTitle>
              <p className="helper-text">Jira epics linked to this OKR</p>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {okr.jiraLinks.map((link) => (
                <div 
                  key={link.id} 
                  className="flex items-center justify-between border border-border/60 rounded-lg px-3 py-2"
                >
                  <span className="text-xs font-mono text-muted-foreground">{link.epicIdentifierOrUrl}</span>
                  {canEdit && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0"
                      onClick={() => removeJiraLink(link.id)}
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              ))}
              
              {canEdit && (
                <div className="flex gap-2 pt-2">
                  <Input
                    placeholder="Epic ID or URL"
                    value={jiraInput}
                    onChange={(e) => setJiraInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddJiraLink()}
                    className="bg-background h-8 text-sm"
                  />
                  <Button variant="outline" size="sm" className="h-8 px-3" onClick={handleAddJiraLink}>
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}

              {okr.jiraLinks.length === 0 && !canEdit && (
                <p className="text-muted-foreground text-sm">
                  No linked work
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
