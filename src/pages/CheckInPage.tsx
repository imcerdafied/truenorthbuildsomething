import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { ConfidenceBadge } from '@/components/shared/ConfidenceBadge';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { getConfidenceLabel, OKRWithDetails } from '@/types';
import { ArrowLeft, ArrowRight, Check, AlertCircle } from 'lucide-react';

interface CheckInFormData {
  okrId: string;
  progress: number;
  confidence: number;
  previousConfidence: number;
  reasonForChange: string;
  optionalNote: string;
}

export function CheckInPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedOkrId = searchParams.get('okrId');
  
  const { 
    getTeamOKRs, 
    selectedTeamId, 
    addCheckIn,
    getTeam,
    isCurrentUserPM
  } = useApp();

  const team = getTeam(selectedTeamId);
  const teamOKRs = getTeamOKRs(selectedTeamId);
  
  // Filter to OKRs that user can check in on
  const editableOKRs = preselectedOkrId 
    ? teamOKRs.filter(o => o.id === preselectedOkrId)
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
        optionalNote: ''
      };
    });
    return initial;
  });

  const currentOKR = editableOKRs[currentStep];
  const currentData = currentOKR ? formData[currentOKR.id] : null;

  const isConfidenceChanged = currentData 
    ? currentData.confidence !== currentData.previousConfidence 
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

  const handleSubmit = () => {
    // Submit all check-ins
    Object.values(formData).forEach(data => {
      addCheckIn({
        okrId: data.okrId,
        date: new Date().toISOString().split('T')[0],
        cadence: team?.cadence || 'biweekly',
        progress: data.progress,
        confidence: data.confidence,
        reasonForChange: data.reasonForChange || undefined,
        optionalNote: data.optionalNote || undefined
      });
    });
    navigate('/');
  };

  if (!isCurrentUserPM(selectedTeamId)) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Only the PM can submit check-ins</p>
        <Button variant="ghost" onClick={() => navigate('/')} className="mt-4">
          Back to Home
        </Button>
      </div>
    );
  }

  if (editableOKRs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No OKRs to check in on</p>
        <Button variant="ghost" onClick={() => navigate('/')} className="mt-4">
          Back to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Cancel
        </Button>
        <div className="text-sm text-muted-foreground">
          {currentStep + 1} of {editableOKRs.length} OKRs
        </div>
      </div>

      {/* Progress indicator */}
      <div className="flex gap-1">
        {editableOKRs.map((_, index) => (
          <div 
            key={index}
            className={`h-1 flex-1 rounded-full transition-colors ${
              index <= currentStep ? 'bg-primary' : 'bg-muted'
            }`}
          />
        ))}
      </div>

      {/* Check-in Form */}
      {currentOKR && currentData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{currentOKR.objectiveText}</CardTitle>
            <CardDescription>
              {team?.cadence === 'weekly' ? 'Weekly' : 'Bi-weekly'} check-in for {team?.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Progress */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Progress</Label>
                <span className="text-2xl font-semibold">{currentData.progress}%</span>
              </div>
              <Slider
                value={[currentData.progress]}
                onValueChange={([value]) => updateField('progress', value)}
                max={100}
                step={1}
                className="py-4"
              />
              <ProgressBar value={currentData.progress} />
            </div>

            {/* Confidence */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Confidence</Label>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-semibold">{currentData.confidence}</span>
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
                className="py-4"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Low (&lt;40)</span>
                <span>Medium (40-74)</span>
                <span>High (≥75)</span>
              </div>
            </div>

            {/* Reason for change (required if confidence changed) */}
            {isConfidenceChanged && (
              <div className="space-y-2 p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-confidence-medium" />
                  <Label className="font-medium">
                    Reason for change <span className="text-destructive">*</span>
                  </Label>
                </div>
                <p className="helper-text">
                  Confidence changed from {currentData.previousConfidence} to {currentData.confidence}. 
                  Please explain why.
                </p>
                <Textarea
                  placeholder="Brief explanation for the confidence change..."
                  value={currentData.reasonForChange}
                  onChange={(e) => updateField('reasonForChange', e.target.value)}
                  className="bg-background"
                  rows={2}
                />
              </div>
            )}

            {/* Optional note */}
            <div className="space-y-2">
              <Label>Note (optional)</Label>
              <Textarea
                placeholder="Any additional context or updates..."
                value={currentData.optionalNote}
                onChange={(e) => updateField('optionalNote', e.target.value)}
                className="bg-background"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={handlePrevious}
          disabled={currentStep === 0}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        {currentStep === editableOKRs.length - 1 ? (
          <Button onClick={handleSubmit} disabled={!canProceed} className="gap-2">
            <Check className="w-4 h-4" />
            Submit All Check-ins
          </Button>
        ) : (
          <Button onClick={handleNext} disabled={!canProceed}>
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
