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
  X
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
  parentOkrId: string;
  confidence: number;
}

const STEPS = [
  { id: 'scope', title: 'Scope & Ownership' },
  { id: 'objective', title: 'Objective' },
  { id: 'keyresults', title: 'Key Results' },
  { id: 'alignment', title: 'Alignment' },
  { id: 'confidence', title: 'Initial Confidence' },
  { id: 'review', title: 'Review & Create' },
];

export function CreateOKRPage() {
  const navigate = useNavigate();
  const { 
    productAreas, 
    domains, 
    teams,
    getOKRsByQuarter,
    createOKR,
    currentQuarter
  } = useApp();

  const [currentStep, setCurrentStep] = useState(0);
  const [draft, setDraft] = useState<OKRDraft>({
    level: '',
    ownerId: '',
    quarter: currentQuarter,
    objectiveText: '',
    keyResults: [{ id: '1', metricName: '', baseline: '', target: '' }],
    parentOkrId: '',
    confidence: 50,
  });

  // Get available quarters
  const quarters = useMemo(() => {
    const current = getCurrentQuarter();
    const next = getNextQuarter(current);
    return [current, next];
  }, []);

  // Get owners based on selected level
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

  // Get potential parent OKRs
  const potentialParents = useMemo(() => {
    const okrs = getOKRsByQuarter(draft.quarter);
    if (draft.level === 'team') {
      return okrs.filter(o => o.level === 'domain' || o.level === 'productArea');
    }
    if (draft.level === 'domain') {
      return okrs.filter(o => o.level === 'productArea');
    }
    return [];
  }, [draft.level, draft.quarter, getOKRsByQuarter]);

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

  // Validation
  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 0: // Scope
        return draft.level !== '' && draft.ownerId !== '';
      case 1: // Objective
        return draft.objectiveText.trim().length > 0;
      case 2: // Key Results
        return draft.keyResults.some(kr => kr.metricName.trim().length > 0 && kr.target.trim().length > 0);
      case 3: // Alignment (optional)
        return true;
      case 4: // Confidence
        return true;
      case 5: // Review
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

  const handleCreate = () => {
    if (draft.level === '') return;
    
    const newOkrId = createOKR({
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
      parentOkrId: draft.parentOkrId || undefined,
      initialConfidence: draft.confidence
    });
    
    toast.success('OKR created. Confidence signal established.');
    navigate(`/okrs/${newOkrId}`);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0: // Scope & Ownership
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-sm font-medium">Level</Label>
              <p className="text-xs text-muted-foreground mt-1 mb-3">
                This sets accountability and visibility. Choose the level where the outcome is owned.
              </p>
              <div className="grid grid-cols-3 gap-3">
                {(['productArea', 'domain', 'team'] as OKRLevel[]).map(level => (
                  <button
                    key={level}
                    onClick={() => {
                      updateDraft('level', level);
                      updateDraft('ownerId', '');
                    }}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors",
                      draft.level === level
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    )}
                  >
                    {getLevelIcon(level)}
                    <span className="text-sm font-medium">{getLevelLabel(level)}</span>
                  </button>
                ))}
              </div>
            </div>

            {draft.level && (
              <div className="animate-fade-in">
                <Label className="text-sm font-medium">Owner</Label>
                <Select value={draft.ownerId} onValueChange={(v) => updateDraft('ownerId', v)}>
                  <SelectTrigger className="mt-2 bg-background">
                    <SelectValue placeholder={`Select ${getLevelLabel(draft.level as OKRLevel)}`} />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    {owners.map(owner => (
                      <SelectItem key={owner.id} value={owner.id}>
                        {owner.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label className="text-sm font-medium">Quarter</Label>
              <Select value={draft.quarter} onValueChange={(v) => updateDraft('quarter', v)}>
                <SelectTrigger className="mt-2 bg-background w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {quarters.map(q => (
                    <SelectItem key={q} value={q}>
                      {formatQuarter(q)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 1: // Objective
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Objective</Label>
              <p className="text-xs text-muted-foreground mt-1 mb-3">
                A strong objective describes a meaningful outcome for users or the business.
              </p>
              <Textarea
                placeholder="Describe the change you want to see, not the feature you plan to build."
                value={draft.objectiveText}
                onChange={(e) => updateDraft('objectiveText', e.target.value)}
                className="min-h-[120px] bg-background resize-none"
              />
            </div>
          </div>
        );

      case 2: // Key Results
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
              <Button
                variant="outline"
                size="sm"
                onClick={addKeyResult}
                className="gap-2"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Key Result
              </Button>
            )}
          </div>
        );

      case 3: // Alignment
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Parent OKR (optional)</Label>
              <p className="text-xs text-muted-foreground mt-1 mb-3">
                Linking OKRs makes alignment visible. You can add or change this later.
              </p>
              
              {potentialParents.length > 0 ? (
                <Select 
                  value={draft.parentOkrId} 
                  onValueChange={(v) => updateDraft('parentOkrId', v)}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select a parent OKR" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="">None</SelectItem>
                    {potentialParents.map(okr => (
                      <SelectItem key={okr.id} value={okr.id}>
                        <div className="flex items-center gap-2">
                          {getLevelIcon(okr.level)}
                          <span className="truncate">{okr.objectiveText}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-4">
                  No parent OKRs available for {formatQuarter(draft.quarter)}. 
                  You can link this OKR to a parent later.
                </div>
              )}
            </div>

            {!draft.parentOkrId && draft.level !== 'productArea' && (
              <div className="bg-confidence-medium-bg text-confidence-medium rounded-lg px-4 py-3 text-sm">
                This OKR will not be linked to a parent outcome. You can add alignment later.
              </div>
            )}
          </div>
        );

      case 4: // Initial Confidence
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
                <ConfidenceBadge 
                  confidence={draft.confidence} 
                  label={getConfidenceLabel(draft.confidence)}
                />
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

      case 5: // Review
        const parentOkr = potentialParents.find(o => o.id === draft.parentOkrId);
        return (
          <div className="space-y-5">
            {/* Scope */}
            <div className="border border-border/60 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Scope</span>
                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setCurrentStep(0)}>
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

            {/* Objective */}
            <div className="border border-border/60 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Objective</span>
                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setCurrentStep(1)}>
                  Edit
                </Button>
              </div>
              <p className="text-sm">{draft.objectiveText}</p>
            </div>

            {/* Key Results */}
            <div className="border border-border/60 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Key Results</span>
                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setCurrentStep(2)}>
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

            {/* Alignment */}
            <div className="border border-border/60 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Alignment</span>
                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setCurrentStep(3)}>
                  Edit
                </Button>
              </div>
              {parentOkr ? (
                <p className="text-sm">→ {parentOkr.objectiveText}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Not linked to a parent OKR</p>
              )}
            </div>

            {/* Confidence */}
            <div className="border border-border/60 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Initial Confidence</span>
                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setCurrentStep(4)}>
                  Edit
                </Button>
              </div>
              <ConfidenceBadge 
                confidence={draft.confidence} 
                label={getConfidenceLabel(draft.confidence)}
              />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Back button */}
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => navigate('/okrs')} 
        className="gap-2 -ml-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to OKRs
      </Button>

      {/* Header */}
      <div>
        <h1 className="page-title flex items-center gap-2">
          <Target className="w-6 h-6" />
          Create OKR
        </h1>
        <p className="helper-text mt-1">
          Define an outcome with clarity, alignment, and an explicit confidence signal.
        </p>
      </div>

      {/* Progress steps */}
      <div className="flex items-center gap-1">
        {STEPS.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <button
              onClick={() => index < currentStep && setCurrentStep(index)}
              disabled={index > currentStep}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors",
                index === currentStep && "bg-primary text-primary-foreground",
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

      {/* Step content */}
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">{STEPS[currentStep].title}</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {renderStep()}
        </CardContent>
      </Card>

      {/* Navigation */}
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
          <Button
            onClick={handleNext}
            disabled={!canProceed}
            className="gap-2"
          >
            Next
            <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={handleCreate}
            className="gap-2"
          >
            <Check className="w-4 h-4" />
            Create OKR
          </Button>
        )}
      </div>
    </div>
  );
}
