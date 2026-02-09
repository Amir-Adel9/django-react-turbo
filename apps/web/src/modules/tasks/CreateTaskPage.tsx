import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useCreateTaskMutation,
  useBulkCreateTasksMutation,
  useBulkCreateTasksFromCsvMutation,
} from '@/shared/api/tasks.api';
import type { TaskBulkItemRequest, TaskStatus } from '@/shared/api/api.types';
import { extractErrorMessage } from '@/shared/api/helpers';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  PlusCircle,
  Trash2,
  Upload,
  FileText,
  Braces,
  Table2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_OPTIONS: TaskStatus[] = ['pending', 'in_progress', 'completed'];

function formatStatus(status: TaskStatus): string {
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

const emptyRow = (): TaskBulkItemRequest => ({
  title: '',
  description: '',
  status: 'pending',
});

type BulkMode = 'manual' | 'csv' | 'json';

const BULK_MODES: {
  value: BulkMode;
  label: string;
  icon: React.ReactNode;
  desc: string;
}[] = [
  {
    value: 'manual',
    label: 'Manual',
    icon: <Table2 className='size-4' />,
    desc: 'Add rows manually',
  },
  {
    value: 'csv',
    label: 'CSV',
    icon: <FileText className='size-4' />,
    desc: 'Upload a .csv file',
  },
  {
    value: 'json',
    label: 'JSON',
    icon: <Braces className='size-4' />,
    desc: 'Paste JSON data',
  },
];

export function CreateTaskPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'single' | 'bulk'>('single');
  const [bulkMode, setBulkMode] = useState<BulkMode>('manual');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Single
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('pending');
  const [singleError, setSingleError] = useState<string | null>(null);
  const [createTask, { isLoading: creating }] = useCreateTaskMutation();

  // Bulk - Manual
  const [rows, setRows] = useState<TaskBulkItemRequest[]>([emptyRow()]);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkCreate, { isLoading: bulkCreating }] =
    useBulkCreateTasksMutation();

  // Bulk - CSV
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [bulkCreateFromCsv, { isLoading: csvCreating }] =
    useBulkCreateTasksFromCsvMutation();

  // Bulk - JSON
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  async function handleSingleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSingleError(null);
    const t = title.trim();
    if (!t) {
      setSingleError('Title is required.');
      return;
    }
    try {
      await createTask({
        title: t,
        description: description.trim() || undefined,
        status,
      }).unwrap();
      toast.success('Task created successfully');
      navigate('/tasks');
    } catch (err) {
      const message = await extractErrorMessage(err, 'Failed to create task.');
      setSingleError(message);
    }
  }

  function addBulkRow() {
    setRows((r) => [...r, emptyRow()]);
  }

  function removeBulkRow(i: number) {
    setRows((r) => (r.length <= 1 ? r : r.filter((_, idx) => idx !== i)));
  }

  function updateBulkRow(
    i: number,
    field: keyof TaskBulkItemRequest,
    value: string,
  ) {
    setRows((r) => {
      const next = [...r];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  }

  async function handleBulkSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBulkError(null);
    const valid = rows
      .map((r) => ({ ...r, title: r.title.trim() }))
      .filter((r) => r.title.length > 0);
    if (valid.length === 0) {
      setBulkError('Add at least one task with a title.');
      return;
    }
    try {
      const result = await bulkCreate(valid).unwrap();
      toast.success(`Successfully created ${result.length} task${result.length === 1 ? '' : 's'}`);
      navigate('/tasks');
    } catch (err) {
      const message = await extractErrorMessage(err, 'Failed to create tasks.');
      setBulkError(message);
    }
  }

  async function handleCsvSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCsvError(null);
    if (!csvFile) {
      setCsvError('Please select a CSV file.');
      return;
    }
    try {
      const result = await bulkCreateFromCsv(csvFile).unwrap();
      toast.success(`Successfully imported ${result.length} task${result.length === 1 ? '' : 's'} from CSV`);
      navigate('/tasks');
    } catch (err) {
      const message = await extractErrorMessage(err, 'Failed to import CSV.');
      setCsvError(message);
    }
  }

  async function handleJsonSubmit(e: React.FormEvent) {
    e.preventDefault();
    setJsonError(null);
    const trimmed = jsonText.trim();
    if (!trimmed) {
      setJsonError('Please paste or enter JSON data.');
      return;
    }
    try {
      const parsed = JSON.parse(trimmed);
      if (!Array.isArray(parsed)) {
        setJsonError('JSON must be an array of task objects.');
        return;
      }
      const valid = parsed
        .map((item: any) => ({
          title: String(item.title || '').trim(),
          description: item.description ? String(item.description).trim() : '',
          status:
            item.status && STATUS_OPTIONS.includes(item.status)
              ? item.status
              : 'pending',
        }))
        .filter((item: any) => item.title.length > 0);
      if (valid.length === 0) {
        setJsonError('At least one task with a title is required.');
        return;
      }
      const result = await bulkCreate(valid).unwrap();
      toast.success(`Successfully imported ${result.length} task${result.length === 1 ? '' : 's'} from JSON`);
      navigate('/tasks');
    } catch (err) {
      if (err instanceof SyntaxError) {
        setJsonError('Invalid JSON format.');
      } else {
        const message = await extractErrorMessage(
          err,
          'Failed to import JSON.',
        );
        setJsonError(message);
      }
    }
  }

  const isLoading = bulkCreating || csvCreating;

  return (
    <div className='w-full space-y-6'>
      <h2 className='text-lg font-semibold text-foreground'>Create Task</h2>

      <Tabs value={tab} onValueChange={(v) => setTab(v as 'single' | 'bulk')}>
        <TabsList className='w-fit'>
          <TabsTrigger value='single'>Single</TabsTrigger>
          <TabsTrigger value='bulk'>Bulk</TabsTrigger>
        </TabsList>

        {/* ── Single ── */}
        <TabsContent value='single'>
          <Card>
            <CardHeader>
              <CardTitle>New Task</CardTitle>
              <CardDescription>Add one task.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSingleSubmit} className='space-y-4'>
                <div className='grid gap-2'>
                  <Label htmlFor='single-title'>Title</Label>
                  <Input
                    id='single-title'
                    name='title'
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder='Task title…'
                    autoComplete='off'
                    aria-invalid={!!singleError}
                  />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='single-description'>Description</Label>
                  <Textarea
                    id='single-description'
                    name='description'
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder='Optional description…'
                    rows={3}
                    autoComplete='off'
                  />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='single-status'>Status</Label>
                  <Select
                    value={status}
                    onValueChange={(v) => setStatus(v as TaskStatus)}
                  >
                    <SelectTrigger id='single-status'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {formatStatus(s)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {singleError && (
                  <p className='text-sm text-destructive' role='alert'>
                    {singleError}
                  </p>
                )}
                <Button type='submit' disabled={creating}>
                  {creating ? 'Creating…' : 'Create Task'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Bulk ── */}
        <TabsContent value='bulk'>
          <Card>
            <CardHeader>
              <CardTitle>Bulk Create</CardTitle>
              <CardDescription>
                Add multiple tasks at once — manually, via CSV, or JSON.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-5'>
              {/* Mode picker */}
              <div className='grid grid-cols-3 gap-3'>
                {BULK_MODES.map((m) => (
                  <button
                    key={m.value}
                    type='button'
                    onClick={() => setBulkMode(m.value)}
                    className={cn(
                      'group relative flex flex-col items-center gap-1.5 rounded-xl border px-4 py-3 text-center transition-all cursor-pointer',
                      'hover:border-foreground/20 hover:bg-accent/50',
                      bulkMode === m.value
                        ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20'
                        : 'border-border bg-card',
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-8 items-center justify-center rounded-lg transition-colors',
                        bulkMode === m.value
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground group-hover:text-foreground',
                      )}
                    >
                      {m.icon}
                    </span>
                    <span
                      className={cn(
                        'text-sm font-medium leading-none',
                        bulkMode === m.value
                          ? 'text-foreground'
                          : 'text-muted-foreground group-hover:text-foreground',
                      )}
                    >
                      {m.label}
                    </span>
                    <span className='text-[11px] leading-tight text-muted-foreground'>
                      {m.desc}
                    </span>
                  </button>
                ))}
              </div>

              {/* ── Manual entry ── */}
              {bulkMode === 'manual' && (
                <form onSubmit={handleBulkSubmit} className='space-y-4'>
                  <div className='space-y-2'>
                    <div className='flex justify-between items-center'>
                      <Label>Tasks</Label>
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={addBulkRow}
                        aria-label='Add row'
                      >
                        <PlusCircle className='mr-1 size-4' aria-hidden />
                        Add row
                      </Button>
                    </div>
                    <div className='rounded-2xl border overflow-x-auto'>
                      <table className='w-full text-sm'>
                        <thead>
                          <tr className='border-b bg-muted/50'>
                            <th className='p-2 text-left font-medium'>Title</th>
                            <th className='hidden p-2 text-left font-medium sm:table-cell'>
                              Description
                            </th>
                            <th className='p-2 text-left font-medium w-28'>
                              Status
                            </th>
                            <th className='w-10' />
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((row, i) => (
                            <tr key={i} className='border-b last:border-0'>
                              <td className='p-2'>
                                <Input
                                  value={row.title}
                                  onChange={(e) =>
                                    updateBulkRow(i, 'title', e.target.value)
                                  }
                                  placeholder='Title…'
                                  className='h-8'
                                  autoComplete='off'
                                />
                              </td>
                              <td className='hidden p-2 sm:table-cell'>
                                <Input
                                  value={row.description}
                                  onChange={(e) =>
                                    updateBulkRow(
                                      i,
                                      'description',
                                      e.target.value,
                                    )
                                  }
                                  placeholder='Optional…'
                                  className='h-8'
                                  autoComplete='off'
                                />
                              </td>
                              <td className='p-2'>
                                <Select
                                  value={row.status}
                                  onValueChange={(v) =>
                                    updateBulkRow(i, 'status', v)
                                  }
                                >
                                  <SelectTrigger className='h-8'>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {STATUS_OPTIONS.map((s) => (
                                      <SelectItem key={s} value={s}>
                                        {formatStatus(s)}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className='p-2'>
                                <Button
                                  type='button'
                                  variant='ghost'
                                  size='icon'
                                  className='h-8 w-8 cursor-pointer text-destructive'
                                  aria-label={`Remove row ${i + 1}`}
                                  onClick={() => removeBulkRow(i)}
                                  disabled={rows.length === 1}
                                >
                                  <Trash2 className='size-4' aria-hidden />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  {bulkError && (
                    <p className='text-sm text-destructive' role='alert'>
                      {bulkError}
                    </p>
                  )}
                  <Button type='submit' disabled={isLoading}>
                    {isLoading ? 'Creating…' : 'Create All'}
                  </Button>
                </form>
              )}

              {/* ── CSV import ── */}
              {bulkMode === 'csv' && (
                <form onSubmit={handleCsvSubmit} className='space-y-4'>
                  <div
                    className='flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/30 px-6 py-8 text-center transition-colors hover:border-muted-foreground/40 cursor-pointer'
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className='flex size-12 items-center justify-center rounded-full bg-muted'>
                      <Upload className='size-5 text-muted-foreground' />
                    </div>
                    {csvFile ? (
                      <>
                        <p className='text-sm font-medium text-foreground'>
                          {csvFile.name}
                        </p>
                        <p className='text-xs text-muted-foreground'>
                          Click to replace
                        </p>
                      </>
                    ) : (
                      <>
                        <p className='text-sm font-medium text-foreground'>
                          Click to upload CSV
                        </p>
                        <p className='text-xs text-muted-foreground'>
                          .csv files only
                        </p>
                      </>
                    )}
                    <input
                      type='file'
                      accept='.csv,text/csv'
                      ref={fileInputRef}
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setCsvFile(file);
                        setCsvError(null);
                      }}
                      className='sr-only'
                    />
                  </div>
                  <p className='text-xs text-muted-foreground'>
                    Columns:{' '}
                    <code className='rounded bg-muted px-1 py-0.5'>title</code>{' '}
                    (required),{' '}
                    <code className='rounded bg-muted px-1 py-0.5'>
                      description
                    </code>
                    ,{' '}
                    <code className='rounded bg-muted px-1 py-0.5'>status</code>{' '}
                    <span className='text-muted-foreground/70'>
                      (pending | in_progress | completed)
                    </span>
                  </p>
                  {csvError && (
                    <p className='text-sm text-destructive' role='alert'>
                      {csvError}
                    </p>
                  )}
                  <Button type='submit' disabled={isLoading || !csvFile}>
                    {isLoading ? 'Importing…' : 'Import CSV'}
                  </Button>
                </form>
              )}

              {/* ── JSON import ── */}
              {bulkMode === 'json' && (
                <form onSubmit={handleJsonSubmit} className='space-y-4'>
                  <div className='grid gap-2'>
                    <Label htmlFor='json-text'>JSON Array</Label>
                    <Textarea
                      id='json-text'
                      value={jsonText}
                      onChange={(e) => {
                        setJsonText(e.target.value);
                        setJsonError(null);
                      }}
                      placeholder={`[\n  { "title": "Design landing page", "status": "pending" },\n  { "title": "Write API docs", "description": "Cover all endpoints" }\n]`}
                      rows={10}
                      className='font-mono text-sm'
                      autoComplete='off'
                    />
                  </div>
                  <p className='text-xs text-muted-foreground'>
                    Each object requires{' '}
                    <code className='rounded bg-muted px-1 py-0.5'>title</code>.
                    Optional:{' '}
                    <code className='rounded bg-muted px-1 py-0.5'>
                      description
                    </code>
                    ,{' '}
                    <code className='rounded bg-muted px-1 py-0.5'>status</code>{' '}
                    <span className='text-muted-foreground/70'>
                      (pending | in_progress | completed)
                    </span>
                  </p>
                  {jsonError && (
                    <p className='text-sm text-destructive' role='alert'>
                      {jsonError}
                    </p>
                  )}
                  <Button
                    type='submit'
                    disabled={isLoading || !jsonText.trim()}
                  >
                    {isLoading ? 'Importing…' : 'Import JSON'}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
