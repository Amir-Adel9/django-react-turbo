import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  useGetTaskListQuery,
  useDeleteTaskMutation,
  useUpdateTaskMutation,
} from '@/shared/api/tasks.api';
import type { Task, TaskStatus } from '@/shared/api/api.types';
import { useDebounce } from '@/shared/hooks/use-debounce';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog';
import { Badge } from '@/shared/components/ui/badge';
import { DatePicker } from '@/shared/components/ui/date-picker';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/shared/lib/utils';
import {
  PlusCircle,
  Pencil,
  Trash2,
  Search,
  ListTodo,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { TaskEditForm } from './components/TaskEditForm';

const PAGE_SIZE = 10;
const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

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

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(
    new Date(iso),
  );
}

function toISO(date: Date | undefined, endOfDay = false): string {
  if (!date) return '';
  if (Number.isNaN(date.getTime())) return '';
  const d = new Date(date);
  if (endOfDay) {
    d.setHours(23, 59, 59, 999);
  }
  return d.toISOString().slice(0, 19).replace('T', 'T');
}

export function TasksPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editTask, setEditTask] = useState<Task | null>(null);

  const debouncedSearch = useDebounce(searchInput, 300);

  const fromISO = useMemo(() => toISO(fromDate), [fromDate]);
  const toISOVal = useMemo(() => toISO(toDate, true), [toDate]);

  const params = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(status ? { status } : {}),
      ...(fromISO ? { created_after: fromISO } : {}),
      ...(toISOVal ? { created_before: toISOVal } : {}),
    }),
    [page, debouncedSearch, status, fromISO, toISOVal],
  );

  const { data, isLoading, isError, error } = useGetTaskListQuery(params);
  const [deleteTask, { isLoading: isDeleting }] = useDeleteTaskMutation();
  const [updateTask] = useUpdateTaskMutation();

  const handleDeleteConfirm = useCallback(async () => {
    if (deleteId == null) return;
    try {
      await deleteTask(deleteId).unwrap();
      toast.success('Task deleted successfully');
      setDeleteId(null);
    } catch (err) {
      // Error handling is done by RTK Query
    }
  }, [deleteId, deleteTask]);

  const handleEditSubmit = useCallback(
    async (payload: {
      title?: string;
      description?: string;
      status?: TaskStatus;
    }) => {
      if (editTask == null) return;
      try {
        await updateTask({ id: editTask.id, body: payload }).unwrap();
        toast.success('Task updated successfully');
        setEditTask(null);
      } catch (err) {
        // Error handling is done by RTK Query
      }
    },
    [editTask, updateTask],
  );

  const totalPages =
    data?.count != null ? Math.ceil(data.count / PAGE_SIZE) : 0;
  const hasNext = data?.next != null;
  const hasPrev = data?.previous != null;

  return (
    <div className='flex w-full flex-1 flex-col gap-4'>
      {/* ── Header row ── */}
      <div className='flex items-center justify-between gap-3'>
        <h2 className='text-lg font-semibold tracking-tight'>My Tasks</h2>
        <Button size='sm' asChild className='cursor-pointer'>
          <Link to='/tasks/create'>
            <PlusCircle className='mr-1.5 size-3.5' aria-hidden />
            Create Task
          </Link>
        </Button>
      </div>

      {/* ── Filters ── */}
      <div className='space-y-3'>
        {/* Top row: Search + Status */}
        <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
          <div className='relative flex-1'>
            <Search className='pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground' />
            <label htmlFor='tasks-search' className='sr-only'>
              Search tasks
            </label>
            <Input
              id='tasks-search'
              type='search'
              placeholder='Search tasks...'
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setPage(1);
              }}
              className='h-9 pl-9 text-sm'
              autoComplete='off'
            />
          </div>
          <label htmlFor='tasks-status' className='sr-only'>
            Filter by status
          </label>
          <Select
            value={status || 'all'}
            onValueChange={(v) => {
              setStatus(v === 'all' ? '' : v);
              setPage(1);
            }}
          >
            <SelectTrigger
              id='tasks-status'
              className='h-9 w-full text-sm sm:w-40'
            >
              <SelectValue placeholder='All' />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value || 'all'} value={opt.value || 'all'}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Bottom row: Date Range */}
        <div className='flex flex-col gap-2 sm:flex-row sm:items-end'>
          <div className='grid gap-2 flex-1 sm:grid-cols-2'>
            <div className='grid gap-1.5'>
              <Label htmlFor='tasks-from-date' className='text-xs'>
                From Date
              </Label>
              <DatePicker
                id='tasks-from-date'
                date={fromDate}
                onDateChange={(date) => {
                  setFromDate(date);
                  setPage(1);
                }}
                placeholder='Start date'
                aria-label='Filter tasks from date'
                className='h-9 text-sm'
              />
            </div>
            <div className='grid gap-1.5'>
              <Label htmlFor='tasks-to-date' className='text-xs'>
                To Date
              </Label>
              <DatePicker
                id='tasks-to-date'
                date={toDate}
                onDateChange={(date) => {
                  setToDate(date);
                  setPage(1);
                }}
                placeholder='End date'
                aria-label='Filter tasks to date'
                className='h-9 text-sm'
              />
            </div>
          </div>
          {(fromDate || toDate) && (
            <Button
              type='button'
              variant='outline'
              size='sm'
              className='h-9 cursor-pointer'
              onClick={() => {
                setFromDate(undefined);
                setToDate(undefined);
                setPage(1);
              }}
              aria-label='Clear date filters'
            >
              <X className='mr-1.5 size-3.5' aria-hidden />
              Clear dates
            </Button>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div className='rounded-xl border bg-card'>
        {/* Loading */}
        {isLoading && (
          <div className='divide-y' aria-busy='true'>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className='flex items-center gap-3 px-3 py-2'>
                <Skeleton className='size-1.5 rounded-full' />
                <Skeleton className='h-3.5 flex-1 max-w-52' />
                <Skeleton className='h-5 w-16 rounded-full' />
                <Skeleton className='h-3 w-16' />
                <Skeleton className='size-7 rounded-md' />
                <Skeleton className='size-7 rounded-md' />
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className='px-4 py-4'>
            <p className='text-sm text-destructive' role='alert'>
              {error && typeof error === 'object' && 'data' in error
                ? String(
                    (error as { data?: { detail?: string } }).data?.detail ??
                      'Failed to load tasks.',
                  )
                : 'Failed to load tasks.'}
            </p>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !isError && data && data.results.length === 0 && (
          <div className='flex flex-col items-center justify-center py-12 px-4'>
            <ListTodo className='size-8 text-muted-foreground/30' aria-hidden />
            <p className='mt-3 text-sm font-medium text-muted-foreground'>
              {debouncedSearch || status || fromDate || toDate
                ? 'No tasks match your filters'
                : 'No tasks yet'}
            </p>
            <p className='mt-0.5 text-xs text-muted-foreground/70'>
              {debouncedSearch || status || fromDate || toDate
                ? 'Try adjusting your filters.'
                : 'Create your first task to get started.'}
            </p>
            {!debouncedSearch && !status && !fromDate && !toDate && (
              <Button
                asChild
                size='sm'
                variant='outline'
                className='mt-4 cursor-pointer'
              >
                <Link to='/tasks/create'>
                  <PlusCircle className='mr-1.5 size-3.5' aria-hidden />
                  Create Task
                </Link>
              </Button>
            )}
          </div>
        )}

        {/* Task rows */}
        {!isLoading && !isError && data && data.results.length > 0 && (
          <>
            {/* Desktop table */}
            <div className='hidden md:block'>
              <table className='w-full text-sm'>
                <thead className='border-b bg-muted/50 text-xs text-muted-foreground'>
                  <tr>
                    <th className='py-2 pl-4 pr-2 text-left font-medium'>
                      Title
                    </th>
                    <th className='px-2 py-2 text-left font-medium'>
                      Description
                    </th>
                    <th className='px-2 py-2 text-left font-medium'>Status</th>
                    <th className='px-2 py-2 text-left font-medium'>Created</th>
                    <th className='py-2 pl-2 pr-4 text-right font-medium'>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y'>
                  {data.results.map((task) => {
                    const cfg =
                      statusCfg[task.status ?? 'pending'] ?? statusCfg.pending;
                    return (
                      <tr
                        key={task.id}
                        className='transition-colors hover:bg-muted/30'
                      >
                        <td className='max-w-[220px] truncate py-2 pl-4 pr-2 font-medium'>
                          {task.title}
                        </td>
                        <td className='max-w-[260px] truncate px-2 py-2 text-muted-foreground'>
                          {task.description || (
                            <span className='text-muted-foreground/40 italic'>
                              --
                            </span>
                          )}
                        </td>
                        <td className='px-2 py-2'>
                          <Badge
                            variant='outline'
                            className={cn(
                              'gap-1.5 text-[10px] font-medium',
                              cfg.badge,
                            )}
                          >
                            <span
                              className={cn(
                                'inline-block size-1.5 rounded-full',
                                cfg.dot,
                              )}
                            />
                            {cfg.label}
                          </Badge>
                        </td>
                        <td className='whitespace-nowrap px-2 py-2 text-xs tabular-nums text-muted-foreground'>
                          {formatDate(task.created_at)}
                        </td>
                        <td className='py-2 pl-2 pr-4 text-right'>
                          <div className='inline-flex items-center gap-0.5'>
                            <Button
                              type='button'
                              variant='ghost'
                              size='icon'
                              className='size-7 cursor-pointer'
                              aria-label={`Edit ${task.title}`}
                              onClick={() => setEditTask(task)}
                            >
                              <Pencil className='size-3.5' aria-hidden />
                            </Button>
                            <Button
                              type='button'
                              variant='ghost'
                              size='icon'
                              className='size-7 cursor-pointer text-destructive hover:text-destructive'
                              aria-label={`Delete ${task.title}`}
                              onClick={() => setDeleteId(task.id)}
                            >
                              <Trash2 className='size-3.5' aria-hidden />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile list */}
            <div className='divide-y md:hidden'>
              {data.results.map((task) => {
                const cfg =
                  statusCfg[task.status ?? 'pending'] ?? statusCfg.pending;
                return (
                  <div
                    key={task.id}
                    className='flex items-start gap-2.5 px-3 py-2'
                  >
                    <span
                      className={cn(
                        'mt-1.5 size-1.5 shrink-0 rounded-full',
                        cfg.dot,
                      )}
                    />
                    <div className='min-w-0 flex-1'>
                      <p className='text-sm font-medium leading-tight'>
                        {task.title}
                      </p>
                      <div className='mt-1 flex items-center gap-2'>
                        <Badge
                          variant='outline'
                          className={cn(
                            'gap-1 text-[10px] font-medium',
                            cfg.badge,
                          )}
                        >
                          <span
                            className={cn(
                              'inline-block size-1.5 rounded-full',
                              cfg.dot,
                            )}
                          />
                          {cfg.label}
                        </Badge>
                        <span className='text-[10px] tabular-nums text-muted-foreground'>
                          {formatDate(task.created_at)}
                        </span>
                      </div>
                    </div>
                    <div className='flex shrink-0 items-center gap-0.5'>
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        className='size-7 cursor-pointer'
                        aria-label={`Edit ${task.title}`}
                        onClick={() => setEditTask(task)}
                      >
                        <Pencil className='size-3.5' aria-hidden />
                      </Button>
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        className='size-7 cursor-pointer text-destructive hover:text-destructive'
                        aria-label={`Delete ${task.title}`}
                        onClick={() => setDeleteId(task.id)}
                      >
                        <Trash2 className='size-3.5' aria-hidden />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className='flex items-center justify-between border-t px-4 py-2'>
                <p className='text-[11px] tabular-nums text-muted-foreground'>
                  {(page - 1) * PAGE_SIZE + 1}–
                  {Math.min(page * PAGE_SIZE, data.count ?? 0)} of {data.count}
                </p>
                <div className='flex items-center gap-1'>
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    className='size-7 cursor-pointer'
                    disabled={!hasPrev}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    aria-label='Previous page'
                  >
                    <ChevronLeft className='size-4' aria-hidden />
                  </Button>
                  <span className='px-1.5 text-xs tabular-nums text-muted-foreground'>
                    {page} / {totalPages}
                  </span>
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    className='size-7 cursor-pointer'
                    disabled={!hasNext}
                    onClick={() => setPage((p) => p + 1)}
                    aria-label='Next page'
                  >
                    <ChevronRight className='size-4' aria-hidden />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Delete Dialog ── */}
      <AlertDialog
        open={deleteId != null}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete task?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleDeleteConfirm();
              }}
              disabled={isDeleting}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Edit Dialog ── */}
      {editTask && (
        <TaskEditForm
          task={editTask}
          onClose={() => setEditTask(null)}
          onSubmit={handleEditSubmit}
        />
      )}
    </div>
  );
}
