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
      border: 1px solid var(--color-line);
      background: #fff;
      color: var(--color-ink);
      border-radius: 999px;
      padding: 0.38rem 0.75rem;
      font-family: inherit;
      font-size: 0.78rem;
      font-weight: 650;
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
