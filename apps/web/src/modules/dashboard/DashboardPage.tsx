import { Link } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { useAuth } from '@/shared/hooks/use-auth';
import { useGetStatsQuery, useGetTaskListQuery } from '@/shared/api/tasks.api';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/shared/lib/utils';
import {
  ListTodo,
  CheckCircle2,
  Clock,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  BarChart3,
} from 'lucide-react';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(
    new Date(iso),
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(iso);
}

const statusCfg: Record<string, { label: string; dot: string; badge: string }> =
  {
    pending: {
      label: 'Pending',
      dot: 'bg-amber-500',
      badge:
        'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/25',
    },
    in_progress: {
      label: 'In Progress',
      dot: 'bg-blue-500',
      badge:
        'bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/25',
    },
    completed: {
      label: 'Completed',
      dot: 'bg-emerald-500',
      badge:
        'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/25',
    },
  };

export function DashboardPage() {
  const { user } = useAuth();
  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
  } = useGetStatsQuery();
  const { data: recentData, isLoading: tasksLoading } = useGetTaskListQuery({
    page: 1,
    limit: 7,
  });

  const completionRate =
    stats && stats.total > 0
      ? Math.round((stats.completed / stats.total) * 100)
      : 0;

  const firstName =
    user?.name?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'there';

  return (
    <div className='flex w-full min-w-0 flex-1 flex-col gap-5 overflow-x-hidden'>
      {/* ── Top bar: greeting + actions ── */}
      <div className='flex min-w-0 items-center justify-between gap-4'>
        <div className='min-w-0 flex-1'>
          <h1 className='text-lg font-semibold tracking-tight truncate'>
            {getGreeting()}, {firstName}
          </h1>
          <p className='text-xs text-muted-foreground truncate'>
            Here's what's happening with your tasks today.
          </p>
        </div>
        <div className='flex shrink-0 items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            asChild
            className='cursor-pointer hidden sm:inline-flex'
          >
            <Link to='/tasks'>
              <ListTodo className='mr-1.5 size-3.5' aria-hidden />
              All Tasks
            </Link>
          </Button>
          <Button size='sm' asChild className='cursor-pointer'>
            <Link to='/tasks/create'>
              <PlusCircle className='mr-1.5 size-3.5' aria-hidden />
              New Task
            </Link>
          </Button>
        </div>
      </div>

      {/* ── Stats strip ── */}
      {statsLoading ? (
        <div className='grid min-w-0 grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4'>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className='flex min-w-0 items-center gap-2 rounded-xl border bg-card px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3'
            >
              <Skeleton className='size-9 shrink-0 rounded-lg' />
              <div className='min-w-0 space-y-1.5'>
                <Skeleton className='h-3 w-14' />
                <Skeleton className='h-5 w-8' />
              </div>
            </div>
          ))}
        </div>
      ) : statsError ? (
        <div className='rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3'>
          <p className='text-sm text-destructive'>Failed to load statistics.</p>
        </div>
      ) : stats ? (
        <div className='grid min-w-0 grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4'>
          <div className='flex min-w-0 items-center gap-2 rounded-xl border bg-card px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3'>
            <div className='flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10'>
              <ListTodo className='size-4 text-primary' aria-hidden />
            </div>
            <div className='min-w-0'>
              <p className='text-[11px] font-medium uppercase tracking-wider text-muted-foreground truncate'>
                Total
              </p>
              <p className='text-xl font-bold tabular-nums leading-tight truncate'>
                {stats.total}
              </p>
            </div>
          </div>

          <div className='flex min-w-0 items-center gap-2 rounded-xl border bg-card px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3'>
            <div className='flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10'>
              <CheckCircle2
                className='size-4 text-emerald-600 dark:text-emerald-400'
                aria-hidden
              />
            </div>
            <div className='min-w-0'>
              <p className='text-[11px] font-medium uppercase tracking-wider text-muted-foreground truncate'>
                Done
              </p>
              <p className='text-xl font-bold tabular-nums leading-tight truncate'>
                {stats.completed}
              </p>
            </div>
          </div>

          <div className='flex min-w-0 items-center gap-2 rounded-xl border bg-card px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3'>
            <div className='flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10'>
              <Clock
                className='size-4 text-amber-600 dark:text-amber-400'
                aria-hidden
              />
            </div>
            <div className='min-w-0'>
              <p className='text-[11px] font-medium uppercase tracking-wider text-muted-foreground truncate'>
                Pending
              </p>
              <p className='text-xl font-bold tabular-nums leading-tight truncate'>
                {stats.pending}
              </p>
            </div>
          </div>

          <div className='flex min-w-0 items-center gap-2 rounded-xl border bg-card px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3'>
            <div className='flex size-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10'>
              <TrendingUp
                className='size-4 text-violet-600 dark:text-violet-400'
                aria-hidden
              />
            </div>
            <div className='min-w-0 flex-1'>
              <p className='text-[11px] font-medium uppercase tracking-wider text-muted-foreground truncate'>
                Progress
              </p>
              <div className='flex min-w-0 items-center gap-1.5 sm:gap-2'>
                <p className='text-xl font-bold tabular-nums leading-tight shrink-0'>
                  {completionRate}%
                </p>
                <div className='hidden h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted sm:block'>
                  <div
                    className='h-full rounded-full bg-violet-500 transition-all duration-500'
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Main content: Recent Tasks + Sidebar ── */}
      <div className='grid min-w-0 gap-4 lg:grid-cols-3'>
        {/* Recent Tasks (takes 2/3) */}
        <div className='min-w-0 rounded-xl border bg-card lg:col-span-2'>
          <div className='flex min-w-0 items-center justify-between gap-2 border-b px-3 py-2 sm:px-4'>
            <h2 className='text-sm font-semibold truncate'>Recent Tasks</h2>
            <Button
              variant='ghost'
              size='sm'
              asChild
              className='h-6 shrink-0 cursor-pointer px-2 text-xs'
            >
              <Link to='/tasks'>
                View all <ArrowRight className='ml-1 size-3' aria-hidden />
              </Link>
            </Button>
          </div>

          <div>
            {tasksLoading ? (
              <div className='divide-y'>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className='flex items-center gap-2.5 px-3 py-2'>
                    <Skeleton className='size-1.5 rounded-full' />
                    <Skeleton className='h-3.5 flex-1 max-w-48' />
                    <Skeleton className='h-4 w-14 rounded-full' />
                    <Skeleton className='h-3 w-10' />
                  </div>
                ))}
              </div>
            ) : !recentData?.results?.length ? (
              <div className='flex flex-col items-center justify-center py-8 px-4'>
                <ListTodo
                  className='size-6 text-muted-foreground/40'
                  aria-hidden
                />
                <p className='mt-2 text-xs text-muted-foreground'>
                  No tasks yet
                </p>
                <Button
                  asChild
                  size='sm'
                  variant='outline'
                  className='mt-2 h-7 cursor-pointer text-xs'
                >
                  <Link to='/tasks/create'>Create your first task</Link>
                </Button>
              </div>
            ) : (
              <div className='divide-y'>
                {recentData.results.map((task) => {
                  const cfg =
                    statusCfg[task.status ?? 'pending'] ?? statusCfg.pending;
                  return (
                    <div
                      key={task.id}
                      className='flex items-center gap-2.5 px-3 py-2 transition-colors hover:bg-muted/40'
                    >
                      <span
                        className={cn(
                          'size-1.5 shrink-0 rounded-full',
                          cfg.dot,
                        )}
                      />
                      <div className='min-w-0 flex-1'>
                        <p className='truncate text-sm font-medium leading-tight'>
                          {task.title}
                        </p>
                        {task.description && (
                          <p className='truncate text-xs text-muted-foreground'>
                            {task.description}
                          </p>
                        )}
                      </div>
                      <Badge
                        variant='outline'
                        className={cn(
                          'shrink-0 text-[10px] font-medium',
                          cfg.badge,
                        )}
                      >
                        {cfg.label}
                      </Badge>
                      <span className='shrink-0 text-[10px] tabular-nums text-muted-foreground'>
                        {timeAgo(task.created_at)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div className='flex flex-col gap-4'>
          {/* Progress ring */}
          {stats && stats.total > 0 && (
            <div className='rounded-xl border bg-card p-4'>
              <p className='mb-3 text-sm font-semibold'>Task Breakdown</p>
              <div className='space-y-2.5'>
                {[
                  {
                    label: 'Completed',
                    count: stats.completed,
                    pct:
                      stats.total > 0
                        ? Math.round((stats.completed / stats.total) * 100)
                        : 0,
                    color: 'bg-emerald-500',
                    track: 'bg-emerald-500/15',
                  },
                  {
                    label: 'Pending',
                    count: stats.pending,
                    pct:
                      stats.total > 0
                        ? Math.round((stats.pending / stats.total) * 100)
                        : 0,
                    color: 'bg-amber-500',
                    track: 'bg-amber-500/15',
                  },
                  {
                    label: 'In Progress',
                    count: stats.total - stats.completed - stats.pending,
                    pct:
                      stats.total > 0
                        ? Math.round(
                            ((stats.total - stats.completed - stats.pending) /
                              stats.total) *
                              100,
                          )
                        : 0,
                    color: 'bg-blue-500',
                    track: 'bg-blue-500/15',
                  },
                ].map((item) => (
                  <div key={item.label}>
                    <div className='mb-1 flex items-center justify-between text-xs'>
                      <span className='text-muted-foreground'>
                        {item.label}
                      </span>
                      <span className='font-medium tabular-nums'>
                        {item.count}{' '}
                        <span className='text-muted-foreground'>
                          ({item.pct}%)
                        </span>
                      </span>
                    </div>
                    <div
                      className={cn(
                        'h-1.5 w-full overflow-hidden rounded-full',
                        item.track,
                      )}
                    >
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-500',
                          item.color,
                        )}
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick links */}
          <div className='rounded-xl border bg-card p-4'>
            <p className='mb-3 text-sm font-semibold'>Quick Links</p>
            <nav className='space-y-1'>
              {[
                {
                  to: '/tasks/create',
                  label: 'Create Task',
                  sub: 'Single or bulk',
                  icon: PlusCircle,
                  iconColor: 'text-primary',
                },
                {
                  to: '/tasks',
                  label: 'My Tasks',
                  sub: 'Search & manage',
                  icon: ListTodo,
                  iconColor: 'text-blue-600 dark:text-blue-400',
                },
                {
                  to: '/analytics',
                  label: 'Analytics',
                  sub: 'Reports & export',
                  icon: BarChart3,
                  iconColor: 'text-violet-600 dark:text-violet-400',
                },
              ].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className='flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors hover:bg-muted/60'
                >
                  <item.icon
                    className={cn('size-4 shrink-0', item.iconColor)}
                    aria-hidden
                  />
                  <div className='min-w-0 flex-1'>
                    <p className='text-sm font-medium leading-tight'>
                      {item.label}
                    </p>
                    <p className='text-[11px] text-muted-foreground'>
                      {item.sub}
                    </p>
                  </div>
                  <ArrowRight
                    className='size-3 text-muted-foreground/50'
                    aria-hidden
                  />
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}
