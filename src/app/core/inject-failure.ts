import { Injectable, signal } from '@angular/core';
import { ApiError } from '../contract/api-error';

export const INJECT_FAILURE_KEY = 'spacehub.injectFailure';

export function readInjectFailureFlag(): boolean {
  return sessionStorage.getItem(INJECT_FAILURE_KEY) === '1';
}

export function injectedGatewayError(): ApiError {
  return new ApiError(
    {
      error: 'SERVICE_UNAVAILABLE',
      message: 'Fallo inyectado: el gateway respondió 5xx.',
    },
    503,
  );
}

export function injectedWriteDeniedError(): ApiError {
  return new ApiError(
    {
      error: 'SERVICE_UNAVAILABLE',
      message: 'El gateway no confirmó esta escritura. No se simula un pago ni una reserva.',
    },
    503,
  );
}

@Injectable({ providedIn: 'root' })
export class InjectFailureStore {
  readonly on = signal(readInjectFailureFlag());

  toggle(): void {
    this.set(!this.on());
  }

  set(value: boolean): void {
    this.on.set(value);
    if (value) {
      sessionStorage.setItem(INJECT_FAILURE_KEY, '1');
    } else {
      sessionStorage.removeItem(INJECT_FAILURE_KEY);
    }
  }
}
