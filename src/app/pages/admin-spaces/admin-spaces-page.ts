import { Component, inject, OnInit, signal } from '@angular/core';
import { Space } from '../../contract/types';
import { SpacehubApi } from '../../contract/spacehub-api';
import { errorMessage } from '../../util/error-message';
import { formatCop, KIND_LABELS } from '../../util/labels';

@Component({
  selector: 'app-admin-spaces-page',
  templateUrl: './admin-spaces-page.html',
})
export class AdminSpacesPage implements OnInit {
  private readonly api = inject(SpacehubApi);
  readonly kindLabels = KIND_LABELS;
  readonly formatCop = formatCop;
  readonly rows = signal<Space[]>([]);
  readonly error = signal('');

  async ngOnInit(): Promise<void> {
    try {
      const list = await this.api.listSpaces(1, 100);
      this.rows.set(list.data);
    } catch (err) {
      this.error.set(errorMessage(err));
    }
  }
}
