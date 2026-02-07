import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users } from 'lucide-react';

export function SettingsPage() {
  const { 
    teams, 
    selectedTeamId, 
    getTeam, 
    updateTeamCadence,
    currentPM 
  } = useApp();

  const currentTeam = getTeam(selectedTeamId);

  return (
    <div className="space-y-6 animate-fade-in max-w-xl">
      {/* Header */}
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="helper-text mt-1">
          Manage team preferences and check-in cadence
        </p>
      </div>

      {/* Current User */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            Current User
          </CardTitle>
          <CardDescription className="text-xs">
            You are logged in as the PM for prototype purposes
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">{currentPM}</p>
              <p className="text-xs text-muted-foreground">Product Manager</p>
            </div>
            <Badge variant="secondary" className="text-xs">PM Role</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Team Settings */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            Check-in Cadence
          </CardTitle>
          <CardDescription className="text-xs">
            Set how often your team submits OKR check-ins
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          {currentTeam && (
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Cadence for {currentTeam.name}
              </Label>
              <Select 
                value={currentTeam.cadence} 
                onValueChange={(value: 'weekly' | 'biweekly') => updateTeamCadence(currentTeam.id, value)}
              >
                <SelectTrigger className="w-44 bg-background h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="biweekly">Bi-weekly (default)</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
              <p className="helper-text">
                {currentTeam.cadence === 'weekly' 
                  ? 'Check-ins are expected every 7 days'
                  : 'Check-ins are expected every 14 days'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Teams */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">All Teams</CardTitle>
          <CardDescription className="text-xs">
            Overview of all teams and their designated PMs
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {teams.map((team) => (
              <div 
                key={team.id} 
                className="flex items-center justify-between p-3 border border-border/60 rounded-lg"
              >
                <div>
                  <p className="font-medium text-sm">{team.name}</p>
                  <p className="text-xs text-muted-foreground">PM: {team.pmName}</p>
                </div>
                <Badge variant="outline" className="text-xs">{team.cadence}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
