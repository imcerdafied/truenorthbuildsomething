import { useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, Building2, Menu, X, ChevronDown, Settings, LogOut } from 'lucide-react';
import { formatQuarter } from '@/types';
import { cn } from '@/lib/utils';

function getInitials(name: string | null | undefined, email: string | null | undefined): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  if (email?.trim()) {
    return email.slice(0, 2).toUpperCase();
  }
  return '?';
}

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
  const navigate = useNavigate();
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

  const { profile, isAdmin, role, signOut } = useAuth();

  // Teams the user can access: admins see all; PMs see only teams where they are the PM
  const visibleTeams = useMemo(() => {
    if (isAdmin) return teams;
    const pmName = profile?.full_name ?? '';
    return teams.filter(t => (t.pmName || '').trim() === (pmName || '').trim());
  }, [teams, isAdmin, profile?.full_name]);

  // Get current team and domain for context
  const currentTeam = teams.find(t => t.id === selectedTeamId);
  const currentDomain = domains.find(d => d.id === currentTeam?.domainId);

  // Members only see Team view — ensure we never leave them in Admin (exec) view
  useEffect(() => {
    if (!isAdmin && viewMode === 'exec') {
      setViewMode('team');
    }
  }, [isAdmin, viewMode, setViewMode]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth', { replace: true });
  };

  const displayName = profile?.full_name || currentPM || 'User';
  const initials = getInitials(profile?.full_name ?? null, profile?.email ?? null);

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

        {/* Team Selector (visible in team view only; never render with empty value) */}
        {viewMode === 'team' && (visibleTeams.length > 0 || (isAdmin && teams.length > 0)) && (
          <Select
            value={selectedTeamId || 'all'}
            onValueChange={(v) => setSelectedTeamId(v === 'all' ? '' : v)}
          >
            <SelectTrigger className="w-44 bg-background h-8 text-sm">
              <SelectValue placeholder="Select team" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              {isAdmin && (
                <SelectItem value="all">
                  All teams
                </SelectItem>
              )}
              {visibleTeams.filter(t => t.id).map(team => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* View Mode Toggle - only for admins; members see Team view only */}
        {isAdmin && (
          <div className="flex items-center bg-muted rounded-md p-0.5">
            <Button
              variant={viewMode === 'team' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('team')}
              className={cn(
                "gap-1 sm:gap-1.5 h-7 px-2 sm:px-3 text-xs",
                viewMode === 'team' ? "text-foreground font-semibold" : "text-muted-foreground"
              )}
            >
              <Users className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Team</span>
            </Button>
            <Button
              variant={viewMode === 'exec' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('exec')}
              className={cn(
                "gap-1 sm:gap-1.5 h-7 px-2 sm:px-3 text-xs",
                viewMode === 'exec' ? "text-foreground font-semibold" : "text-muted-foreground"
              )}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Admin</span>
            </Button>
          </div>
        )}

        {/* User avatar dropdown - hidden on small screens */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground border-l pl-3 cursor-pointer hover:opacity-80 focus:outline-none focus:ring-0 focus:ring-ring focus:ring-offset-2 rounded"
            >
              <Avatar className="h-8 w-8 rounded-full border border-border">
                <AvatarFallback className="bg-muted text-sm font-medium text-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium text-foreground">{displayName}</span>
              <span className="text-border">·</span>
              <span>{role === 'admin' ? 'Admin' : 'PM'}</span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 bg-white dark:bg-card border rounded-lg shadow-lg py-1"
          >
            <DropdownMenuLabel className="px-4 py-2 font-normal">
              <div className="flex flex-col gap-0.5">
                <span className="font-medium text-foreground">{displayName}</span>
                {profile?.email && (
                  <span className="text-xs text-muted-foreground truncate">{profile.email}</span>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled className="px-4 py-2 text-sm text-muted-foreground cursor-default">
              My preferences
              <span className="ml-2 text-xs opacity-70">Coming soon</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {isAdmin && (
              <>
                <DropdownMenuItem
                  className="px-4 py-2 text-sm cursor-pointer"
                  onClick={() => navigate('/settings')}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Organization Setup
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem
              className="px-4 py-2 text-sm cursor-pointer"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
