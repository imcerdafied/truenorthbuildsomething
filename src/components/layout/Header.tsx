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
import { Users, Building2, Menu, X } from 'lucide-react';
import { formatQuarter } from '@/types';

const quarters = [
  '2026-Q1',
  '2025-Q4',
  '2025-Q3',
  '2025-Q2',
  '2025-Q1',
];

interface HeaderProps {
  mobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
}

export function Header({ mobileMenuOpen, onToggleMobileMenu }: HeaderProps) {
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
    <header className="h-14 border-b bg-card flex items-center justify-between px-3 sm:px-5">
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile menu toggle */}
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden h-8 w-8 p-0"
          onClick={onToggleMobileMenu}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>

        {/* Quarter Selector */}
        <Select value={currentQuarter} onValueChange={setCurrentQuarter}>
          <SelectTrigger className="w-24 sm:w-28 bg-background h-8 text-sm">
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
        {viewMode === 'team' && teams.length > 0 && (
          <div className="relative">
            <div className="flex items-center gap-1.5">
              <Select value={selectedTeamId || teams[0]?.id} onValueChange={setSelectedTeamId}>
                <SelectTrigger className="w-44 bg-background h-8 text-sm">
                  <SelectValue placeholder="Select team" />
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
            {currentTeam && currentDomain && (
              <p className="absolute top-full left-1 text-[10px] text-muted-foreground mt-0.5 whitespace-nowrap">
                {currentTeam.name} within {currentDomain.name}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* View Mode Toggle */}
        <div className="flex items-center bg-muted rounded-md p-0.5">
          <Button
            variant={viewMode === 'team' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('team')}
            className="gap-1 sm:gap-1.5 h-7 px-2 sm:px-3 text-xs"
          >
            <Users className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Team</span>
          </Button>
          <Button
            variant={viewMode === 'exec' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('exec')}
            className="gap-1 sm:gap-1.5 h-7 px-2 sm:px-3 text-xs"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exec</span>
          </Button>
        </div>

        {/* Current User - hidden on small screens */}
        <div className="hidden sm:block text-xs text-muted-foreground border-l pl-3">
          <span className="font-medium text-foreground">{profile?.full_name || currentPM}</span>
          <span className="mx-1.5 text-border">·</span>
          <span>PM</span>
        </div>
      </div>
    </header>
  );
}
