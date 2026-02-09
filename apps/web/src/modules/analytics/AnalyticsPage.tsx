import { useState, useMemo } from 'react';
import { useGetTaskListQuery } from '@/shared/api/tasks.api';
import { useGetStatsQuery } from '@/shared/api/tasks.api';
import { downloadTasksExport } from '@/shared/api/export-tasks';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { DatePicker } from '@/shared/components/ui/date-picker';
import { Skeleton } from '@/components/ui/skeleton';
import { FileDown } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

function toISO(date: Date | undefined, endOfDay = false): string {
  if (!date) return '';
  if (Number.isNaN(date.getTime())) return '';
  const d = new Date(date);
  if (endOfDay) {
    d.setHours(23, 59, 59, 999);
  }
  return d.toISOString().slice(0, 19).replace('T', 'T');
}

export function AnalyticsPage() {
  const [from, setFrom] = useState<Date | undefined>(undefined);
  const [to, setTo] = useState<Date | undefined>(undefined);
  const [status, setStatus] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const fromISO = useMemo(() => toISO(from), [from]);
  const toISOVal = useMemo(() => toISO(to, true), [to]);

  const listParams = useMemo(
    () => ({
      limit: 1,
      page: 1,
      ...(fromISO ? { created_after: fromISO } : {}),
      ...(toISOVal ? { created_before: toISOVal } : {}),
      ...(status ? { status } : {}),
    }),
    [fromISO, toISOVal, status],
  );

  const { data: listData, isLoading: listLoading } =
    useGetTaskListQuery(listParams);
  const { data: stats, isLoading: statsLoading } = useGetStatsQuery();

  const countInRange = listData?.count ?? 0;
  const isLoading = listLoading;

  async function handleExport() {
    setExportError(null);
    setExporting(true);
    try {
      await downloadTasksExport({
        from: fromISO || undefined,
        to: toISOVal || undefined,
        status: status || undefined,
      });
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Download failed.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className='w-full space-y-6'>
      <h2 className='text-lg font-semibold text-foreground'>
        Analytics & Reports
      </h2>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Optional date range and status for export and summary.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='grid gap-2'>
              <Label htmlFor='analytics-from'>From</Label>
              <DatePicker
                id='analytics-from'
                date={from}
                onDateChange={setFrom}
                placeholder='Pick a start date'
                aria-label='From date'
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='analytics-to'>To</Label>
              <DatePicker
                id='analytics-to'
                date={to}
                onDateChange={setTo}
                placeholder='Pick an end date'
                aria-label='To date'
              />
            </div>
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='analytics-status'>Status</Label>
            <Select
              value={status || 'all'}
              onValueChange={(v) => setStatus(v === 'all' ? '' : v)}
            >
              <SelectTrigger id='analytics-status'>
                <SelectValue placeholder='All statuses' />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem
                    key={opt.value || 'all'}
                    value={opt.value || 'all'}
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
          <CardDescription>Task counts for selected filters.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && <Skeleton className='h-16 w-full' aria-busy='true' />}
          {!isLoading && (
            <p
              className='text-2xl font-semibold tabular-nums'
              aria-live='polite'
            >
              {countInRange} task{countInRange !== 1 ? 's' : ''} in range
            </p>
          )}
          {!statsLoading && stats && (
            <p className='mt-2 text-sm text-muted-foreground tabular-nums'>
              Total: {stats.total} · Completed: {stats.completed} · Pending:{' '}
              {stats.pending}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Export</CardTitle>
          <CardDescription>
            Download tasks as Excel (.xlsx) for the selected filters.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => void handleExport()}
            disabled={exporting}
            aria-label='Download Excel export'
          >
            <FileDown className='mr-2 size-4' aria-hidden />
            {exporting ? 'Preparing…' : 'Download Excel'}
          </Button>
          {exportError && (
            <p className='mt-2 text-sm text-destructive' role='alert'>
              {exportError}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
