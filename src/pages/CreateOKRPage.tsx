import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { ConfidenceBadge } from '@/components/shared/ConfidenceBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { OKRLevel, formatQuarter, getConfidenceLabel, getCurrentQuarter, getNextQuarter } from '@/types';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Layers,
  Building2,
  Users,
  Target,
  Plus,
  X,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface KeyResultDraft {
  id: string;
  metricName: string;
  baseline: string;
  target: string;
}

interface OKRDraft {
  level: OKRLevel | '';
  ownerId: string;
  quarter: string;
  objectiveText: string;
  keyResults: KeyResultDraft[];
  confidence: number;
}

const STEPS = [
  { id: 'objective', title: 'Objective' },
  { id: 'keyresults', title: 'Key Results' },
  { id: 'confidence', title: 'Initial Confidence' },
  { id: 'review', title: 'Review & Create' },
];

export function CreateOKRPage() {
  const navigate = useNavigate();
  const {
    productAreas,
    domains,
    teams,
    selectedTeamId,
    createOKR,
    currentQuarter
  } = useApp();

  const currentTeam = teams.find(t => t.id === selectedTeamId);
  const currentDomain = domains.find(d => d.id === currentTeam?.domainId);
  const currentProductArea = productAreas.find(pa =>
    domains.some(d => d.id === currentTeam?.domainId && d.productAreaId === pa.id)
  );

  const [currentStep, setCurrentStep] = useState(0);
  const [showAdvancedOwnership, setShowAdvancedOwnership] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draft, setDraft] = useState<OKRDraft>({
    level: 'team',
    ownerId: selectedTeamId || '',
    quarter: currentQuarter,
    objectiveText: '',
    keyResults: [{ id: '1', metricName: '', baseline: '', target: '' }],
    confidence: 50,
  });

  const quarters = useMemo(() => {
    const current = getCurrentQuarter();
    const next = getNextQuarter(current);
    return [current, next];
  }, []);

  const owners = useMemo(() => {
    switch (draft.level) {
      case 'productArea':
        return productAreas.map(pa => ({ id: pa.id, name: pa.name }));
      case 'domain':
        return domains.map(d => ({ id: d.id, name: d.name }));
      case 'team':
        return teams.map(t => ({ id: t.id, name: t.name }));
      default:
        return [];
    }
  }, [draft.level, productAreas, domains, teams]);

  const getOwnerName = () => {
    if (!draft.ownerId) return '';
    const owner = owners.find(o => o.id === draft.ownerId);
    return owner?.name || '';
  };

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

  const canProceed = useMemo(() => {
    if (!draft.level || !draft.ownerId) return false;
    switch (currentStep) {
      case 0:
        return draft.objectiveText.trim().length > 0;
      case 1:
        return draft.keyResults.some(kr => kr.metricName.trim().length > 0 && kr.target.trim().length > 0);
      case 2:
      case 3:
        return true;
      default:
        return false;
    }
  }, [currentStep, draft]);

  const updateDraft = (field: keyof OKRDraft, value: any) => {
    setDraft(prev => ({ ...prev, [field]: value }));
  };

  const updateKeyResult = (index: number, field: keyof KeyResultDraft, value: string) => {
    setDraft(prev => ({
      ...prev,
      keyResults: prev.keyResults.map((kr, i) =>
        i === index ? { ...kr, [field]: value } : kr
      )
    }));
  };

  const addKeyResult = () => {
    if (draft.keyResults.length < 3) {
      setDraft(prev => ({
        ...prev,
        keyResults: [...prev.keyResults, { id: Date.now().toString(), metricName: '', baseline: '', target: '' }]
      }));
    }
  };

  const removeKeyResult = (index: number) => {
    if (draft.keyResults.length > 1) {
      setDraft(prev => ({
        ...prev,
        keyResults: prev.keyResults.filter((_, i) => i !== index)
      }));
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1 && canProceed) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleCreate = async () => {
    if (draft.level === '') return;
    setIsSubmitting(true);
    try {
      const newOkrId = await createOKR({
        level: draft.level as OKRLevel,
        ownerId: draft.ownerId,
        quarter: draft.quarter,
        objectiveText: draft.objectiveText,
        keyResults: draft.keyResults
          .filter(kr => kr.metricName.trim())
          .map(kr => ({
            metricName: kr.metricName,
            baseline: kr.baseline || undefined,
            target: kr.target
          })),
        initialConfidence: draft.confidence
      });
      toast.success('OKR created. Confidence signal established.');
      navigate(`/okrs/${newOkrId}`);
    } catch (e) {
      console.error(e);
      toast.error('Failed to create OKR. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0: // Objective
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">What outcome are you trying to achieve?</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Write the outcome, not the activity. Good: "Reduce checkout abandonment rate." Not: "Redesign checkout flow."
              </p>
            </div>
            <Textarea
              value={draft.objectiveText}
              onChange={(e) => updateDraft('objectiveText', e.target.value)}
              placeholder="e.g., Improve search relevance and speed"
              className="min-h-[100px] text-base bg-background resize-none"
              autoFocus
            />
          </div>
        );

      case 1: // Key Results
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Key Results</Label>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                Key Results should be measurable and time-bound. Add 1–3 key results.
              </p>
            </div>
            <div className="space-y-4">
              {draft.keyResults.map((kr, index) => (
                <div key={kr.id} className="border border-border/60 rounded-lg p-4 animate-fade-in">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-muted-foreground">KR {index + 1}</span>
                    {draft.keyResults.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => removeKeyResult(index)}
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Metric name</Label>
                      <Input
                        placeholder="e.g., Booking conversion rate"
                        value={kr.metricName}
                        onChange={(e) => updateKeyResult(index, 'metricName', e.target.value)}
                        className="mt-1 bg-background"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Baseline (optional)</Label>
                        <Input
                          placeholder="e.g., 18%"
                          value={kr.baseline}
                          onChange={(e) => updateKeyResult(index, 'baseline', e.target.value)}
                          className="mt-1 bg-background"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Target</Label>
                        <Input
                          placeholder="e.g., 22%"
                          value={kr.target}
                          onChange={(e) => updateKeyResult(index, 'target', e.target.value)}
                          className="mt-1 bg-background"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {draft.keyResults.length < 3 && (
              <Button variant="outline" size="sm" onClick={addKeyResult} className="gap-2">
                <Plus className="w-3.5 h-3.5" />
                Add Key Result
              </Button>
            )}
          </div>
        );

      case 2: // Initial Confidence
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-sm font-medium">Initial Confidence</Label>
              <p className="text-xs text-muted-foreground mt-1">
                This is your best judgment today. You'll update confidence as you learn.
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Confidence is not a commitment. It's a signal.
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <ConfidenceBadge confidence={draft.confidence} label={getConfidenceLabel(draft.confidence)} />
                <span className="text-2xl font-semibold tabular-nums">{draft.confidence}</span>
              </div>
              <Slider
                value={[draft.confidence]}
                onValueChange={(v) => updateDraft('confidence', v[0])}
                min={0}
                max={100}
                step={5}
                className="py-4"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Low (&lt;40)</span>
                <span>Medium (40–74)</span>
                <span>High (≥75)</span>
              </div>
            </div>
          </div>
        );

      case 3: // Review
        return (
          <div className="space-y-5">
            <div className="border border-border/60 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Scope</span>
                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setShowAdvancedOwnership(true)}>
                  Edit
                </Button>
              </div>
              <div className="flex items-center gap-3">
                {draft.level && getLevelIcon(draft.level as OKRLevel)}
                <div>
                  <p className="text-sm font-medium">{getOwnerName()}</p>
                  <p className="text-xs text-muted-foreground">
                    {draft.level && getLevelLabel(draft.level as OKRLevel)} · {formatQuarter(draft.quarter)}
                  </p>
                </div>
              </div>
            </div>
            <div className="border border-border/60 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Objective</span>
                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setCurrentStep(0)}>
                  Edit
                </Button>
              </div>
              <p className="text-sm">{draft.objectiveText}</p>
            </div>
            <div className="border border-border/60 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Key Results</span>
                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setCurrentStep(1)}>
                  Edit
                </Button>
              </div>
              <div className="space-y-2">
                {draft.keyResults.filter(kr => kr.metricName).map((kr, i) => (
                  <div key={kr.id} className="text-sm">
                    <span className="text-muted-foreground">KR{i + 1}:</span>{' '}
                    {kr.metricName}
                    {kr.baseline && kr.target && ` (${kr.baseline} → ${kr.target})`}
                    {!kr.baseline && kr.target && ` (target: ${kr.target})`}
                  </div>
                ))}
              </div>
            </div>
            <div className="border border-border/60 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Initial Confidence</span>
                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setCurrentStep(2)}>
                  Edit
                </Button>
              </div>
              <ConfidenceBadge confidence={draft.confidence} label={getConfidenceLabel(draft.confidence)} />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/okrs')}
        className="gap-2 -ml-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to OKRs
      </Button>

      <div>
        <h1 className="page-title flex items-center gap-2">
          <Target className="w-6 h-6" />
          Create OKR
        </h1>
        <p className="helper-text mt-1">
          Define an outcome with clarity, alignment, and an explicit confidence signal.
        </p>
      </div>

      {/* Ownership bar - always visible */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted/30 rounded-lg border border-border/40">
        <div className="flex items-center gap-2 text-sm">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">Owner:</span>
          <span className="font-medium">{getOwnerName()}</span>
          {draft.level === 'team' && currentDomain && (
            <span className="text-xs text-muted-foreground">
              · {currentDomain.name}{currentProductArea ? ` · ${currentProductArea.name}` : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Select value={draft.quarter} onValueChange={(v) => updateDraft('quarter', v)}>
            <SelectTrigger className="h-7 w-28 text-xs border-0 bg-transparent">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {quarters.map(q => (
                <SelectItem key={q} value={q}>{formatQuarter(q)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-6 px-2"
            onClick={() => setShowAdvancedOwnership(!showAdvancedOwnership)}
          >
            {showAdvancedOwnership ? 'Hide' : 'Change'}
          </Button>
        </div>
      </div>

      {showAdvancedOwnership && (
        <Card className="border-border/40">
          <CardContent className="py-4 space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Level</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {(['team', 'domain', 'productArea'] as OKRLevel[]).map(level => {
                  const options = level === 'productArea' ? productAreas
                    : level === 'domain' ? domains : teams;
                  return (
                    <button
                      key={level}
                      onClick={() => {
                        updateDraft('level', level);
                        if (options.length === 1) {
                          updateDraft('ownerId', options[0].id);
                        } else {
                          updateDraft('ownerId', '');
                        }
                      }}
                      className={cn(
                        "px-3 py-2 rounded-md border text-sm transition-colors",
                        draft.level === level
                          ? "border-foreground/30 bg-foreground/5 font-medium"
                          : "border-border hover:border-foreground/20"
                      )}
                    >
                      {level === 'productArea' ? 'Product Area' : level === 'domain' ? 'Domain' : 'Team'}
                      {options.length === 1 && (
                        <span className="block text-xs text-muted-foreground mt-0.5">
                          {options[0].name} (auto)
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            {owners.length > 1 && (
              <div>
                <Label className="text-xs text-muted-foreground">Owner</Label>
                <Select value={draft.ownerId} onValueChange={(v) => updateDraft('ownerId', v)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select owner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {owners.map(o => (
                      <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Most OKRs are team-level. Domain and Product Area levels are for cross-team outcomes.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-1">
        {STEPS.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <button
              onClick={() => index < currentStep && setCurrentStep(index)}
              disabled={index > currentStep}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors",
                index === currentStep && "bg-secondary text-secondary-foreground",
                index < currentStep && "text-muted-foreground hover:text-foreground cursor-pointer",
                index > currentStep && "text-muted-foreground/50 cursor-not-allowed"
              )}
            >
              {index < currentStep ? (
                <Check className="w-3 h-3" />
              ) : (
                <span className="w-4 h-4 rounded-full border flex items-center justify-center text-[10px]">
                  {index + 1}
                </span>
              )}
              <span className="hidden sm:inline">{step.title}</span>
            </button>
            {index < STEPS.length - 1 && (
              <div className={cn(
                "w-4 h-px mx-1",
                index < currentStep ? "bg-muted-foreground" : "bg-border"
              )} />
            )}
          </div>
        ))}
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">{STEPS[currentStep].title}</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {renderStep()}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 0}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        {currentStep < STEPS.length - 1 ? (
          <Button onClick={handleNext} disabled={!canProceed} className="gap-2">
            Next
            <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button onClick={handleCreate} disabled={isSubmitting} className="gap-2">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Create OKR
          </Button>
        )}
      </div>
    </div>
  );
}
