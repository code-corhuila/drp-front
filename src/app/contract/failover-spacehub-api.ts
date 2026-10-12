import { Injectable, effect, untracked } from '@angular/core';
import { environment } from '../../environments/environment';
import { AuthStore } from '../core/auth-store';
import { InjectFailureStore, injectedWriteDeniedError } from '../core/inject-failure';
import { ApiError, isFailoverTrigger } from './api-error';
import { HttpSpacehubApi } from './http-spacehub-api';
import { SpacehubApi } from './spacehub-api';
import { SyntheticSpacehubApi } from './synthetic-spacehub-api';
import {
  Availability,
  CreatePaymentRequest,
  CreateReservationRequest,
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
export class FailoverSpacehubApi extends SpacehubApi {
  private stickySynthetic = environment.mode === 'synthetic';
  private heldByInject = false;

  constructor(
    private readonly httpApi: HttpSpacehubApi,
    private readonly syntheticApi: SyntheticSpacehubApi,
    private readonly auth: AuthStore,
    private readonly injectFailure: InjectFailureStore,
  ) {
    super();
    this.auth.usingSynthetic.set(this.stickySynthetic);
    effect(() => {
      const injected = this.injectFailure.on();
      untracked(() => {
        if (injected) {
          this.heldByInject = true;
          return;
        }
        if (this.heldByInject && environment.mode !== 'synthetic') {
          this.heldByInject = false;
          this.stickySynthetic = false;
          this.auth.usingSynthetic.set(false);
        }
      });
    });
  }

  login(email: string, password: string): Promise<LoginResponse> {
    return this.withFailover((api) => api.login(email, password), {
      allowSyntheticWrite: true,
    });
  }

  me(): Promise<User> {
    return this.withFailover((api) => api.me(), { allowSyntheticWrite: true });
  }

  listAvailableSpaces(query: ListSpacesQuery): Promise<ListEnvelope<Space>> {
    return this.withFailover((api) => api.listAvailableSpaces(query), {
      allowSyntheticWrite: true,
    });
  }

  getSpaceAvailability(spaceId: string, startAt: string, endAt: string): Promise<Availability> {
    return this.withFailover((api) => api.getSpaceAvailability(spaceId, startAt, endAt), {
      allowSyntheticWrite: true,
    });
  }

  listSpaces(page?: number, limit?: number): Promise<ListEnvelope<Space>> {
    return this.withFailover((api) => api.listSpaces(page, limit), {
      allowSyntheticWrite: true,
    });
  }

  getSpace(spaceId: string): Promise<Space> {
    return this.withFailover((api) => api.getSpace(spaceId), { allowSyntheticWrite: true });
  }

  createReservation(body: CreateReservationRequest, idempotencyKey: string): Promise<Reservation> {
    return this.withFailover((api) => api.createReservation(body, idempotencyKey), {
      allowSyntheticWrite: false,
    });
  }

  getReservation(reservationId: string): Promise<Reservation> {
    return this.withFailover((api) => api.getReservation(reservationId), {
      allowSyntheticWrite: true,
    });
  }

  listReservations(query?: ListReservationsQuery): Promise<ListEnvelope<Reservation>> {
    return this.withFailover((api) => api.listReservations(query), {
      allowSyntheticWrite: true,
    });
  }

  cancelReservation(reservationId: string, reason?: string): Promise<Reservation> {
    return this.withFailover((api) => api.cancelReservation(reservationId, reason), {
      allowSyntheticWrite: false,
    });
  }

  createPayment(body: CreatePaymentRequest, idempotencyKey: string): Promise<Payment> {
    return this.withFailover((api) => api.createPayment(body, idempotencyKey), {
      allowSyntheticWrite: false,
    });
  }

  getPayment(paymentId: string): Promise<Payment> {
    return this.withFailover((api) => api.getPayment(paymentId), {
      allowSyntheticWrite: true,
    });
  }

  listNotifications(query?: ListNotificationsQuery): Promise<ListEnvelope<Notification>> {
    return this.withFailover((api) => api.listNotifications(query), {
      allowSyntheticWrite: true,
    });
  }

  private async withFailover<T>(
    op: (api: SpacehubApi) => Promise<T>,
    opts: { allowSyntheticWrite?: boolean } = {},
  ): Promise<T> {
    const allowSyntheticWrite = opts.allowSyntheticWrite === true;
    if (this.injectFailure.on() && !allowSyntheticWrite) {
      throw injectedWriteDeniedError();
    }
    if (environment.mode === 'synthetic') {
      this.auth.usingSynthetic.set(true);
      return op(this.syntheticApi);
    }
    if (this.stickySynthetic) {
      if (!allowSyntheticWrite) {
        throw injectedWriteDeniedError();
      }
      this.auth.usingSynthetic.set(true);
      return op(this.syntheticApi);
    }
    if (environment.mode === 'live') {
      this.auth.usingSynthetic.set(false);
      return op(this.httpApi);
    }
    try {
      const result = await op(this.httpApi);
      this.auth.usingSynthetic.set(false);
      return result;
    } catch (error) {
      if (error instanceof ApiError && error.status < 500) {
        throw error;
      }
      if (isFailoverTrigger(error)) {
        if (!allowSyntheticWrite) {
          throw injectedWriteDeniedError();
        }
        this.stickySynthetic = true;
        this.auth.usingSynthetic.set(true);
        return op(this.syntheticApi);
      }
      throw error;
    }
  }
}
