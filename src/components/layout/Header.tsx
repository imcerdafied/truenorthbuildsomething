import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Users, Building2 } from 'lucide-react';
import { formatQuarter } from '@/types';

const quarters = [
  '2025-Q1',
  '2024-Q4',
  '2024-Q3',
  '2024-Q2',
  '2024-Q1',
];

export function Header() {
  const { 
    viewMode, 
    setViewMode, 
    currentQuarter, 
    setCurrentQuarter,
    teams,
    selectedTeamId,
    setSelectedTeamId,
    currentPM
  } = useApp();

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
          <span className="font-medium text-foreground">{currentPM}</span>
          <span className="mx-1.5 text-border">·</span>
          <span>PM</span>
        </div>
      </div>
    </header>
  );
}
