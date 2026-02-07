import { AlertCircle } from 'lucide-react';
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
            <AlertCircle className="w-3 h-3" />
            <span>Not linked</span>
          </span>
        </TooltipTrigger>
        <TooltipContent className="bg-popover">
          <p className="text-sm">This OKR is not linked to a parent outcome</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
