import { Outlet } from 'react-router-dom';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { AppBreadcrumbs } from './AppBreadcrumbs';

export function AppLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className='bg-muted/30 p-2'>
        <header className='flex h-16 shrink-0 items-center gap-2 rounded-2xl border border-border/60 bg-card/80 px-4 shadow-sm backdrop-blur'>
          <SidebarTrigger className='-ml-1' aria-label='Toggle sidebar' />
          <AppBreadcrumbs />
        </header>
        <div className='mt-2 flex min-h-0 flex-1 flex-col'>
          <div className='flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden rounded-2xl border border-border/50 bg-background px-4 py-4 shadow-sm sm:px-5'>
            <Outlet />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
