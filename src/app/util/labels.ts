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

export function formatCop(amountCents: number): string {
  const pesos = Math.round(amountCents / 100);
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(pesos);
}
