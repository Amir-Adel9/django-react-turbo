import { z } from 'zod';

// Aligned with backend: name min 3, strong password (min 8, lowercase, number, special)
export const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email'),
    name: z.string().min(3, 'Name must be at least 3 characters'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>]).*$/,
        'Include at least one lowercase letter, one number, and one special character',
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;
