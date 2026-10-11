import { Component, inject } from '@angular/core';
import { InjectFailureStore } from '../core/inject-failure';

@Component({
  selector: 'app-inject-failure-toggle',
  template: `
    <button
      type="button"
      class="inject-toggle"
      [class.on]="inject.on()"
      [attr.aria-pressed]="inject.on()"
      (click)="inject.toggle()"
    >
      {{ inject.on() ? 'Fallo 5xx activo' : 'Inyectar fallo 5xx' }}
    </button>
  `,
  styles: `
    .inject-toggle {
      border: 1px solid #d6c4a8;
      background: var(--color-bg-card);
      color: var(--color-ink);
      border-radius: var(--radius-md);
      padding: 0.35rem 0.65rem;
      font-family: inherit;
      font-size: 0.78rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      cursor: pointer;
    }

    .inject-toggle.on {
      background: var(--color-accent);
      border-color: var(--color-accent);
      color: #fff;
    }
  `,
})
export class InjectFailureToggle {
  readonly inject = inject(InjectFailureStore);
}
