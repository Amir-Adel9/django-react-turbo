import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@/shared/lib/zod-resolver';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/shared/api/helpers';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { EyeIcon, EyeOffIcon, InfoIcon, Loader2Icon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { loginSchema, type LoginFormValues } from '../schemas/login.schema';
import { useAuth } from '@/shared/hooks/use-auth';

const DEMO_EMAIL = 'admin@example.com';
const DEMO_PASSWORD = 'admin123!';

function DemoCredential({
  value,
  onFill,
}: {
  value: string;
  onFill: (value: string) => void;
}) {
  const handleClick = () => {
    onFill(value);
    void navigator.clipboard.writeText(value);
    toast.success('Filled');
  };
  return (
    <code
      role='button'
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      className='cursor-pointer rounded bg-primary/10 px-1 py-0.5 font-mono text-[11px] transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-primary/50'
    >
      {value}
    </code>
  );
}

export interface LoginViewProps {
  from?: string;
  onSuccess?: () => void;
}

export function LoginView({ onSuccess }: LoginViewProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  function handleFillCredential(value: string) {
    if (value === DEMO_EMAIL)
      setValue('email', value, { shouldValidate: true });
    else if (value === DEMO_PASSWORD)
      setValue('password', value, { shouldValidate: true });
  }

  async function onSubmit(data: LoginFormValues) {
    setSubmitError(null);
    try {
      await login(data.email, data.password);
      onSuccess?.();
    } catch (err: unknown) {
      setSubmitError(await extractErrorMessage(err, 'Login failed'));
    }
  }

  return (
    <Card className='w-full max-w-[400px] shadow-sm'>
      <CardHeader className='text-center'>
        <CardTitle className='text-2xl font-semibold tracking-tight'>
          Welcome back
        </CardTitle>
        <CardDescription>Sign in to your account</CardDescription>
      </CardHeader>
      <form noValidate onSubmit={handleSubmit(onSubmit)}>
        <CardContent className='space-y-5'>
          <div className='flex items-start gap-3 rounded-lg border border-primary/10 bg-primary/5 p-3'>
            <InfoIcon className='mt-0.5 h-4 w-4 shrink-0 text-primary/70' />
            <div className='space-y-0.5 text-xs'>
              <p className='font-medium text-foreground'>Demo credentials</p>
              <p className='text-muted-foreground'>
                <DemoCredential
                  value={DEMO_EMAIL}
                  onFill={handleFillCredential}
                />
                {' / '}
                <DemoCredential
                  value={DEMO_PASSWORD}
                  onFill={handleFillCredential}
                />
              </p>
            </div>
          </div>
          <div className='space-y-2'>
            <Label
              htmlFor='login-email'
              className={cn(!!errors.email && 'text-destructive')}
            >
              Email
            </Label>
            <Input
              id='login-email'
              type='text'
              inputMode='email'
              autoComplete='email'
              placeholder='you@example.com'
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'login-email-error' : undefined}
              className={cn(
                !!errors.email &&
                  'border-destructive ring-2 ring-destructive/20',
              )}
              {...register('email')}
            />
            {errors.email && (
              <p
                id='login-email-error'
                role='alert'
                className='text-sm font-medium text-destructive'
              >
                {errors.email.message}
              </p>
            )}
          </div>
          <div className='space-y-2'>
            <Label
              htmlFor='login-password'
              className={cn(!!errors.password && 'text-destructive')}
            >
              Password
            </Label>
            <div className='relative'>
              <Input
                id='login-password'
                type={showPassword ? 'text' : 'password'}
                autoComplete='current-password'
                placeholder='Enter your password'
                aria-invalid={!!errors.password}
                aria-describedby={
                  errors.password ? 'login-password-error' : undefined
                }
                className={cn(
                  'pr-10',
                  !!errors.password &&
                    'border-destructive ring-2 ring-destructive/20',
                )}
                {...register('password')}
              />
              <button
                type='button'
                onClick={() => setShowPassword((p) => !p)}
                className='absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded p-1 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring'
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOffIcon className='h-4 w-4' />
                ) : (
                  <EyeIcon className='h-4 w-4' />
                )}
              </button>
            </div>
            {errors.password && (
              <p
                id='login-password-error'
                role='alert'
                className='text-sm font-medium text-destructive'
              >
                {errors.password.message}
              </p>
            )}
          </div>
          {submitError && (
            <p role='alert' className='text-sm font-medium text-destructive'>
              {submitError}
            </p>
          )}
        </CardContent>
        <CardFooter className='justify-center flex-col gap-4 pt-6'>
          <Button type='submit' className='w-full' disabled={isSubmitting}>
            {isSubmitting && <Loader2Icon className='h-4 w-4 animate-spin' />}
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </Button>
          <p className='text-center text-sm text-muted-foreground'>
            Don&apos;t have an account?{' '}
            <Link
              to='/register'
              className='font-medium text-primary underline underline-offset-4 hover:text-primary/80'
            >
              Register
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
