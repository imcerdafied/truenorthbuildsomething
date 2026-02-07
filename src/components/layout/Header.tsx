import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Users, Building2 } from 'lucide-react';
import { formatQuarter } from '@/types';

const quarters = [
  '2026-Q1',
  '2025-Q4',
  '2025-Q3',
  '2025-Q2',
  '2025-Q1',
];

export function Header() {
  const { 
    viewMode, 
    setViewMode, 
    currentQuarter, 
    setCurrentQuarter,
    teams,
    domains,
    selectedTeamId,
    setSelectedTeamId,
    currentPM
  } = useApp();

  const { profile } = useAuth();

  // Get current team and domain for context
  const currentTeam = teams.find(t => t.id === selectedTeamId);
  const currentDomain = domains.find(d => d.id === currentTeam?.domainId);

  return (
    <header className="h-14 border-b bg-card flex items-center justify-between px-5">
      <div className="flex items-center gap-3">
        {/* Quarter Selector */}
        <Select value={currentQuarter} onValueChange={setCurrentQuarter}>
          <SelectTrigger className="w-28 bg-background h-8 text-sm">
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

        {/* Team Selector (visible in team view) */}
        {viewMode === 'team' && (
          <div className="flex flex-col">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                      <SelectTrigger className="w-44 bg-background h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        {teams.map(team => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="text-xs">
                    Scopes reflect your product operating model. OKRs are created within teams, domains, and product areas.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {currentTeam && currentDomain && (
              <p className="text-[10px] text-muted-foreground mt-0.5 ml-1">
                {currentTeam.name} within {currentDomain.name}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* View Mode Toggle */}
        <div className="flex items-center bg-muted rounded-md p-0.5">
          <Button
            variant={viewMode === 'team' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('team')}
            className="gap-1.5 h-7 px-3 text-xs"
          >
            <Users className="w-3.5 h-3.5" />
            Team
          </Button>
          <Button
            variant={viewMode === 'exec' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('exec')}
            className="gap-1.5 h-7 px-3 text-xs"
          >
            <Building2 className="w-3.5 h-3.5" />
            Exec
          </Button>
        </div>

        {/* Current User */}
        <div className="text-xs text-muted-foreground border-l pl-3">
          <span className="font-medium text-foreground">{profile?.full_name || currentPM}</span>
          <span className="mx-1.5 text-border">·</span>
          <span>PM</span>
        </div>
      </div>
    </header>
  );
}
