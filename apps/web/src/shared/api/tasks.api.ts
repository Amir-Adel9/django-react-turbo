import type {
  Task,
  TaskStats,
  PaginatedTaskList,
  TaskCreateRequest,
  PatchedTaskRequest,
  TaskBulkItemRequest,
} from '@/shared/api/api.types';
import {
  apiClient,
  getApiBaseUrl,
  fetchWithAuth,
} from '@/shared/api/http-client';
import { createApi } from '@reduxjs/toolkit/query/react';

export type TaskListParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  created_after?: string;
  created_before?: string;
};

export type ExportParams = {
  from?: string;
  to?: string;
  status?: string;
};

export const tasksApi = createApi({
  reducerPath: 'tasksApi',
  baseQuery: () => ({ data: undefined }),
  tagTypes: ['TaskList', 'TaskStats'],
  endpoints: (builder) => ({
    getStats: builder.query<TaskStats, void>({
      queryFn: async () => {
        try {
          const result = await apiClient.GET('/api/tasks/stats', {
            params: {},
          });
          if (!result.response.ok) {
            const data = 'error' in result ? result.error : undefined;
            return {
              error: {
                status: result.response.status,
                data:
                  data ??
                  (await result.response
                    .clone()
                    .json()
                    .catch(() => ({}))),
              },
            };
          }
          const data =
            'data' in result && result.data !== undefined
              ? result.data
              : ((await result.response.json()) as TaskStats);
          return { data };
        } catch (err) {
          return {
            error: {
              status: 'CUSTOM_ERROR' as const,
              error: String(err),
              data: err,
            },
          };
        }
      },
      providesTags: ['TaskStats'],
    }),

    getTaskList: builder.query<PaginatedTaskList, TaskListParams | void>({
      queryFn: async (params) => {
        try {
          const query = new URLSearchParams();
          if (params?.page != null) query.set('page', String(params.page));
          if (params?.limit != null) query.set('limit', String(params.limit));
          if (params?.search) query.set('search', params.search);
          if (params?.status) query.set('status', params.status);
          if (params?.created_after)
            query.set('created_after', params.created_after);
          if (params?.created_before)
            query.set('created_before', params.created_before);
          const base = getApiBaseUrl();
          const url = `${base ? base.replace(/\/$/, '') : ''}/api/tasks?${query.toString()}`;
          const res = await fetchWithAuth(url, { credentials: 'include' });
          if (!res.ok) {
            const data = await res
              .clone()
              .json()
              .catch(() => ({}));
            return { error: { status: res.status, data } };
          }
          const data = (await res.json()) as PaginatedTaskList;
          return { data };
        } catch (err) {
          return {
            error: {
              status: 'CUSTOM_ERROR' as const,
              error: String(err),
              data: err,
            },
          };
        }
      },
      providesTags: (_, __, arg) => [
        { type: 'TaskList', id: JSON.stringify(arg ?? {}) },
      ],
    }),

    createTask: builder.mutation<Task, TaskCreateRequest>({
      queryFn: async (body) => {
        try {
          const result = await apiClient.POST('/api/tasks', { body });
          if (!result.response.ok) {
            const data = 'error' in result ? result.error : undefined;
            return {
              error: {
                status: result.response.status,
                data:
                  data ??
                  (await result.response
                    .clone()
                    .json()
                    .catch(() => ({}))),
              },
            };
          }
          const raw =
            'data' in result && result.data !== undefined
              ? result.data
              : await result.response.json();
          return { data: raw as Task };
        } catch (err) {
          return {
            error: {
              status: 'CUSTOM_ERROR' as const,
              error: String(err),
              data: err,
            },
          };
        }
      },
      invalidatesTags: ['TaskList', 'TaskStats'],
    }),

    updateTask: builder.mutation<
      Task,
      { id: number; body: PatchedTaskRequest }
    >({
      queryFn: async ({ id, body }) => {
        try {
          const base = getApiBaseUrl();
          const url = `${base ? base.replace(/\/$/, '') : ''}/api/tasks/${id}`;
          const res = await fetchWithAuth(url, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(body),
          });
          if (!res.ok) {
            const data = await res
              .clone()
              .json()
              .catch(() => ({}));
            return { error: { status: res.status, data } };
          }
          const data = (await res.json()) as Task;
          return { data };
        } catch (err) {
          return {
            error: {
              status: 'CUSTOM_ERROR' as const,
              error: String(err),
              data: err,
            },
          };
        }
      },
      invalidatesTags: ['TaskList', 'TaskStats'],
    }),

    deleteTask: builder.mutation<void, number>({
      queryFn: async (id) => {
        try {
          const base = getApiBaseUrl();
          const url = `${base ? base.replace(/\/$/, '') : ''}/api/tasks/${id}`;
          const res = await fetchWithAuth(url, {
            method: 'DELETE',
            credentials: 'include',
          });
          if (!res.ok) {
            const data = await res
              .clone()
              .json()
              .catch(() => ({}));
            return { error: { status: res.status, data } };
          }
          return { data: undefined };
        } catch (err) {
          return {
            error: {
              status: 'CUSTOM_ERROR' as const,
              error: String(err),
              data: err,
            },
          };
        }
      },
      invalidatesTags: ['TaskList', 'TaskStats'],
    }),

    bulkCreateTasks: builder.mutation<Task[], TaskBulkItemRequest[]>({
      queryFn: async (body) => {
        try {
          const result = await apiClient.POST('/api/tasks/bulk', { body });
          if (!result.response.ok) {
            const data = 'error' in result ? result.error : undefined;
            return {
              error: {
                status: result.response.status,
                data:
                  data ??
                  (await result.response
                    .clone()
                    .json()
                    .catch(() => ({}))),
              },
            };
          }
          const data =
            'data' in result && result.data !== undefined
              ? result.data
              : ((await result.response.json()) as Task[]);
          return { data };
        } catch (err) {
          return {
            error: {
              status: 'CUSTOM_ERROR' as const,
              error: String(err),
              data: err,
            },
          };
        }
      },
      invalidatesTags: ['TaskList', 'TaskStats'],
    }),

    bulkCreateTasksFromCsv: builder.mutation<Task[], File>({
      queryFn: async (file) => {
        try {
          const base = getApiBaseUrl();
          const url = `${base ? base.replace(/\/$/, '') : ''}/api/tasks/bulk`;
          const formData = new FormData();
          formData.append('file', file);

          const res = await fetchWithAuth(url, {
            method: 'POST',
            credentials: 'include',
            body: formData,
          });

          if (!res.ok) {
            const data = await res
              .clone()
              .json()
              .catch(() => ({}));
            return { error: { status: res.status, data } };
          }

          const data = (await res.json()) as Task[];
          return { data };
        } catch (err) {
          return {
            error: {
              status: 'CUSTOM_ERROR' as const,
              error: String(err),
              data: err,
            },
          };
        }
      },
      invalidatesTags: ['TaskList', 'TaskStats'],
    }),
  }),
});

export const {
  useGetStatsQuery,
  useGetTaskListQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useBulkCreateTasksMutation,
  useBulkCreateTasksFromCsvMutation,
} = tasksApi;
