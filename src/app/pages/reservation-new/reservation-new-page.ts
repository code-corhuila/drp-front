import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Space } from '../../contract/types';
import { SpacehubApi } from '../../contract/spacehub-api';
import { errorMessage } from '../../util/error-message';
import { formatPeriod, newId } from '../../util/datetime';
import { formatCop, KIND_LABELS } from '../../util/labels';

@Component({
  selector: 'app-reservation-new-page',
  imports: [RouterLink],
  templateUrl: './reservation-new-page.html',
})
export class ReservationNewPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(SpacehubApi);

  readonly kindLabels = KIND_LABELS;
  readonly formatCop = formatCop;
  readonly formatPeriod = formatPeriod;
  readonly space = signal<Space | null>(null);
  readonly error = signal('');
  readonly busy = signal(false);
  spaceId = '';
  startAt = '';
  endAt = '';
  private idempotencyKey = newId();

  async ngOnInit(): Promise<void> {
    const q = this.route.snapshot.queryParamMap;
    this.spaceId = q.get('spaceId') ?? '';
    this.startAt = q.get('startAt') ?? '';
    this.endAt = q.get('endAt') ?? '';
    if (!this.spaceId || !this.startAt || !this.endAt) {
      this.error.set('Falta espacio o periodo. Vuelve a la búsqueda.');
      return;
    }
    try {
      this.space.set(await this.api.getSpace(this.spaceId));
    } catch (err) {
      this.error.set(errorMessage(err));
    }
  }

  async create(): Promise<void> {
    this.error.set('');
    this.busy.set(true);
    try {
      const reservation = await this.api.createReservation(
        { spaceId: this.spaceId, startAt: this.startAt, endAt: this.endAt },
        this.idempotencyKey,
      );
      await this.router.navigate(['/checkout', reservation.id]);
    } catch (err) {
      this.error.set(errorMessage(err));
    } finally {
      this.busy.set(false);
    }
  }
}
