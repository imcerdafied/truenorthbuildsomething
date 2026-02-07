import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, LogOut } from 'lucide-react';
import { OrganizationStructure } from '@/components/settings/OrganizationStructure';

export function SettingsPage() {
  const { 
    teams, 
    selectedTeamId, 
    getTeam, 
    updateTeamCadence,
    currentPM 
  } = useApp();
  
  const { user, profile, role, signOut, organization } = useAuth();

  const currentTeam = getTeam(selectedTeamId);

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="helper-text mt-1">
          Manage your account, team preferences, and organization structure
        </p>
      </div>

      {/* Current User */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            Your Account
          </CardTitle>
          <CardDescription className="text-xs">
            {organization?.name ? `Member of ${organization.name}` : 'Your account details'}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">{profile?.full_name || user?.email}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <Badge variant="secondary" className="text-xs capitalize">
              {role || 'Member'}
            </Badge>
          </div>
          <Button variant="outline" size="sm" onClick={handleSignOut} className="gap-2">
            <LogOut className="w-4 h-4" />
            Sign out
          </Button>
        </CardContent>
      </Card>

      {/* Organization Structure */}
      <OrganizationStructure />

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
