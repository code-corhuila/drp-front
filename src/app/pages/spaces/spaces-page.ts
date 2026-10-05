import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SpacehubApi } from '../../contract/spacehub-api';
import { Space, SpaceKind } from '../../contract/types';
import { SearchContext } from '../../core/search-context';
import { errorMessage } from '../../util/error-message';
import { formatCop, KIND_LABELS } from '../../util/labels';

@Component({
  selector: 'app-spaces-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './spaces-page.html',
})
export class SpacesPage implements OnInit {
  readonly ctx = inject(SearchContext);
  private readonly api = inject(SpacehubApi);
  private readonly router = inject(Router);

  readonly kinds: Array<SpaceKind | ''> = [
    '',
    'MEETING_ROOM',
    'WORKSTATION',
    'PRIVATE_OFFICE',
    'TRAINING_ROOM',
    'AUDITORIUM',
  ];
  readonly kindLabels = KIND_LABELS;
  readonly formatCop = formatCop;
  readonly spaces = signal<Space[]>([]);
  readonly total = signal(0);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly searched = signal(false);

  ngOnInit(): void {
    void this.search();
  }

  async search(): Promise<void> {
    this.error.set('');
    this.busy.set(true);
    try {
      const min = this.ctx.minCapacity();
      const result = await this.api.listAvailableSpaces({
        startAt: this.ctx.startAt(),
        endAt: this.ctx.endAt(),
        kind: this.ctx.kind() || undefined,
        minCapacity: min === '' ? undefined : min,
      });
      this.spaces.set(result.data);
      this.total.set(result.meta.total);
      this.searched.set(true);
    } catch (err) {
      this.error.set(errorMessage(err, 'No se pudo buscar espacios'));
    } finally {
      this.busy.set(false);
    }
  }

  reserve(space: Space): void {
    void this.router.navigate(['/spaces', space.id], {
      queryParams: {
        startAt: this.ctx.startAt(),
        endAt: this.ctx.endAt(),
      },
    });
  }
}
