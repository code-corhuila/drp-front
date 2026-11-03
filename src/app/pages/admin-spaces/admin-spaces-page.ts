import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Space, SpaceKind } from '../../contract/types';
import { SpacehubApi } from '../../contract/spacehub-api';
import { errorMessage } from '../../util/error-message';
import { formatCop, KIND_LABELS } from '../../util/labels';

@Component({
  selector: 'app-admin-spaces-page',
  imports: [FormsModule],
  templateUrl: './admin-spaces-page.html',
})
export class AdminSpacesPage implements OnInit {
  private readonly api = inject(SpacehubApi);
  readonly kindLabels = KIND_LABELS;
  readonly kinds: SpaceKind[] = [
    'WORKSTATION',
    'MEETING_ROOM',
    'PRIVATE_OFFICE',
    'TRAINING_ROOM',
    'AUDITORIUM',
  ];
  readonly formatCop = formatCop;
  readonly rows = signal<Space[]>([]);
  readonly error = signal('');
  readonly busy = signal(false);
  name = '';
  kind: SpaceKind = 'MEETING_ROOM';
  capacity = 1;
  description = '';
  blockSpaceId = '';
  blockStartAt = '';
  blockEndAt = '';
  blockReason = '';

  async ngOnInit(): Promise<void> {
    await this.reload();
  }

  async reload(): Promise<void> {
    try {
      const list = await this.api.listSpaces(1, 100);
      this.rows.set(list.data);
      if (!this.blockSpaceId && list.data[0]) {
        this.blockSpaceId = list.data[0].id;
      }
    } catch (err) {
      this.error.set(errorMessage(err));
    }
  }

  async createSpace(): Promise<void> {
    this.error.set('');
    this.busy.set(true);
    try {
      await this.api.createSpace({
        name: this.name,
        kind: this.kind,
        capacity: this.capacity,
        description: this.description,
      });
      this.name = '';
      this.description = '';
      this.capacity = 1;
      await this.reload();
    } catch (err) {
      this.error.set(errorMessage(err));
    } finally {
      this.busy.set(false);
    }
  }

  async createBlock(): Promise<void> {
    this.error.set('');
    this.busy.set(true);
    try {
      await this.api.createBlock(this.blockSpaceId, {
        startAt: this.blockStartAt,
        endAt: this.blockEndAt,
        reason: this.blockReason || undefined,
      });
      this.blockReason = '';
    } catch (err) {
      this.error.set(errorMessage(err));
    } finally {
      this.busy.set(false);
    }
  }
}
