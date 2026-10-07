import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Reservation } from '../../contract/types';
import { SpacehubApi } from '../../contract/spacehub-api';
import { errorMessage } from '../../util/error-message';
import { formatPeriod } from '../../util/datetime';
import { STATE_LABELS, stampClass } from '../../util/labels';

@Component({
  selector: 'app-reservations-page',
  imports: [RouterLink],
  templateUrl: './reservations-page.html',
})
export class ReservationsPage implements OnInit {
  private readonly api = inject(SpacehubApi);
  readonly formatPeriod = formatPeriod;
  readonly stateLabels = STATE_LABELS;
  readonly stampClass = stampClass;
  readonly rows = signal<Reservation[]>([]);
  readonly names = signal<Record<string, string>>({});
  readonly error = signal('');

  async ngOnInit(): Promise<void> {
    try {
      const list = await this.api.listReservations();
      this.rows.set(list.data);
      const catalog = await this.api.listSpaces(1, 100);
      const map: Record<string, string> = {};
      for (const space of catalog.data) {
        map[space.id] = space.name;
      }
      this.names.set(map);
    } catch (err) {
      this.error.set(errorMessage(err));
    }
  }

  spaceName(spaceId: string): string {
    return this.names()[spaceId] ?? spaceId;
  }
}
