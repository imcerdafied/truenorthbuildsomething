import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { ConfidenceBadge } from '@/components/shared/ConfidenceBadge';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { getConfidenceLabel, ROOT_CAUSE_LABELS, type RootCauseCategory } from '@/types';
import { ArrowLeft, ArrowRight, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const RECOVERY_LIKELIHOOD_OPTIONS = [
  'Likely to recover',
  'Uncertain',
  'Unlikely without intervention',
] as const;

interface CheckInFormData {
  okrId: string;
  progress: number;
  confidence: number;
  previousConfidence: number;
  reasonForChange: string;
  optionalNote: string;
  rootCause: RootCauseCategory | null;
  rootCauseNote: string;
  recoveryLikelihood: string | null;
}

export function CheckInPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedOkrId = searchParams.get('okrId');
  
  const { 
    getTeamOKRs, 
    getOKRsByQuarter,
    currentQuarter,
    selectedTeamId, 
    addCheckIn,
    getTeam,
    isCurrentUserPM
  } = useApp();
  const { isAdmin } = useAuth();

  const allOKRs = getOKRsByQuarter(currentQuarter);
  const team = getTeam(selectedTeamId);
  const teamOKRs = getTeamOKRs(selectedTeamId);

  const editableOKRs = preselectedOkrId 
    ? allOKRs.filter(o => o.id === preselectedOkrId)
    : teamOKRs;

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, CheckInFormData>>(() => {
    const initial: Record<string, CheckInFormData> = {};
    editableOKRs.forEach(okr => {
      initial[okr.id] = {
        okrId: okr.id,
        progress: okr.latestCheckIn?.progress || 0,
        confidence: okr.latestCheckIn?.confidence || 50,
        previousConfidence: okr.latestCheckIn?.confidence || 50,
        reasonForChange: '',
        optionalNote: '',
        rootCause: null,
        rootCauseNote: '',
        recoveryLikelihood: null
      };
    });
    return initial;
  });

  const currentOKR = editableOKRs[currentStep];
  const currentData = currentOKR ? formData[currentOKR.id] : null;

  const isConfidenceChanged = currentData 
    ? currentData.confidence !== currentData.previousConfidence 
    : false;

  const showRootCauseSection = currentData
    ? currentData.confidence < 70 || currentData.confidence < currentData.previousConfidence
    : false;

  const canProceed = !isConfidenceChanged || (currentData?.reasonForChange?.trim().length || 0) > 0;

  const updateField = (field: keyof CheckInFormData, value: any) => {
    if (!currentOKR) return;
    setFormData(prev => ({
      ...prev,
      [currentOKR.id]: {
        ...prev[currentOKR.id],
        [field]: value
      }
    }));
  };

  const handleNext = () => {
    if (currentStep < editableOKRs.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      for (const data of Object.values(formData)) {
        await addCheckIn({
          okrId: data.okrId,
          date: new Date().toISOString().split('T')[0],
          cadence: team?.cadence || 'biweekly',
          progress: data.progress,
          confidence: data.confidence,
          reasonForChange: data.reasonForChange || undefined,
          optionalNote: data.optionalNote || undefined,
          rootCause: data.rootCause || null,
          rootCauseNote: data.rootCauseNote || null,
          recoveryLikelihood: data.recoveryLikelihood || null
        });
      }
      toast.success('Check-in saved.');
      navigate('/');
    } catch (error) {
      console.error('Error saving check-in:', error);
      toast.error('Failed to save check-in. Please try again.');
    }
  };

  if (!isCurrentUserPM(selectedTeamId) && !isAdmin) {
    return (
      <div className="empty-state">
        <AlertCircle className="empty-state-icon" />
        <p className="empty-state-title">Only the PM can submit check-ins</p>
        <Button variant="ghost" onClick={() => navigate('/')} className="mt-4">
          Back to Home
        </Button>
      </div>
    );
  }

  if (editableOKRs.length === 0) {
    return (
      <div className="empty-state">
        <AlertCircle className="empty-state-icon" />
        <p className="empty-state-title">No outcomes to check in on</p>
        <p className="empty-state-description">
          Create outcomes for your team to start tracking confidence.
        </p>
        <Button variant="ghost" onClick={() => navigate('/')} className="mt-4">
          Back to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-end">
        <div className="text-xs text-muted-foreground">
          {currentStep + 1} of {editableOKRs.length}
        </div>
      </div>

      <h2 className="text-lg font-semibold text-center">Bi-weekly check-in</h2>

      {/* Progress indicator */}
      <div className="flex gap-1">
        {editableOKRs.map((_, index) => (
          <div 
            key={index}
            className={`h-0.5 flex-1 rounded-full transition-colors ${
              index <= currentStep ? 'bg-foreground' : 'bg-muted'
            }`}
          />
        ))}
      </div>

      {/* Check-in Form */}
      {currentOKR && currentData && (
        <Card className="border-border/60">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg leading-tight">{currentOKR.objectiveText}</CardTitle>
            <CardDescription>
              {team?.cadence === 'weekly' ? 'Weekly' : 'Bi-weekly'} check-in for {team?.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Progress */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Progress</Label>
                <span className="text-xl font-semibold tabular-nums">{currentData.progress}%</span>
              </div>
              <Slider
                value={[currentData.progress]}
                onValueChange={([value]) => updateField('progress', value)}
                max={100}
                step={1}
                className="py-2"
              />
              <ProgressBar value={currentData.progress} />
            </div>

            {/* Confidence */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Confidence</Label>
                <div className="flex items-center gap-3">
                  <span className="text-xl font-semibold tabular-nums">{currentData.confidence}</span>
                  <ConfidenceBadge 
                    confidence={currentData.confidence} 
                    showValue={false}
                  />
                </div>
              </div>
              <p className="helper-text">
                How confident are you that this OKR will be achieved by end of quarter?
              </p>
              <Slider
                value={[currentData.confidence]}
                onValueChange={([value]) => updateField('confidence', value)}
                max={100}
                step={1}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Low (&lt;40)</span>
                <span>Medium (40–74)</span>
                <span>High (≥75)</span>
              </div>
            </div>

            {/* Reason for change - contextual, reflective */}
            {isConfidenceChanged && (
              <div className="space-y-3 p-4 border border-confidence-medium/30 rounded-lg bg-confidence-medium-bg/30">
                <div className="flex items-center gap-2">
                  <span className="confidence-dot confidence-dot-medium" />
                  <Label className="text-sm font-medium">
                    Why did confidence change?
                  </Label>
                </div>
                <p className="helper-text">
                  Confidence moved from {currentData.previousConfidence} to {currentData.confidence}. 
                  A brief note helps the team understand what changed.
                </p>
                <Textarea
                  placeholder="What changed since last check-in..."
                  value={currentData.reasonForChange}
                  onChange={(e) => updateField('reasonForChange', e.target.value)}
                  className="bg-background resize-none"
                  rows={2}
                />
              </div>
            )}

            {/* Root cause section - only when confidence < 70 or dropped */}
            {showRootCauseSection && (
              <div className="space-y-3 pt-2 border-t border-border/40 animate-in fade-in duration-200">
                <div>
                  <Label className="text-sm font-medium">What&apos;s driving this?</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Optional — helps surface systemic patterns across teams
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(ROOT_CAUSE_LABELS) as RootCauseCategory[]).map((rc) => (
                    <button
                      key={rc}
                      type="button"
                      onClick={() =>
                        updateField(
                          'rootCause',
                          currentData.rootCause === rc ? null : rc
                        )
                      }
                      className={`text-xs px-3 py-1.5 rounded-full border cursor-pointer transition-colors ${
                        currentData.rootCause === rc
                          ? 'border-foreground text-foreground bg-muted font-medium'
                          : 'border-border text-muted-foreground bg-background hover:bg-muted'
                      }`}
                    >
                      {ROOT_CAUSE_LABELS[rc]}
                    </button>
                  ))}
                </div>
                {currentData.rootCause && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Brief context (optional)</Label>
                      <Textarea
                        placeholder="Brief context (e.g., 'Waiting on Platform team for API access')"
                        value={currentData.rootCauseNote}
                        onChange={(e) => updateField('rootCauseNote', e.target.value)}
                        className="bg-background resize-none text-sm"
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Recovery likelihood</Label>
                      <div className="flex flex-wrap gap-2">
                        {RECOVERY_LIKELIHOOD_OPTIONS.map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() =>
                              updateField(
                                'recoveryLikelihood',
                                currentData.recoveryLikelihood === opt ? null : opt
                              )
                            }
                            className={`text-xs px-3 py-1.5 rounded-full border cursor-pointer transition-colors ${
                              currentData.recoveryLikelihood === opt
                                ? 'border-foreground text-foreground bg-muted font-medium'
                                : 'border-border text-muted-foreground bg-background hover:bg-muted'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Optional note */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Note (optional)</Label>
              <Textarea
                placeholder="Any additional context..."
                value={currentData.optionalNote}
                onChange={(e) => updateField('optionalNote', e.target.value)}
                className="bg-background resize-none"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-2">
        {currentStep > 0 ? (
          <Button 
            variant="ghost" 
            onClick={handlePrevious}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </Button>
        ) : (
          <div />
        )}

        {currentStep === editableOKRs.length - 1 ? (
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button variant="default" onClick={handleSubmit} disabled={!canProceed} className="gap-2 bg-foreground text-background hover:bg-foreground/90">
              <Check className="w-4 h-4" />
              Save
            </Button>
          </div>
        ) : (
          <Button variant="default" onClick={handleNext} disabled={!canProceed} className="gap-2 bg-foreground text-background hover:bg-foreground/90">
            Next
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
