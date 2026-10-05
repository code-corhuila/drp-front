import { isApiError } from '../contract/api-error';

export function errorMessage(error: unknown, fallback = 'No se pudo completar la acción'): string {
  if (isApiError(error)) {
    return error.body.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}
