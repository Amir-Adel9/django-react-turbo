import type { z } from 'zod';
import { toNestErrors } from '@hookform/resolvers';
import type { FieldError, FieldValues, Resolver } from 'react-hook-form';

/**
 * Custom Zod resolver that uses safeParse so validation errors are returned
 * to react-hook-form instead of thrown (avoids uncaught ZodError and ensures
 * formState.errors is populated for UI).
 */
export function zodResolver<T extends z.ZodType<FieldValues>>(
  schema: T,
): Resolver<z.infer<T>> {
  return (values, _context, options) => {
    const result = schema.safeParse(values);
    if (result.success) {
      return { values: result.data, errors: {} };
    }
    const errors: Record<string, FieldError> = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join('.');
      if (!path) continue;
      if (!(path in errors)) {
        errors[path] = { type: issue.code, message: issue.message };
      }
    }
    return {
      values: {},
      errors: toNestErrors(errors, options),
    };
  };
}
