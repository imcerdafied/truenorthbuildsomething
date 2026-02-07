import { useDemoMode } from '@/hooks/useDemoMode';
import { Button } from '@/components/ui/button';
import { Play, X } from 'lucide-react';

export function DemoBanner() {
  const { isDemoMode, disableDemoMode } = useDemoMode();

  if (!isDemoMode) return null;

  return (
    <div className="bg-primary text-primary-foreground px-4 py-2 flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <Play className="w-4 h-4" />
        <span className="font-medium">Demo Mode</span>
        <span className="hidden sm:inline text-primary-foreground/80">
          — Viewing sample data from Booking Product Area, Q1 2026
        </span>
      </div>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={disableDemoMode}
        className="h-6 px-2 text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground"
      >
        <X className="w-4 h-4 mr-1" />
        <span className="hidden sm:inline">Exit demo</span>
      </Button>
    </div>
  );
}
