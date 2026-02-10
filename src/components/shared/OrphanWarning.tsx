import { Target } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function OrphanWarning() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="orphan-warning cursor-help">
            <Target className="w-3 h-3" />
            <span>Top-level</span>
          </span>
        </TooltipTrigger>
        <TooltipContent className="bg-popover border">
          <p className="text-sm">This is a top-level objective — it represents a primary business outcome.</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
