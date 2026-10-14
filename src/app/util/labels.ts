import { ReservationState, SpaceKind } from '../contract/types';

export const KIND_LABELS: Record<SpaceKind, string> = {
  WORKSTATION: 'Puesto',
  MEETING_ROOM: 'Sala de reunión',
  PRIVATE_OFFICE: 'Oficina privada',
  TRAINING_ROOM: 'Sala de formación',
  AUDITORIUM: 'Auditorio',
};

export const STATE_LABELS: Record<ReservationState, string> = {
  PAYMENT_PENDING: 'Pago pendiente',
  CONFIRMED: 'Confirmada',
  CANCELLED: 'Cancelada',
};

export const EVENT_LABELS: Record<string, string> = {
  'user.registered': 'Cuenta creada',
  ReservationCreated: 'Reserva creada',
  PaymentConfirmed: 'Pago confirmado',
  PaymentFailed: 'Pago rechazado',
  ReservationConfirmed: 'Reserva confirmada',
  ReservationCancelled: 'Reserva cancelada',
};

export function formatCop(amountCents: number): string {
  const pesos = Math.round(amountCents / 100);
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(pesos);
}

export function kindTone(kind: SpaceKind): string {
  return `tone-${kind.toLowerCase()}`;
}

export function stampClass(state: string): string {
  if (state === 'CONFIRMED' || state === 'SENT' || state === 'OK') {
    return 'stamp is-ok';
  }
  if (state === 'CANCELLED' || state === 'FAILED') {
    return 'stamp is-bad';
  }
  return 'stamp is-wait';
}
