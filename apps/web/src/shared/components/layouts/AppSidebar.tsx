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
  useSidebar,
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

  // Exact match
  if (pathname === to) return true;

  // Check if this route is a parent of another nav item
  // If so, only match exactly (not with prefix matching)
  const isParentOfAnotherRoute = navItems.some(
    (item) => item.to !== to && item.to.startsWith(to + '/'),
  );

  // If this route is a parent of another route, only match exactly
  if (isParentOfAnotherRoute) {
    return pathname === to;
  }

  // Otherwise, allow prefix matching for routes that aren't parents
  return pathname.startsWith(to + '/');
}

export function AppSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile, setOpenMobile } = useSidebar();
  const displayName = user?.name ?? user?.email ?? 'Guest';
  const email = user?.email ?? '';
  const initials =
    user?.name
      ?.split(' ')
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase())
      .slice(0, 2)
      .join('') ??
    email?.[0]?.toUpperCase() ??
    '?';

  function handleNavigate(to: string) {
    navigate(to);
    // Close sidebar on mobile after navigation
    if (isMobile) {
      setOpenMobile(false);
    }
  }

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
    // Close sidebar on mobile after logout
    if (isMobile) {
      setOpenMobile(false);
    }
  }

  return (
    <Sidebar variant='floating'>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size='lg'
              className='hover:bg-sidebar-accent/60 cursor-default'
            >
              <div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary-foreground/15 text-sidebar-foreground font-bold text-sm'>
                D
              </div>
              <div className='flex flex-col gap-0.5 leading-none'>
                <span className='font-semibold text-sidebar-foreground'>
                  DigiSay
                </span>
                <span className='text-sidebar-foreground/60 text-xs'>
                  Task Manager
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className='text-sidebar-foreground/50 uppercase tracking-wider text-[0.65rem] font-semibold'>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className='gap-1'>
              {navItems.map(({ to, label, icon: Icon }) => (
                <SidebarMenuItem key={to}>
                  <SidebarMenuButton
                    size='default'
                    className='cursor-pointer h-10'
                    isActive={isActivePath(location.pathname, to)}
                    onClick={() => handleNavigate(to)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleNavigate(to);
                      }
                    }}
                  >
                    <Icon className='size-4 shrink-0' aria-hidden />
                    <span>{label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className='rounded-xl bg-sidebar-primary-foreground/10 p-3'>
          <div className='flex items-center gap-3'>
            <div className='flex size-9 items-center justify-center rounded-full bg-sidebar-primary-foreground/20 text-sidebar-foreground text-xs font-semibold'>
              {initials}
            </div>
            <div className='min-w-0 flex-1'>
              <p className='truncate text-sm font-medium text-sidebar-foreground'>
                {displayName}
              </p>
              {email && (
                <p
                  className='truncate text-xs text-sidebar-foreground/60'
                  title={email}
                >
                  {email}
                </p>
              )}
            </div>
          </div>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className='cursor-pointer h-10'
              onClick={() => void handleLogout()}
              aria-label='Log out'
            >
              <LogOut className='size-4 shrink-0' aria-hidden />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
