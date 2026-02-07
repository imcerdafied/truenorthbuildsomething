import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { OKRWithDetails, formatQuarter, getNextQuarter } from '@/types';
import { RefreshCcw, ArrowRight, Archive } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RolloverDialogProps {
  okr: OKRWithDetails;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRollover: (option: 'continue' | 'revise' | 'retire', notes?: string) => void;
}

type RolloverOption = 'continue' | 'revise' | 'retire';

export function RolloverDialog({ okr, open, onOpenChange, onRollover }: RolloverDialogProps) {
  const [selectedOption, setSelectedOption] = useState<RolloverOption>('continue');
  const [notes, setNotes] = useState('');

  const nextQuarter = getNextQuarter(okr.quarter);

  const handleConfirm = () => {
    onRollover(selectedOption, notes.trim() || undefined);
    onOpenChange(false);
    setSelectedOption('continue');
    setNotes('');
  };

  const options = [
    {
      value: 'continue' as RolloverOption,
      icon: RefreshCcw,
      title: 'Continue unchanged',
      description: 'Roll over this OKR with the same targets. Confidence resets for the new quarter.',
    },
    {
      value: 'revise' as RolloverOption,
      icon: ArrowRight,
      title: 'Continue with revised targets',
      description: 'Roll over and adjust targets based on what you learned. You can edit after creation.',
    },
    {
      value: 'retire' as RolloverOption,
      icon: Archive,
      title: 'Retire this OKR',
      description: 'Mark as complete or no longer relevant. The OKR and its history will be preserved.',
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCcw className="w-5 h-5 text-muted-foreground" />
            Roll over to {formatQuarter(nextQuarter)}
          </DialogTitle>
          <DialogDescription className="text-sm pt-2">
            How would you like to handle this OKR for the next quarter?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Current OKR context */}
          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <p className="font-medium truncate">{okr.objectiveText}</p>
            <p className="text-muted-foreground text-xs mt-1">
              {formatQuarter(okr.quarter)} · {okr.ownerName}
            </p>
          </div>

          {/* Options */}
          <RadioGroup
            value={selectedOption}
            onValueChange={(v) => setSelectedOption(v as RolloverOption)}
            className="space-y-3"
          >
            {options.map((option) => (
              <div key={option.value}>
                <Label
                  htmlFor={option.value}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                    selectedOption === option.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50"
                  )}
                >
                  <RadioGroupItem value={option.value} id={option.value} className="mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <option.icon className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{option.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>

          {/* Notes field */}
          {selectedOption !== 'continue' && (
            <div className="animate-fade-in">
              <Label className="text-xs text-muted-foreground">
                {selectedOption === 'retire' ? 'Reason for retiring (optional)' : 'Notes on changes (optional)'}
              </Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  selectedOption === 'retire'
                    ? "e.g., Achieved target, or no longer a priority"
                    : "e.g., Adjusting target based on Q1 learnings"
                }
                className="mt-2 min-h-[80px] bg-background resize-none"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            {selectedOption === 'retire' ? 'Retire OKR' : 'Roll Over'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
