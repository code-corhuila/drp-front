import { Injectable } from '@angular/core';
import { AuthStore } from '../core/auth-store';
import { newId, nowIso, overlaps } from '../util/datetime';
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
  PaginatedMeta,
  Payment,
  Reservation,
  Space,
  User,
} from './types';

const MEMBER_ID = '44444444-4444-4444-4444-444444444444';
const ADMIN_ID = '66666666-6666-6666-6666-666666666666';
const SALA_NORTE_ID = '11111111-1111-1111-1111-111111111111';
const WORKSTATION_ID = '22222222-2222-2222-2222-222222222222';
const AUDITORIO_ID = '77777777-7777-7777-7777-777777777777';
const PASSWORD = 'Spacehub1!';

const USERS: Array<User & { password: string }> = [
  {
    id: MEMBER_ID,
    email: 'member@spacehub.local',
    displayName: 'Ana Reserva',
    role: 'USER',
    password: PASSWORD,
  },
  {
    id: ADMIN_ID,
    email: 'admin@spacehub.local',
    displayName: 'Admin SpaceHub',
    role: 'ADMIN',
    password: PASSWORD,
  },
];

const SPACES: Space[] = [
  {
    id: SALA_NORTE_ID,
    name: 'Sala Norte',
    kind: 'MEETING_ROOM',
    capacity: 8,
    available: true,
    amountCents: 5_000_000,
    currency: 'COP',
  },
  {
    id: WORKSTATION_ID,
    name: 'Workstation 12',
    kind: 'WORKSTATION',
    capacity: 1,
    available: true,
    amountCents: 800_000,
    currency: 'COP',
  },
  {
    id: AUDITORIO_ID,
    name: 'Auditorio Central',
    kind: 'AUDITORIUM',
    capacity: 80,
    available: false,
    amountCents: 12_000_000,
    currency: 'COP',
  },
];

@Injectable({ providedIn: 'root' })
export class SyntheticSpacehubApi extends SpacehubApi {
  private readonly reservations: Reservation[] = [];
  private readonly payments: Payment[] = [];
  private readonly notifications: Notification[] = [];
  private readonly reservationKeys = new Map<string, { body: string; reservation: Reservation }>();
  private readonly paymentKeys = new Map<string, { body: string; payment: Payment }>();

  constructor(private readonly auth: AuthStore) {
    super();
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const found = USERS.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!found || found.password !== password) {
      throw apiError(401, {
        error: 'INVALID_CREDENTIALS',
        message: 'Email o contraseña inválidos',
      });
    }
    const user: User = {
      id: found.id,
      email: found.email,
      displayName: found.displayName,
      role: found.role,
    };
    return {
      accessToken: `synthetic.${user.id}`,
      tokenType: 'Bearer',
      expiresIn: 3600,
      user,
    };
  }

  async me(): Promise<User> {
    return clone(this.requireUser());
  }

  async listAvailableSpaces(query: ListSpacesQuery): Promise<ListEnvelope<Space>> {
    this.requireUser();
    this.requirePeriod(query.startAt, query.endAt);
    const filtered = SPACES.filter((space) => {
      if (!space.available) {
        return false;
      }
      if (query.kind && space.kind !== query.kind) {
        return false;
      }
      if (query.minCapacity && space.capacity < query.minCapacity) {
        return false;
      }
      return this.availabilityOf(space.id, query.startAt, query.endAt).available;
    });
    return paginate(filtered.map(clone), query.page, query.limit);
  }

  async getSpaceAvailability(spaceId: string, startAt: string, endAt: string): Promise<Availability> {
    this.requireUser();
    this.requirePeriod(startAt, endAt);
    this.getSpaceOrThrow(spaceId);
    return this.availabilityOf(spaceId, startAt, endAt);
  }

  async listSpaces(page = 1, limit = 20): Promise<ListEnvelope<Space>> {
    this.requireUser();
    return paginate(SPACES.map(clone), page, limit);
  }

  async getSpace(spaceId: string): Promise<Space> {
    this.requireUser();
    return clone(this.getSpaceOrThrow(spaceId));
  }

  async createReservation(body: CreateReservationRequest, idempotencyKey: string): Promise<Reservation> {
    const user = this.requireUser();
    this.requirePeriod(body.startAt, body.endAt);
    const replay = this.replayReservation(idempotencyKey, JSON.stringify(body));
    if (replay) {
      return clone(replay);
    }
    const space = this.getSpaceOrThrow(body.spaceId);
    const availability = this.availabilityOf(body.spaceId, body.startAt, body.endAt);
    if (!availability.available || space.id === AUDITORIO_ID) {
      throw apiError(422, {
        error: 'BUSINESS_RULE_VIOLATION',
        message:
          availability.reason === 'CONFIRMED_OVERLAP'
            ? 'Ya existe una reserva CONFIRMED que se solapa en este espacio'
            : 'El espacio no está disponible en el periodo solicitado',
      });
    }
    const now = nowIso();
    const reservation: Reservation = {
      id: newId(),
      userId: user.id,
      spaceId: body.spaceId,
      startAt: body.startAt,
      endAt: body.endAt,
      state: 'PAYMENT_PENDING',
      createdAt: now,
      updatedAt: now,
    };
    this.reservations.push(reservation);
    this.reservationKeys.set(idempotencyKey, {
      body: JSON.stringify(body),
      reservation,
    });
    return clone(reservation);
  }

  async getReservation(reservationId: string): Promise<Reservation> {
    const user = this.requireUser();
    const found = this.reservations.find((r) => r.id === reservationId);
    if (!found) {
      throw apiError(404, { error: 'NOT_FOUND', message: 'La reserva no existe' });
    }
    if (user.role !== 'ADMIN' && found.userId !== user.id) {
      throw apiError(403, { error: 'FORBIDDEN', message: 'No tienes permisos para realizar esta acción' });
    }
    return clone(found);
  }

  async listReservations(query: ListReservationsQuery = {}): Promise<ListEnvelope<Reservation>> {
    const user = this.requireUser();
    let rows = this.reservations.filter((r) => (user.role === 'ADMIN' ? true : r.userId === user.id));
    if (query.state) {
      rows = rows.filter((r) => r.state === query.state);
    }
    if (query.spaceId) {
      rows = rows.filter((r) => r.spaceId === query.spaceId);
    }
    rows = [...rows].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
    return paginate(rows.map(clone), query.page, query.limit);
  }

  async cancelReservation(reservationId: string, _reason?: string): Promise<Reservation> {
    const reservation = await this.getReservation(reservationId);
    const live = this.reservations.find((r) => r.id === reservation.id)!;
    if (live.state === 'CANCELLED') {
      throw apiError(422, {
        error: 'INVALID_STATUS_TRANSITION',
        message: 'La reserva no puede cancelarse en el estado actual',
      });
    }
    live.state = 'CANCELLED';
    live.updatedAt = nowIso();
    this.pushNotification(live.userId, 'ReservationCancelled', { reservationId: live.id });
    return clone(live);
  }

  async createPayment(body: CreatePaymentRequest, idempotencyKey: string): Promise<Payment> {
    this.requireUser();
    const replay = this.replayPayment(idempotencyKey, JSON.stringify(body));
    if (replay) {
      return clone(replay);
    }
    const reservation = this.reservations.find((r) => r.id === body.reservationId);
    if (!reservation) {
      throw apiError(404, { error: 'NOT_FOUND', message: 'La reserva no existe' });
    }
    if (reservation.state !== 'PAYMENT_PENDING') {
      throw apiError(422, {
        error: 'BUSINESS_RULE_VIOLATION',
        message: 'Solo se puede pagar una reserva en PAYMENT_PENDING',
      });
    }
    const now = nowIso();
    const payment: Payment = {
      id: newId(),
      reservationId: body.reservationId,
      amountCents: body.amountCents,
      currency: body.currency,
      state: 'CONFIRMED',
      idempotencyKey,
      providerReference: `synth-${newId()}`,
      createdAt: now,
      updatedAt: now,
    };
    this.payments.push(payment);
    this.paymentKeys.set(idempotencyKey, { body: JSON.stringify(body), payment });
    reservation.state = 'CONFIRMED';
    reservation.updatedAt = now;
    this.pushNotification(reservation.userId, 'ReservationConfirmed', {
      reservationId: reservation.id,
      paymentId: payment.id,
    });
    return clone(payment);
  }

  async getPayment(paymentId: string): Promise<Payment> {
    this.requireUser();
    const found = this.payments.find((p) => p.id === paymentId);
    if (!found) {
      throw apiError(404, { error: 'NOT_FOUND', message: 'El pago no existe' });
    }
    return clone(found);
  }

  async listNotifications(query: ListNotificationsQuery = {}): Promise<ListEnvelope<Notification>> {
    const user = this.requireUser();
    let rows = this.notifications.filter((n) => n.userId === user.id);
    if (query.state) {
      rows = rows.filter((n) => n.state === query.state);
    }
    rows = [...rows].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return paginate(rows.map(clone), query.page, query.limit);
  }

  private requireUser(): User {
    const user = this.auth.user();
    if (!user) {
      throw apiError(401, { error: 'UNAUTHORIZED', message: 'Token de autenticación requerido' });
    }
    return user;
  }

  private requirePeriod(startAt: string, endAt: string): void {
    if (!startAt || !endAt || new Date(endAt) <= new Date(startAt)) {
      throw apiError(400, {
        error: 'VALIDATION_ERROR',
        message: 'endAt debe ser posterior a startAt',
        details: [{ field: 'endAt', message: 'Debe ser posterior a startAt' }],
      });
    }
  }

  private getSpaceOrThrow(spaceId: string): Space {
    const space = SPACES.find((s) => s.id === spaceId);
    if (!space) {
      throw apiError(404, { error: 'NOT_FOUND', message: 'El espacio solicitado no existe' });
    }
    return space;
  }

  private availabilityOf(spaceId: string, startAt: string, endAt: string): Availability {
    const space = this.getSpaceOrThrow(spaceId);
    if (!space.available || space.id === AUDITORIO_ID) {
      return { spaceId, available: false, reason: 'BLOCKED' };
    }
    const confirmedOverlap = this.reservations.some(
      (r) =>
        r.spaceId === spaceId &&
        r.state === 'CONFIRMED' &&
        overlaps(r.startAt, r.endAt, startAt, endAt),
    );
    if (confirmedOverlap) {
      return { spaceId, available: false, reason: 'CONFIRMED_OVERLAP' };
    }
    return { spaceId, available: true, reason: 'OK' };
  }

  private replayReservation(key: string, body: string): Reservation | null {
    return this.replayRecord(this.reservationKeys, key, body)?.reservation ?? null;
  }

  private replayPayment(key: string, body: string): Payment | null {
    return this.replayRecord(this.paymentKeys, key, body)?.payment ?? null;
  }

  private replayRecord<T extends { body: string }>(store: Map<string, T>, key: string, body: string): T | null {
    const existing = store.get(key);
    if (!existing) {
      return null;
    }
    if (existing.body !== body) {
      throw apiError(409, {
        error: 'IDEMPOTENCY_CONFLICT',
        message: 'La misma Idempotency-Key se usó con otro cuerpo',
      });
    }
    return existing;
  }

  private pushNotification(
    userId: string,
    eventType: Notification['eventType'],
    payload: Record<string, unknown>,
  ): void {
    const now = nowIso();
    this.notifications.push({
      id: newId(),
      userId,
      sourceEventId: newId(),
      eventType,
      channel: 'IN_APP',
      state: 'SENT',
      payload,
      createdAt: now,
      updatedAt: now,
    });
  }
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function paginate<T>(items: T[], page = 1, limit = 20): ListEnvelope<T> {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(100, Math.max(1, limit));
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / safeLimit) || 1);
  const start = (safePage - 1) * safeLimit;
  const meta: PaginatedMeta = { page: safePage, limit: safeLimit, total, totalPages };
  return { data: items.slice(start, start + safeLimit), meta };
}

function apiError(status: number, body: ErrorResponse): ApiError {
  return new ApiError({ ...body, traceId: body.traceId ?? newId() }, status);
}
