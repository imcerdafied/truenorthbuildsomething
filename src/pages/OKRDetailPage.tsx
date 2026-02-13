import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { ConfidenceBadge } from '@/components/shared/ConfidenceBadge';
import { RootCauseBadge } from '@/components/shared/RootCauseBadge';
import { TrendIndicator } from '@/components/shared/TrendIndicator';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { OrphanWarning } from '@/components/shared/OrphanWarning';
import { ConfidenceSparkline } from '@/components/shared/ConfidenceSparkline';
import { RolloverDialog } from '@/components/okr/RolloverDialog';
import { CloseQuarterModal } from '@/components/shared/CloseQuarterModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
import { formatQuarter, OKRLevel, KeyResult, AchievementStatus } from '@/types';
import { 
  ArrowLeft, 
  Target, 
  Building2, 
  Users, 
  Layers,
  Plus,
  PlayCircle,
  Link2,
  RefreshCcw,
  Calendar,
  X,
  GitBranch,
  AlertTriangle
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export function OKRDetailPage() {
  const { okrId } = useParams<{ okrId: string }>();
  const navigate = useNavigate();
  const { 
    getOKRWithDetails, 
    canEditOKR, 
    rolloverOKR,
    addOKRLink,
    getOKRsByQuarter,
    currentQuarter,
    closeQuarter,
    reopenQuarter,
  } = useApp();
  const { isAdmin } = useAuth();

  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [isRolloverDialogOpen, setIsRolloverDialogOpen] = useState(false);
  const [isCloseQuarterOpen, setIsCloseQuarterOpen] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<string>('');

  const okr = okrId ? getOKRWithDetails(okrId) : null;

  if (!okr) {
    return (
      <div className="empty-state">
        <Target className="empty-state-icon" />
        <p className="empty-state-title">OKR not found</p>
        <Button variant="ghost" onClick={() => navigate('/okrs')} className="mt-4">
          ← Back to outcomes
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

  const handleRollover = (option: 'continue' | 'revise' | 'retire', notes?: string) => {
    if (option === 'retire') {
      // In a real app, this would mark the OKR as retired
      toast.success('OKR retired. History preserved.');
    } else {
      rolloverOKR(okr.id);
      toast.success(`OKR rolled over to next quarter. Confidence signal reset.`);
    }
  };

  const handleLinkToParent = () => {
    if (selectedParentId) {
      addOKRLink(selectedParentId, okr.id);
      setIsLinkDialogOpen(false);
      setSelectedParentId('');
    }
  };

  const potentialParents = getOKRsByQuarter(currentQuarter).filter(o => {
    if (o.id === okr.id) return false;
    if (okr.level === 'team') return o.level === 'domain' || o.level === 'productArea';
    if (okr.level === 'domain') return o.level === 'productArea';
    return false;
  });

  const parentOkr = okr.parentOkrId ? getOKRWithDetails(okr.parentOkrId) : null;
  const allOKRsThisQuarter = getOKRsByQuarter(currentQuarter);
  const hasValidParents = potentialParents.length > 0;
  const showAlignmentCard = (parentOkr != null || okr.childOKRs.length > 0) || allOKRsThisQuarter.length >= 2;
  const isClosed = (okr.status ?? 'active') === 'closed';
  const quarterClose = okr.quarterClose;

  const getAchievementLabel = (a: AchievementStatus) => {
    switch (a) {
      case 'achieved': return 'Achieved';
      case 'partially_achieved': return 'Partially Achieved';
      case 'missed': return 'Missed';
    }
  };

  const getAchievementVariant = (a: AchievementStatus) => {
    switch (a) {
      case 'achieved': return 'confidenceHigh';
      case 'partially_achieved': return 'confidenceMedium';
      case 'missed': return 'confidenceLow';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={() => navigate('/okrs')} className="gap-2 -ml-2 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" />
        Back to outcomes
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
          {okr.isOrphaned && hasValidParents && (
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
                        {potentialParents.filter(p => p.id && p.id !== okr.id).map(p => (
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

        <div className="flex gap-2 flex-shrink-0">
          {isClosed ? (
            isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => reopenQuarter(okr.id)}
              >
                Reopen
              </Button>
            )
          ) : (
            <>
              {(canEdit || isAdmin) && (
                <Button variant="default" size="sm" onClick={() => navigate(`/checkin?okrId=${okr.id}`)} className="gap-1.5 bg-foreground text-background hover:bg-foreground/90">
                  <PlayCircle className="w-3.5 h-3.5" />
                  Check-in
                </Button>
              )}
              {canEdit && (
                <>
                  <Button variant="outline" size="sm" onClick={() => setIsCloseQuarterOpen(true)} className="gap-2">
                    Close Quarter
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setIsRolloverDialogOpen(true)} className="gap-2">
                    <RefreshCcw className="w-3.5 h-3.5" />
                    Roll over
                  </Button>
                </>
              )}
            </>
          )}
        </div>

        <CloseQuarterModal
          open={isCloseQuarterOpen}
          onOpenChange={setIsCloseQuarterOpen}
          okrId={okr.id}
          objectiveText={okr.objectiveText}
        />

        {/* Rollover Dialog */}
        <RolloverDialog
          okr={okr}
          open={isRolloverDialogOpen}
          onOpenChange={setIsRolloverDialogOpen}
          onRollover={handleRollover}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Card / Results Banner */}
          <Card className="border-border/60">
            <CardContent className="py-5">
              {isClosed && quarterClose ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 flex-wrap">
                    <Badge variant={getAchievementVariant(quarterClose.achievement)} className="text-xs">
                      {getAchievementLabel(quarterClose.achievement)}
                    </Badge>
                    <span className="text-2xl font-semibold tabular-nums">
                      Final: {quarterClose.finalValue}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {quarterClose.summary}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Closed on {new Date(quarterClose.closedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              ) : (
                <>
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
                </>
              )}
            </CardContent>
          </Card>

          {/* Measures (Key Results) */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Measures</CardTitle>
              <p className="helper-text">Track progress toward this outcome</p>
            </CardHeader>
            <CardContent className="pt-0">
              {okr.keyResults.length === 0 ? (
                <div className="py-6 space-y-3">
                  <p className="text-muted-foreground text-sm">
                    No measures defined yet. Add a measure to track progress toward this outcome.
                  </p>
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate('/okrs')}>
                    <Plus className="w-3.5 h-3.5" />
                    Add measure
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {okr.keyResults.map((kr, index) => {
                    const progress = kr.targetValue > 0 
                      ? Math.round((kr.currentValue / kr.targetValue) * 100) 
                      : 0;
                    return (
                      <KeyResultCard 
                        key={kr.id}
                        kr={kr}
                        index={index}
                        progress={progress}
                        canEdit={canEdit && !isClosed}
                      />
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Check-in History */}
          <Card className="border-border/60">
            {okr.checkIns.length > 0 && (
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium">Check-in History</CardTitle>
                <p className="helper-text">Recent confidence updates and context</p>
              </CardHeader>
            )}
            <CardContent className={okr.checkIns.length > 0 ? 'pt-0' : 'py-5'}>
              {okr.checkIns.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No check-ins yet. Check in to share what&apos;s changed and update confidence.
                </p>
              ) : (
                <div className="space-y-0">
                  {okr.checkIns.slice(0, 6).map((ci) => (
                    <div key={ci.id} className="py-3 border-b border-border/40 last:border-0 space-y-2">
                      <div className="flex items-start gap-4">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-[80px]">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(ci.date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </div>
                        <ConfidenceBadge confidence={ci.confidence} label={ci.confidenceLabel} size="sm" />
                        {ci.rootCause && (
                          <RootCauseBadge rootCause={ci.rootCause} size="sm" />
                        )}
                        <span className="text-xs text-muted-foreground">
                          {ci.progress}%
                        </span>
                        {ci.reasonForChange && (
                          <p className="text-xs text-muted-foreground flex-1 truncate">
                            {ci.reasonForChange}
                          </p>
                        )}
                      </div>
                      {ci.rootCauseNote && (
                        <p className="text-xs text-muted-foreground italic pl-[88px]">
                          {ci.rootCauseNote}
                        </p>
                      )}
                      {ci.recoveryLikelihood && (
                        <p className="text-xs text-muted-foreground pl-[88px]">
                          Recovery: {ci.recoveryLikelihood}
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
          {/* Alignment - only show when meaningful (has links or org has 2+ OKRs) */}
          {showAlignmentCard && (
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
                    <p className="section-header mb-2">Parent outcome</p>
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
                    <p className="section-header mb-2">Child outcomes</p>
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
                    Link this outcome to a parent to see how it connects.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// KeyResultCard component with Needs Attention signal
interface KeyResultCardProps {
  kr: KeyResult;
  index: number;
  progress: number;
  canEdit: boolean;
}

function KeyResultCard({ kr, index, progress, canEdit }: KeyResultCardProps) {
  const [needsAttention, setNeedsAttention] = useState(kr.needsAttention || false);
  const [attentionReason, setAttentionReason] = useState(kr.attentionReason || '');
  const [isEditing, setIsEditing] = useState(false);

  const handleToggleAttention = () => {
    const newValue = !needsAttention;
    setNeedsAttention(newValue);
    if (!newValue) {
      setAttentionReason('');
    } else {
      setIsEditing(true);
    }
    // In a real app, this would persist to the database
    toast.success(newValue ? 'Flagged as needing attention' : 'Attention flag removed');
  };

  const handleSaveReason = () => {
    setIsEditing(false);
    // In a real app, this would persist to the database
    if (attentionReason.trim()) {
      toast.success('Reason saved');
    }
  };

  return (
    <div className={`border rounded-lg p-4 transition-colors ${
      needsAttention ? 'border-confidence-medium/50 bg-confidence-medium-bg/20' : 'border-border/60'
    }`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-2 flex-1">
          {needsAttention && (
            <AlertTriangle className="w-4 h-4 text-confidence-medium shrink-0 mt-0.5" />
          )}
          <p className="text-sm font-medium">
            <span className="text-muted-foreground">M{index + 1}:</span> {kr.text}
          </p>
        </div>
        
        {canEdit && (
          <div className="flex items-center gap-2 shrink-0">
            <Label htmlFor={`attention-${kr.id}`} className="text-xs text-muted-foreground cursor-pointer">
              Needs attention
            </Label>
            <Switch
              id={`attention-${kr.id}`}
              checked={needsAttention}
              onCheckedChange={handleToggleAttention}
              className="data-[state=checked]:bg-confidence-medium"
            />
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-4">
        <ProgressBar value={progress} className="flex-1" />
        <span className="text-xs text-muted-foreground tabular-nums min-w-[80px] text-right">
          {kr.currentValue} / {kr.targetValue}
        </span>
      </div>
      
      {/* Attention reason input */}
      {needsAttention && canEdit && (
        <div className="mt-3 pt-3 border-t border-border/40">
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                placeholder="What's blocking this? (optional)"
                value={attentionReason}
                onChange={(e) => setAttentionReason(e.target.value)}
                className="bg-background resize-none text-sm min-h-[60px]"
              />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSaveReason}
                className="h-7 text-xs"
              >
                Save
              </Button>
            </div>
          ) : attentionReason ? (
            <p 
              className="text-sm text-muted-foreground italic cursor-pointer hover:text-foreground"
              onClick={() => setIsEditing(true)}
            >
              "{attentionReason}"
            </p>
          ) : (
            <button 
              className="text-xs text-muted-foreground hover:text-foreground underline"
              onClick={() => setIsEditing(true)}
            >
              Add reason (optional)
            </button>
          )}
        </div>
      )}
      
      {/* Show reason in read-only mode */}
      {needsAttention && !canEdit && attentionReason && (
        <div className="mt-3 pt-3 border-t border-border/40">
          <p className="text-sm text-muted-foreground italic">
            "{attentionReason}"
          </p>
        </div>
      )}
    </div>
  );
}
