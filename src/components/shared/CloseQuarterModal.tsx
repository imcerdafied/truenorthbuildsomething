import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useApp } from '@/context/AppContext';
import type { AchievementStatus } from '@/types';

interface CloseQuarterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  okrId: string;
  objectiveText: string;
}

export function CloseQuarterModal({
  open,
  onOpenChange,
  okrId,
  objectiveText,
}: CloseQuarterModalProps) {
  const { closeQuarter } = useApp();
  const [finalValue, setFinalValue] = useState<string>('');
  const [achievement, setAchievement] = useState<AchievementStatus | ''>('');
  const [summary, setSummary] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const finalValueNum = parseFloat(finalValue);
    if (isNaN(finalValueNum) || !achievement || !summary.trim()) return;

    setIsSubmitting(true);
    try {
      await closeQuarter(okrId, {
        finalValue: finalValueNum,
        achievement: achievement as AchievementStatus,
        summary: summary.trim(),
      });
      setFinalValue('');
      setAchievement('');
      setSummary('');
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = finalValue.trim() !== '' && !isNaN(parseFloat(finalValue)) && achievement !== '' && summary.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card">
        <DialogHeader>
          <DialogTitle>Close Quarter</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground truncate max-w-full">
            {objectiveText}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="finalValue">Final metric value</Label>
            <Input
              id="finalValue"
              type="number"
              step="any"
              placeholder="e.g. 6.5"
              value={finalValue}
              onChange={(e) => setFinalValue(e.target.value)}
              className="bg-background"
            />
            <p className="text-xs text-muted-foreground">
              e.g., 6.5% error rate, 142 signups
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="achievement">Achievement</Label>
            <Select value={achievement} onValueChange={(v) => setAchievement(v as AchievementStatus | '')}>
              <SelectTrigger id="achievement" className="bg-background">
                <SelectValue placeholder="Select achievement status" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="achieved">Achieved</SelectItem>
                <SelectItem value="partially_achieved">Partially Achieved</SelectItem>
                <SelectItem value="missed">Missed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary">Performance summary</Label>
            <Textarea
              id="summary"
              placeholder="What happened this quarter? What drove the result?"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={4}
              className="bg-background resize-none min-h-[80px] max-h-[120px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            className="bg-foreground text-background hover:bg-foreground/90"
          >
            Close Quarter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
