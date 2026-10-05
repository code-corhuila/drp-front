import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Reservation, Space } from '../../contract/types';
import { SpacehubApi } from '../../contract/spacehub-api';
import { errorMessage } from '../../util/error-message';
import { formatPeriod, newId } from '../../util/datetime';
import { formatCop } from '../../util/labels';

@Component({
  selector: 'app-checkout-page',
  imports: [RouterLink],
  templateUrl: './checkout-page.html',
})
export class CheckoutPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(SpacehubApi);

  readonly formatCop = formatCop;
  readonly formatPeriod = formatPeriod;
  readonly reservation = signal<Reservation | null>(null);
  readonly space = signal<Space | null>(null);
  readonly error = signal('');
  readonly busy = signal(false);
  private idempotencyKey = newId();

  get amountCents(): number {
    return this.space()?.amountCents ?? 5_000_000;
  }

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('reservationId');
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

  async pay(): Promise<void> {
    const reservation = this.reservation();
    if (!reservation) {
      return;
    }
    this.error.set('');
    this.busy.set(true);
    try {
      await this.api.createPayment(
        {
          reservationId: reservation.id,
          amountCents: this.amountCents,
          currency: this.space()?.currency ?? 'COP',
        },
        this.idempotencyKey,
      );
      await this.router.navigate(['/reservations', reservation.id]);
    } catch (err) {
      this.error.set(errorMessage(err));
    } finally {
      this.busy.set(false);
    }
  }
}
