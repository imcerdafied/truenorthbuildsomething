import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
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
    <div className="space-y-6 animate-fade-in max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="helper-text mt-1">
          Manage team preferences and check-in cadence
        </p>
      </div>

      {/* Current User */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-4 h-4" />
            Current User
          </CardTitle>
          <CardDescription>
            You are logged in as the PM for prototype purposes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{currentPM}</p>
              <p className="text-sm text-muted-foreground">Product Manager</p>
            </div>
            <Badge variant="secondary">PM Role</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Team Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Check-in Cadence
          </CardTitle>
          <CardDescription>
            Set how often your team submits OKR check-ins
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentTeam && (
            <div className="space-y-2">
              <Label>Cadence for {currentTeam.name}</Label>
              <Select 
                value={currentTeam.cadence} 
                onValueChange={(value: 'weekly' | 'biweekly') => updateTeamCadence(currentTeam.id, value)}
              >
                <SelectTrigger className="w-48 bg-background">
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
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Teams</CardTitle>
          <CardDescription>
            Overview of all teams and their designated PMs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {teams.map((team) => (
              <div 
                key={team.id} 
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{team.name}</p>
                  <p className="text-sm text-muted-foreground">PM: {team.pmName}</p>
                </div>
                <Badge variant="outline">{team.cadence}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
