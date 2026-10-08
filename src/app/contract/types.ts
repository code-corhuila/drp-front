export type Role = 'USER' | 'ADMIN';

export type SpaceKind =
  | 'WORKSTATION'
  | 'MEETING_ROOM'
  | 'PRIVATE_OFFICE'
  | 'TRAINING_ROOM'
  | 'AUDITORIUM';

export type ReservationState = 'PAYMENT_PENDING' | 'CONFIRMED' | 'CANCELLED';

export type PaymentState = 'PENDING' | 'CONFIRMED' | 'FAILED';

export type NotificationState = 'PENDING' | 'SENT' | 'FAILED';

export type NotificationEventType =
  | 'user.registered'
  | 'ReservationCreated'
  | 'PaymentConfirmed'
  | 'PaymentFailed'
  | 'ReservationConfirmed'
  | 'ReservationCancelled';

export type AvailabilityReason = 'OK' | 'CONFIRMED_OVERLAP' | 'BLOCKED' | 'INACTIVE';

export interface PaginatedMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListEnvelope<T> {
  data: T[];
  meta: PaginatedMeta;
}

export interface ErrorDetail {
  field: string;
  message: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
  details?: ErrorDetail[];
  traceId?: string;
}

export interface User {
  id: string;
  email: string;
  displayName?: string;
  role: Role;
}

/** E-01: token only. Profile is E-03 `GET /api/v1/users/me`. */
export interface LoginResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}

export interface Space {
  id: string;
  name: string;
  kind: SpaceKind;
  capacity: number;
  available: boolean;
  /** Catalog price in integer minor units (norma 5.3.9). Not always on OpenAPI SpaceSummary. */
  amountCents?: number;
  currency?: string;
}

export interface Availability {
  spaceId: string;
  available: boolean;
  reason: AvailabilityReason;
}

export interface Reservation {
  id: string;
  userId: string;
  spaceId: string;
  startAt: string;
  endAt: string;
  state: ReservationState;
  createdAt?: string;
  updatedAt?: string;
}

export interface Payment {
  id: string;
  reservationId: string;
  amountCents: number;
  currency: string;
  state: PaymentState;
  idempotencyKey: string;
  providerReference?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Notification {
  id: string;
  userId: string;
  sourceEventId: string;
  eventType: NotificationEventType;
  channel: 'EMAIL' | 'IN_APP';
  state: NotificationState;
  payload?: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateReservationRequest {
  spaceId: string;
  startAt: string;
  endAt: string;
}

export interface CreatePaymentRequest {
  reservationId: string;
  amountCents: number;
  currency: string;
}

export interface ListSpacesQuery {
  startAt: string;
  endAt: string;
  kind?: SpaceKind | '';
  minCapacity?: number;
  page?: number;
  limit?: number;
}

export interface ListReservationsQuery {
  state?: ReservationState;
  spaceId?: string;
  page?: number;
  limit?: number;
}

export interface ListNotificationsQuery {
  state?: NotificationState;
  page?: number;
  limit?: number;
}
