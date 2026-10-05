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

export abstract class SpacehubApi {
  abstract login(email: string, password: string): Promise<LoginResponse>;
  abstract me(): Promise<User>;
  abstract listAvailableSpaces(query: ListSpacesQuery): Promise<ListEnvelope<Space>>;
  abstract getSpaceAvailability(
    spaceId: string,
    startAt: string,
    endAt: string,
  ): Promise<Availability>;
  abstract listSpaces(page?: number, limit?: number): Promise<ListEnvelope<Space>>;
  abstract getSpace(spaceId: string): Promise<Space>;
  abstract createReservation(
    body: CreateReservationRequest,
    idempotencyKey: string,
  ): Promise<Reservation>;
  abstract getReservation(reservationId: string): Promise<Reservation>;
  abstract listReservations(query?: ListReservationsQuery): Promise<ListEnvelope<Reservation>>;
  abstract cancelReservation(reservationId: string, reason?: string): Promise<Reservation>;
  abstract createPayment(body: CreatePaymentRequest, idempotencyKey: string): Promise<Payment>;
  abstract getPayment(paymentId: string): Promise<Payment>;
  abstract listNotifications(query?: ListNotificationsQuery): Promise<ListEnvelope<Notification>>;
}
