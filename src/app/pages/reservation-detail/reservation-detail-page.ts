import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Reservation, Space } from '../../contract/types';
import { SpacehubApi } from '../../contract/spacehub-api';
import { errorMessage } from '../../util/error-message';
import { formatPeriod } from '../../util/datetime';
import { formatCop, STATE_LABELS } from '../../util/labels';

@Component({
  selector: 'app-reservation-detail-page',
  imports: [RouterLink],
  templateUrl: './reservation-detail-page.html',
})
export class ReservationDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(SpacehubApi);

  readonly formatPeriod = formatPeriod;
  readonly formatCop = formatCop;
  readonly stateLabels = STATE_LABELS;
  readonly reservation = signal<Reservation | null>(null);
  readonly space = signal<Space | null>(null);
  readonly error = signal('');
  readonly busy = signal(false);

  async ngOnInit(): Promise<void> {
    await this.reload();
  }

  async reload(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('Reserva no indicada');
      return;
    }
    try {
      const reservation = await this.api.getReservation(id);
      this.reservation.set(reservation);
      this.space.set(await this.api.getSpace(reservation.spaceId));
    } catch (err) {
      this.error.set(errorMessage(err));
    }
  }

  canCancel(): boolean {
    const state = this.reservation()?.state;
    return state === 'PAYMENT_PENDING' || state === 'CONFIRMED';
  }

  async cancel(): Promise<void> {
    const reservation = this.reservation();
    if (!reservation || !confirm('¿Cancelar esta reserva?')) {
      return;
    }
    this.busy.set(true);
    this.error.set('');
    try {
      this.reservation.set(await this.api.cancelReservation(reservation.id));
    } catch (err) {
      this.error.set(errorMessage(err));
    } finally {
      this.busy.set(false);
    }
  }

  goPay(): void {
    const reservation = this.reservation();
    if (reservation) {
      void this.router.navigate(['/checkout', reservation.id]);
    }
  }
}
