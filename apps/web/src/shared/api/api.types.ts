import type { components, paths } from '@digisay/api-contract';

export type { components, paths };

// --- Auth (from components.schemas) ---

/** User entity (from login/register responses) */
export type User = components['schemas']['Register'];

/** Login request body */
export type LoginBody = components['schemas']['CustomTokenObtainPairRequest'];

/** Register request body */
export type RegisterBody = components['schemas']['RegisterRequest'];

/** Login response: backend returns { user: { email, name } } */
export interface LoginResponse {
  user: User;
}

/** Register response: backend returns { message } */
export interface RegisterResponse {
  message?: string;
}

// --- Tasks (from components.schemas) ---

/** Task entity */
export type Task = components['schemas']['Task'];

/** Task status enum */
export type TaskStatus = components['schemas']['StatusEnum'];

/** Paginated task list (list endpoint response) */
export type PaginatedTaskList = components['schemas']['PaginatedTaskList'];

/** Create-task request body */
export type TaskCreateRequest = components['schemas']['TaskCreateRequest'];

/** Partial update (PATCH) request body */
export type PatchedTaskRequest = components['schemas']['PatchedTaskRequest'];

/** Bulk-create item request */
export type TaskBulkItemRequest = components['schemas']['TaskBulkItemRequest'];

/** Task stats (counts by status) */
export type TaskStats = components['schemas']['TaskStats'];

// --- API error ---

/** API error shape (DRF validation) */
export interface ApiError {
  detail?: string;
  [key: string]: string | string[] | undefined;
}
