import type { ApiRequestError } from '@/lib/errors';

export type ApiResponse<T> = {
  status: number;
  message: string;
  data: T;
};

export type ApiError = {
  status: number;
  message: string;
};

declare module '@tanstack/react-query' {
  interface Register {
    defaultError: ApiRequestError;
  }
}
