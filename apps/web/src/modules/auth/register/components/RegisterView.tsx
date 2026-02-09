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
import { EyeIcon, EyeOffIcon, Loader2Icon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import {
  registerSchema,
  type RegisterFormValues,
} from '../schemas/register.schema';
import { useAuth } from '@/shared/hooks/use-auth';

export interface RegisterViewProps {
  onSuccess?: () => void;
}

export function RegisterView({ onSuccess }: RegisterViewProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { register: registerUser } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      name: '',
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(data: RegisterFormValues) {
    setSubmitError(null);
    try {
      await registerUser(
        data.email,
        data.name,
        data.password,
        data.confirmPassword,
      );
      toast.success('Account created. Please sign in.');
      onSuccess?.();
    } catch (err: unknown) {
      setSubmitError(await extractErrorMessage(err, 'Registration failed'));
    }
  }

  return (
    <Card className='w-full max-w-[400px] shadow-sm'>
      <CardHeader className='text-center'>
        <CardTitle className='text-2xl font-semibold tracking-tight'>
          Create an account
        </CardTitle>
        <CardDescription>Enter your details to get started</CardDescription>
      </CardHeader>
      <form
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        onChange={() => submitError != null && setSubmitError(null)}
      >
        <CardContent className='space-y-5'>
          <div className='space-y-2'>
            <Label
              htmlFor='register-email'
              className={cn(!!errors.email && 'text-destructive')}
            >
              Email
            </Label>
            <Input
              id='register-email'
              type='text'
              inputMode='email'
              autoComplete='email'
              placeholder='you@example.com'
              aria-invalid={!!errors.email}
              aria-describedby={
                errors.email ? 'register-email-error' : undefined
              }
              className={cn(
                !!errors.email &&
                  'border-destructive ring-2 ring-destructive/20',
              )}
              {...register('email')}
            />
            {errors.email && (
              <p
                id='register-email-error'
                role='alert'
                className='text-sm font-medium text-destructive'
              >
                {errors.email.message}
              </p>
            )}
          </div>
          <div className='space-y-2'>
            <Label
              htmlFor='register-name'
              className={cn(!!errors.name && 'text-destructive')}
            >
              Name
            </Label>
            <Input
              id='register-name'
              type='text'
              autoComplete='name'
              placeholder='John Doe'
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'register-name-error' : undefined}
              className={cn(
                !!errors.name &&
                  'border-destructive ring-2 ring-destructive/20',
              )}
              {...register('name')}
            />
            {errors.name && (
              <p
                id='register-name-error'
                role='alert'
                className='text-sm font-medium text-destructive'
              >
                {errors.name.message}
              </p>
            )}
          </div>
          <div className='space-y-2'>
            <Label
              htmlFor='register-password'
              className={cn(!!errors.password && 'text-destructive')}
            >
              Password
            </Label>
            <div className='relative'>
              <Input
                id='register-password'
                type={showPassword ? 'text' : 'password'}
                autoComplete='new-password'
                placeholder='Enter your password'
                aria-invalid={!!errors.password}
                aria-describedby={
                  errors.password ? 'register-password-error' : undefined
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
                id='register-password-error'
                role='alert'
                className='text-sm font-medium text-destructive'
              >
                {errors.password.message}
              </p>
            )}
          </div>
          <div className='space-y-2'>
            <Label
              htmlFor='register-confirm'
              className={cn(!!errors.confirmPassword && 'text-destructive')}
            >
              Confirm password
            </Label>
            <div className='relative'>
              <Input
                id='register-confirm'
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete='new-password'
                placeholder='Re-enter your password'
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={
                  errors.confirmPassword ? 'register-confirm-error' : undefined
                }
                className={cn(
                  'pr-10',
                  !!errors.confirmPassword &&
                    'border-destructive ring-2 ring-destructive/20',
                )}
                {...register('confirmPassword')}
              />
              <button
                type='button'
                onClick={() => setShowConfirmPassword((p) => !p)}
                className='absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded p-1 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring'
                aria-label={
                  showConfirmPassword ? 'Hide password' : 'Show password'
                }
              >
                {showConfirmPassword ? (
                  <EyeOffIcon className='h-4 w-4' />
                ) : (
                  <EyeIcon className='h-4 w-4' />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p
                id='register-confirm-error'
                role='alert'
                className='text-sm font-medium text-destructive'
              >
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
          {submitError && (
            <p
              role='alert'
              className='text-sm font-medium text-destructive capitalize'
            >
              {submitError}
            </p>
          )}
        </CardContent>
        <CardFooter className='justify-center flex-col gap-4 pt-6'>
          <Button type='submit' className='w-full' disabled={isSubmitting}>
            {isSubmitting && <Loader2Icon className='h-4 w-4 animate-spin' />}
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </Button>
          <p className='text-center text-sm text-muted-foreground'>
            Already have an account?{' '}
            <Link
              to='/login'
              className='font-medium text-primary underline underline-offset-4 hover:text-primary/80'
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
