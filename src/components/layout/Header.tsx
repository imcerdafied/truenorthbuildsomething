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
  '2024-Q4',
  '2024-Q3',
  '2024-Q2',
  '2024-Q1',
  '2025-Q1',
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
    <header className="h-16 border-b bg-card flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        {/* Quarter Selector */}
        <Select value={currentQuarter} onValueChange={setCurrentQuarter}>
          <SelectTrigger className="w-32 bg-background">
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
            <SelectTrigger className="w-48 bg-background">
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

      <div className="flex items-center gap-4">
        {/* View Mode Toggle */}
        <div className="flex items-center bg-secondary rounded-lg p-1">
          <Button
            variant={viewMode === 'team' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('team')}
            className="gap-2"
          >
            <Users className="w-4 h-4" />
            Team view
          </Button>
          <Button
            variant={viewMode === 'exec' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('exec')}
            className="gap-2"
          >
            <Building2 className="w-4 h-4" />
            Exec view
          </Button>
        </div>

        {/* Current User */}
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{currentPM}</span>
          <span className="mx-2">·</span>
          <span>PM</span>
        </div>
      </div>
    </header>
  );
}
