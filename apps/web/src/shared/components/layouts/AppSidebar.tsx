import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ListTodo,
  PlusCircle,
  BarChart3,
  LogOut,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useAuth } from '@/shared/hooks/use-auth';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/tasks', label: 'My Tasks', icon: ListTodo },
  { to: '/tasks/create', label: 'Create Task', icon: PlusCircle },
  { to: '/analytics', label: 'Analytics & Reports', icon: BarChart3 },
] as const;

function isActivePath(pathname: string, to: string) {
  if (to === '/') return pathname === '/';
  return pathname === to || pathname.startsWith(to + '/');
}

export function AppSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex flex-col gap-1 px-2 py-2">
          <span className="text-sm font-semibold text-sidebar-foreground">
            Task Manager
          </span>
          {user && (
            <span className="truncate text-xs text-muted-foreground" title={user.email}>
              {user.email}
            </span>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map(({ to, label, icon: Icon }) => (
                <SidebarMenuItem key={to}>
                  <SidebarMenuButton
                    isActive={isActivePath(location.pathname, to)}
                    onClick={() => navigate(to)}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span>{label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => void handleLogout()}>
              <LogOut className="size-4 shrink-0" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
