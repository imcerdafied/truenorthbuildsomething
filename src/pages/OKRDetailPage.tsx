import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { ConfidenceBadge } from '@/components/shared/ConfidenceBadge';
import { TrendIndicator } from '@/components/shared/TrendIndicator';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { OrphanWarning } from '@/components/shared/OrphanWarning';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
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
    okrs,
    getOKRsByQuarter,
    currentQuarter
  } = useApp();

  const [jiraInput, setJiraInput] = useState('');
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<string>('');

  const okr = okrId ? getOKRWithDetails(okrId) : null;

  if (!okr) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Target className="w-12 h-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">OKR not found</p>
        <Button variant="ghost" onClick={() => navigate('/okrs')} className="mt-4">
          Back to OKRs
        </Button>
      </div>
    );
  }

  const canEdit = canEditOKR(okr.id);

  const getLevelIcon = (level: OKRLevel) => {
    switch (level) {
      case 'productArea': return <Layers className="w-5 h-5" />;
      case 'domain': return <Building2 className="w-5 h-5" />;
      case 'team': return <Users className="w-5 h-5" />;
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

  // Get potential parent OKRs (higher level)
  const potentialParents = getOKRsByQuarter(currentQuarter).filter(o => {
    if (okr.level === 'team') return o.level === 'domain' || o.level === 'productArea';
    if (okr.level === 'domain') return o.level === 'productArea';
    return false;
  });

  // Get parent OKR if linked
  const parentOkr = okr.parentOkrId ? getOKRWithDetails(okr.parentOkrId) : null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={() => navigate('/okrs')} className="gap-2">
        <ArrowLeft className="w-4 h-4" />
        Back to OKRs
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground">{getLevelIcon(okr.level)}</span>
            <Badge variant="secondary">{getLevelLabel(okr.level)}</Badge>
            <Badge variant="outline">{formatQuarter(okr.quarter)}</Badge>
            {okr.isRolledOver && (
              <Badge variant="secondary" className="gap-1">
                <RefreshCcw className="w-3 h-3" />
                Rolled over
              </Badge>
            )}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{okr.objectiveText}</h1>
          <p className="text-muted-foreground">Owner: {okr.ownerName}</p>
          {okr.isOrphaned && (
            <div className="flex items-center gap-2 mt-2">
              <OrphanWarning />
              <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1">
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

        <div className="flex gap-2">
          {canEdit && (
            <>
              <Button variant="outline" onClick={() => navigate(`/checkin?okrId=${okr.id}`)} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Check-in
              </Button>
              <Button variant="outline" onClick={handleRollover} className="gap-2">
                <RefreshCcw className="w-4 h-4" />
                Roll over to next quarter
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Progress</p>
                  <div className="flex items-center gap-4">
                    <span className="text-3xl font-semibold">
                      {okr.latestCheckIn?.progress || 0}%
                    </span>
                    <ProgressBar 
                      value={okr.latestCheckIn?.progress || 0} 
                      className="flex-1" 
                    />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Confidence</p>
                  <div className="flex items-center gap-4">
                    <span className="text-3xl font-semibold">
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
            </CardContent>
          </Card>

          {/* Key Results */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Key Results</CardTitle>
            </CardHeader>
            <CardContent>
              {okr.keyResults.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No key results defined</p>
              ) : (
                <div className="space-y-4">
                  {okr.keyResults.map((kr, index) => {
                    const progress = kr.targetValue > 0 
                      ? Math.round((kr.currentValue / kr.targetValue) * 100) 
                      : 0;
                    return (
                      <div key={kr.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <p className="font-medium">KR{index + 1}: {kr.text}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <ProgressBar value={progress} className="flex-1" />
                          <span className="text-sm text-muted-foreground min-w-[100px] text-right">
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
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Confidence History</CardTitle>
              <p className="helper-text">Last 6 check-ins</p>
            </CardHeader>
            <CardContent>
              {okr.checkIns.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No check-ins yet</p>
              ) : (
                <div className="space-y-3">
                  {okr.checkIns.slice(0, 6).map((ci) => (
                    <div key={ci.id} className="flex items-center gap-4 py-2 border-b last:border-0">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-[100px]">
                        <Calendar className="w-4 h-4" />
                        {new Date(ci.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                      <ConfidenceBadge confidence={ci.confidence} label={ci.confidenceLabel} />
                      <span className="text-sm text-muted-foreground">
                        {ci.progress}% progress
                      </span>
                      {ci.reasonForChange && (
                        <span className="text-sm italic text-muted-foreground flex-1 truncate">
                          "{ci.reasonForChange}"
                        </span>
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
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <GitBranch className="w-4 h-4" />
                Alignment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {parentOkr && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Parent OKR</p>
                  <div 
                    className="border rounded-lg p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => navigate(`/okrs/${parentOkr.id}`)}
                  >
                    <p className="text-sm font-medium truncate">{parentOkr.objectiveText}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">{parentOkr.ownerName}</Badge>
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
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Child OKRs</p>
                  <div className="space-y-2">
                    {okr.childOKRs.map(child => (
                      <div 
                        key={child.id}
                        className="border rounded-lg p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => navigate(`/okrs/${child.id}`)}
                      >
                        <p className="text-sm font-medium truncate">{child.objectiveText}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">{child.ownerName}</Badge>
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
                <p className="text-muted-foreground text-sm text-center py-2">
                  No linked OKRs
                </p>
              )}
            </CardContent>
          </Card>

          {/* Jira Links */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                Linked Work
              </CardTitle>
              <p className="helper-text">Jira epics linked to this OKR</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {okr.jiraLinks.map((link) => (
                <div 
                  key={link.id} 
                  className="flex items-center justify-between border rounded-lg px-3 py-2"
                >
                  <span className="text-sm font-mono">{link.epicIdentifierOrUrl}</span>
                  {canEdit && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => removeJiraLink(link.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              
              {canEdit && (
                <div className="flex gap-2 mt-4">
                  <Input
                    placeholder="Epic ID or URL"
                    value={jiraInput}
                    onChange={(e) => setJiraInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddJiraLink()}
                    className="bg-background"
                  />
                  <Button variant="outline" size="icon" onClick={handleAddJiraLink}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {okr.jiraLinks.length === 0 && !canEdit && (
                <p className="text-muted-foreground text-sm text-center py-2">
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
