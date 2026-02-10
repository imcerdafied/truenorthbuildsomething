import { useDemoMode } from '@/hooks/useDemoMode';
import { Button } from '@/components/ui/button';
import { Play, X } from 'lucide-react';

export function DemoBanner() {
  const { isDemoMode, disableDemoMode } = useDemoMode();

  if (!isDemoMode) return null;

  return (
    <div className="bg-muted border-b border-border px-4 py-2 flex items-center justify-between text-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Play className="w-4 h-4" />
        <span className="font-medium text-foreground/70">Demo Mode</span>
        <span className="hidden sm:inline">
          — Viewing sample data from Booking Product Area, Q1 2026
        </span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={disableDemoMode}
        className="h-6 px-2 text-muted-foreground hover:text-foreground"
      >
        <X className="w-4 h-4 mr-1" />
        <span className="hidden sm:inline">Exit demo</span>
      </Button>
    </div>
  );
}
