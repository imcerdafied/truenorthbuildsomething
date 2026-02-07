import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useDemoMode } from '@/hooks/useDemoMode';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, LogOut, Play, ExternalLink } from 'lucide-react';
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
  const { isDemoMode, toggleDemoMode } = useDemoMode();

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

      {/* Demo Mode */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Play className="w-4 h-4 text-primary" />
            Demo Mode
          </CardTitle>
          <CardDescription className="text-xs">
            Enable demo mode to showcase TrueNorth with fully populated sample data
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="demo-mode" className="text-sm font-medium">
                Demo Mode {isDemoMode && <Badge variant="default" className="ml-2 text-xs">Active</Badge>}
              </Label>
              <p className="text-xs text-muted-foreground">
                {isDemoMode 
                  ? 'Showing sample data from the Booking product area with 3 teams' 
                  : 'Switch to demo mode to see TrueNorth in action'}
              </p>
            </div>
            <Switch 
              id="demo-mode" 
              checked={isDemoMode}
              onCheckedChange={toggleDemoMode}
            />
          </div>
          
          {!isDemoMode && (
            <div className="flex items-center gap-2 pt-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={() => window.open(`${window.location.origin}?demo=true`, '_blank')}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open demo in new tab
              </Button>
            </div>
          )}
          
          {isDemoMode && (
            <div className="bg-background/50 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
              <p><strong>Demo scenario:</strong> Booking Product Area — Q1 2026</p>
              <p>• <strong>Search team:</strong> On track, high confidence</p>
              <p>• <strong>Booking Experience:</strong> Mixed, recovering from mid-quarter dip</p>
              <p>• <strong>Payments:</strong> At risk due to vendor dependencies</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current User - only show when not in demo mode */}
      {!isDemoMode && (
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
      )}

      {/* Organization Structure - only show when not in demo mode */}
      {!isDemoMode && <OrganizationStructure />}

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
