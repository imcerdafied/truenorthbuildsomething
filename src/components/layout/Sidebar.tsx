import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { 
  Home, 
  Target, 
  Download,
  Settings,
  Info,
  Users,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';

const primaryNav = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/okrs', icon: Target, label: 'Outcomes' },
];

const secondaryNavAdmin = [
  { to: '/team-review', icon: Users, label: 'Team Review' },
  { to: '/exports', icon: Download, label: 'Exports' },
  { to: '/about', icon: Info, label: 'About TrueNorthOS' },
  { to: '/settings', icon: Settings, label: 'Organization Setup' },
];

const secondaryNavMember = [
  { to: '/team-review', icon: Users, label: 'Team Review' },
  { to: '/exports', icon: Download, label: 'Exports' },
  { to: '/about', icon: Info, label: 'About TrueNorthOS' },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const { isAdmin } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const secondaryNav = useMemo(
    () => (isAdmin ? secondaryNavAdmin : secondaryNavMember),
    [isAdmin]
  );

  const handleNavClick = () => {
    if (onNavigate) {
      onNavigate();
    }
  };

  return (
    <aside 
      className={cn(
        "flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-200 h-full",
        collapsed ? "w-16" : "w-52"
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-14 px-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-sidebar-accent flex items-center justify-center">
              <Target className="w-4 h-4 text-sidebar-primary" />
            </div>
            <span className="font-semibold text-sidebar-primary text-base tracking-tight">
              TrueNorthOS
            </span>
          </div>
        )}
        {collapsed && (
          <div className="w-7 h-7 rounded-md bg-sidebar-accent flex items-center justify-center mx-auto">
            <Target className="w-4 h-4 text-sidebar-primary" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-0.5">
        {primaryNav.map((item) => {
          const isActive = location.pathname === item.to ||
            (item.to !== '/' && location.pathname.startsWith(item.to));
          return (
            <NavLink key={item.to} to={item.to} onClick={handleNavClick}
              className={cn(
                "flex flex-row items-center gap-3 px-3 py-2 rounded-md text-sm text-[hsl(0,0%,70%)]",
                isActive && "bg-[hsl(220,15%,16%)] text-white font-medium"
              )}>
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}

        {/* Divider */}
        <div className="!my-3 border-t border-sidebar-border" />

        {secondaryNav.map((item) => {
          const isActive = location.pathname === item.to ||
            (item.to !== '/' && location.pathname.startsWith(item.to));
          return (
            <NavLink key={item.to} to={item.to} onClick={handleNavClick}
              className={cn(
                "flex flex-row items-center gap-3 px-3 py-2 rounded-md text-sm text-[hsl(0,0%,70%)]",
                isActive && "bg-[hsl(220,15%,16%)] text-white font-medium"
              )}>
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse toggle - hidden on mobile */}
      <div className="p-2 border-t border-sidebar-border hidden lg:block">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full text-sidebar-foreground hover:text-sidebar-primary hover:bg-sidebar-accent h-8"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 mr-2" />
              <span className="text-xs">Collapse</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
