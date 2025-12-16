import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard,
  FileText,
  Users,
  AlertTriangle,
  History,
  LogOut,
  Shield,
  ChevronLeft,
  ChevronRight,
  Key,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/sop', icon: FileText, label: 'SOPs' },
  { path: '/roster', icon: Users, label: 'Roster' },
  { path: '/incidents/new', icon: AlertTriangle, label: 'New Incident' },
  { path: '/incidents', icon: History, label: 'Incident History' },
  { path: '/roles', icon: Shield, label: 'Role Management', requiresHighCommand: true },
  { path: '/invitations', icon: Key, label: 'Invitation Codes', requiresHighCommand: true },
];

const roleLabels: Record<string, string> = {
  patrol: 'Patrol',
  ftd: 'FTD',
  high_command: 'High Command',
};

const roleColors: Record<string, string> = {
  patrol: 'bg-secondary text-foreground',
  ftd: 'bg-police-blue text-primary-foreground',
  high_command: 'bg-police-gold text-background',
};

export default function Sidebar() {
  const { profile, role, signOut, canManageRoles } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const visibleNavItems = navItems.filter(item => 
    !item.requiresHighCommand || canManageRoles
  );

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full bg-card border-r border-border flex flex-col transition-all duration-300 z-50',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 police-gradient rounded-lg flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="font-bold text-foreground truncate">MDT</h1>
              <p className="text-xs text-muted-foreground truncate">Law Enforcement</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {visibleNavItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== '/' && location.pathname.startsWith(item.path));
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                'hover:bg-secondary',
                isActive && 'bg-primary/10 text-primary border border-primary/20'
              )}
            >
              <item.icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-primary')} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-2 border-t border-border">
        {!collapsed && profile && (
          <div className="px-3 py-2 mb-2">
            <p className="font-medium text-sm truncate">
              {profile.first_name} {profile.last_name}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {profile.badge_number} • {profile.rank}
            </p>
            {role && (
              <Badge className={cn('mt-1', roleColors[role] || roleColors.patrol)}>
                {roleLabels[role] || role}
              </Badge>
            )}
          </div>
        )}
        
        <Button
          variant="ghost"
          className={cn('w-full justify-start gap-3', collapsed && 'justify-center')}
          onClick={signOut}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </Button>
      </div>

      {/* Collapse toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-card border border-border"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </Button>
    </aside>
  );
}
