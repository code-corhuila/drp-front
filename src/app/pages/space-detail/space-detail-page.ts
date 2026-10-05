import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Availability, Space } from '../../contract/types';
import { SpacehubApi } from '../../contract/spacehub-api';
import { SearchContext } from '../../core/search-context';
import { errorMessage } from '../../util/error-message';
import { formatPeriod } from '../../util/datetime';
import { formatCop, KIND_LABELS } from '../../util/labels';

@Component({
  selector: 'app-space-detail-page',
  imports: [RouterLink],
  templateUrl: './space-detail-page.html',
})
export class SpaceDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(SpacehubApi);
  readonly ctx = inject(SearchContext);

  readonly kindLabels = KIND_LABELS;
  readonly formatCop = formatCop;
  readonly formatPeriod = formatPeriod;
  readonly space = signal<Space | null>(null);
  readonly availability = signal<Availability | null>(null);
  readonly error = signal('');
  readonly busy = signal(false);

  async ngOnInit(): Promise<void> {
    const params = this.route.snapshot.queryParamMap;
    this.ctx.applyQuery({
      startAt: params.get('startAt') ?? undefined,
      endAt: params.get('endAt') ?? undefined,
    });
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('Espacio no indicado');
      return;
    }
    this.busy.set(true);
    try {
      const space = await this.api.getSpace(id);
      this.space.set(space);
      const availability = await this.api.getSpaceAvailability(id, this.ctx.startAt(), this.ctx.endAt());
      this.availability.set(availability);
    } catch (err) {
      this.error.set(errorMessage(err));
    } finally {
      this.busy.set(false);
    }
  }

  continueToReserve(): void {
    const space = this.space();
    if (!space) {
      return;
    }
    void this.router.navigate(['/reservations/new'], {
      queryParams: {
        spaceId: space.id,
        startAt: this.ctx.startAt(),
        endAt: this.ctx.endAt(),
      },
    });
  }
}
