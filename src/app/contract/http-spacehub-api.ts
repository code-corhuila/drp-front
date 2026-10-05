import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthStore } from '../core/auth-store';
import { environment } from '../../environments/environment';
import { newId } from '../util/datetime';
import { ApiError } from './api-error';
import { SpacehubApi } from './spacehub-api';
import {
  Availability,
  CreatePaymentRequest,
  CreateReservationRequest,
  ErrorResponse,
  ListEnvelope,
  ListNotificationsQuery,
  ListReservationsQuery,
  ListSpacesQuery,
  LoginResponse,
  Notification,
  Payment,
  Reservation,
  Space,
  User,
} from './types';

@Injectable({ providedIn: 'root' })
export class HttpSpacehubApi extends SpacehubApi {
  constructor(
    private readonly http: HttpClient,
    private readonly auth: AuthStore,
  ) {
    super();
  }

  login(email: string, password: string): Promise<LoginResponse> {
    return this.request<LoginResponse>('POST', '/api/v1/auth/login', {
      body: { email, password },
      auth: false,
    });
  }

  me(): Promise<User> {
    return this.request<User>('GET', '/api/v1/users/me');
  }

  listAvailableSpaces(query: ListSpacesQuery): Promise<ListEnvelope<Space>> {
    const params: Record<string, string | number> = {
      startAt: query.startAt,
      endAt: query.endAt,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    };
    if (query.kind) {
      params['kind'] = query.kind;
    }
    if (query.minCapacity) {
      params['minCapacity'] = query.minCapacity;
    }
    return this.request<ListEnvelope<Space>>('GET', '/api/v1/spaces/available', { params });
  }

  getSpaceAvailability(spaceId: string, startAt: string, endAt: string): Promise<Availability> {
    return this.request<Availability>('GET', `/api/v1/spaces/${spaceId}/availability`, {
      params: { startAt, endAt },
    });
  }

  listSpaces(page = 1, limit = 20): Promise<ListEnvelope<Space>> {
    return this.request<ListEnvelope<Space>>('GET', '/api/v1/spaces', { params: { page, limit } });
  }

  getSpace(spaceId: string): Promise<Space> {
    return this.request<Space>('GET', `/api/v1/spaces/${spaceId}`);
  }

  createReservation(body: CreateReservationRequest, idempotencyKey: string): Promise<Reservation> {
    return this.request<Reservation>('POST', '/api/v1/reservations', {
      body,
      idempotencyKey,
    });
  }

  getReservation(reservationId: string): Promise<Reservation> {
    return this.request<Reservation>('GET', `/api/v1/reservations/${reservationId}`);
  }

  listReservations(query: ListReservationsQuery = {}): Promise<ListEnvelope<Reservation>> {
    const params: Record<string, string | number> = {
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    };
    if (query.state) {
      params['state'] = query.state;
    }
    if (query.spaceId) {
      params['spaceId'] = query.spaceId;
    }
    return this.request<ListEnvelope<Reservation>>('GET', '/api/v1/reservations', { params });
  }

  cancelReservation(reservationId: string, reason?: string): Promise<Reservation> {
    return this.request<Reservation>('POST', `/api/v1/reservations/${reservationId}/cancel`, {
      body: reason ? { reason } : {},
    });
  }

  createPayment(body: CreatePaymentRequest, idempotencyKey: string): Promise<Payment> {
    return this.request<Payment>('POST', '/api/v1/payments', { body, idempotencyKey });
  }

  getPayment(paymentId: string): Promise<Payment> {
    return this.request<Payment>('GET', `/api/v1/payments/${paymentId}`);
  }

  listNotifications(query: ListNotificationsQuery = {}): Promise<ListEnvelope<Notification>> {
    const params: Record<string, string | number> = {
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    };
    if (query.state) {
      params['state'] = query.state;
    }
    return this.request<ListEnvelope<Notification>>('GET', '/api/v1/notifications', { params });
  }

  private async request<T>(
    method: string,
    path: string,
    options: {
      body?: unknown;
      params?: Record<string, string | number>;
      auth?: boolean;
      idempotencyKey?: string;
    } = {},
  ): Promise<T> {
    let headers = new HttpHeaders({
      'X-Correlation-Id': newId(),
    });
    if (options.auth !== false) {
      const token = this.auth.token();
      if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
      }
    }
    if (options.idempotencyKey) {
      headers = headers.set('Idempotency-Key', options.idempotencyKey);
    }
    try {
      return await firstValueFrom(
        this.http.request<T>(method, `${environment.apiBase}${path}`, {
          body: options.body,
          headers,
          params: options.params,
        }),
      );
    } catch (error) {
      throw this.mapError(error);
    }
  }

  private mapError(error: unknown): unknown {
    if (!(error instanceof HttpErrorResponse)) {
      return error;
    }
    if (error.status === 0 || error.status >= 500) {
      return error;
    }
    const body = normalizeError(error.error, error.status);
    return new ApiError(body, error.status);
  }
}

function normalizeError(raw: unknown, status: number): ErrorResponse {
  if (raw && typeof raw === 'object' && 'error' in raw && 'message' in raw) {
    return raw as ErrorResponse;
  }
  return {
    error: status === 401 ? 'UNAUTHORIZED' : 'INTERNAL_ERROR',
    message: 'La API respondió un error',
  };
}
