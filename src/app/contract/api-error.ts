import { ErrorResponse } from './types';

export class ApiError extends Error {
  readonly body: ErrorResponse;
  readonly status: number;

  constructor(body: ErrorResponse, status: number) {
    super(body.message);
    this.name = 'ApiError';
    this.body = body;
    this.status = status;
  }

  get code(): string {
    return this.body.error;
  }
}

export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError;
}

export function isFailoverTrigger(error: unknown): boolean {
  if (isApiError(error)) {
    return error.status >= 500;
  }
  if (isHttpLike(error)) {
    return error.status === 0 || error.status >= 500;
  }
  return error instanceof TypeError;
}

function isHttpLike(error: unknown): error is { status: number } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof (error as { status: unknown }).status === 'number'
  );
}
