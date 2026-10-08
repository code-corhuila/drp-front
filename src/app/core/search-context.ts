import { Injectable, signal } from '@angular/core';
import { SpaceKind } from '../contract/types';
import { defaultWindow, toDatetimeLocal, toRfc3339 } from '../util/datetime';

@Injectable({ providedIn: 'root' })
export class SearchContext {
  readonly startLocal = signal(toDatetimeLocal(defaultWindow().start));
  readonly endLocal = signal(toDatetimeLocal(defaultWindow().end));
  readonly kind = signal<SpaceKind | ''>('');
  readonly minCapacity = signal<number | ''>('');

  startAt(): string {
    return toRfc3339(this.startLocal());
  }

  endAt(): string {
    return toRfc3339(this.endLocal());
  }

  applyQuery(params: { startAt?: string; endAt?: string; kind?: string; minCapacity?: string }): void {
    if (params.startAt) {
      this.startLocal.set(toDatetimeLocal(new Date(params.startAt)));
    }
    if (params.endAt) {
      this.endLocal.set(toDatetimeLocal(new Date(params.endAt)));
    }
    if (params.kind === '' || isKind(params.kind)) {
      this.kind.set(params.kind ?? '');
    }
    if (params.minCapacity) {
      this.minCapacity.set(Number(params.minCapacity) || '');
    }
  }
}

function isKind(value: string | undefined): value is SpaceKind {
  return (
    value === 'WORKSTATION' ||
    value === 'MEETING_ROOM' ||
    value === 'PRIVATE_OFFICE' ||
    value === 'TRAINING_ROOM' ||
    value === 'AUDITORIUM'
  );
}
