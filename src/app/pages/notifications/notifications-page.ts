import { Component, inject, OnInit, signal } from '@angular/core';
import { Notification } from '../../contract/types';
import { SpacehubApi } from '../../contract/spacehub-api';
import { errorMessage } from '../../util/error-message';
import { EVENT_LABELS, stampClass } from '../../util/labels';

@Component({
  selector: 'app-notifications-page',
  templateUrl: './notifications-page.html',
})
export class NotificationsPage implements OnInit {
  private readonly api = inject(SpacehubApi);
  readonly rows = signal<Notification[]>([]);
  readonly error = signal('');
  readonly stampClass = stampClass;

  eventLabel(type: string): string {
    return EVENT_LABELS[type] ?? type;
  }

  async ngOnInit(): Promise<void> {
    try {
      const list = await this.api.listNotifications();
      this.rows.set(list.data);
    } catch (err) {
      this.error.set(errorMessage(err));
    }
  }
}
