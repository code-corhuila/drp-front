import { Component, HostListener, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthStore } from '../core/auth-store';
import { InjectFailureToggle } from './inject-failure-toggle';

const RAIL_KEY = 'spacehub.railOpen';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, InjectFailureToggle],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
})
export class Shell {
  readonly auth = inject(AuthStore);
  private readonly router = inject(Router);
  readonly open = signal(this.readOpen());
  readonly overlay = signal(false);
  readonly path = signal(this.router.url);

  constructor() {
    this.syncViewport();
    this.router.events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd)).subscribe((event) => {
      this.path.set(event.urlAfterRedirects);
      if (this.overlay()) {
        this.open.set(false);
      }
    });
  }

  @HostListener('window:resize')
  syncViewport(): void {
    const overlay = window.innerWidth < 900;
    this.overlay.set(overlay);
    if (overlay) {
      this.open.set(false);
    }
  }

  toggle(): void {
    this.open.update((value) => !value);
    if (!this.overlay()) {
      sessionStorage.setItem(RAIL_KEY, this.open() ? '1' : '0');
    }
  }

  close(): void {
    this.open.set(false);
  }

  signOut(): void {
    this.auth.clear();
  }

  initial(): string {
    const name = this.auth.user()?.displayName || this.auth.user()?.email || 'U';
    return name.slice(0, 1).toUpperCase();
  }

  title(): string {
    const path = this.path().split('?')[0];
    if (path.startsWith('/admin')) {
      return 'Inventario';
    }
    if (path.startsWith('/notifications')) {
      return 'Avisos';
    }
    if (path.startsWith('/checkout')) {
      return 'Pago';
    }
    if (path.startsWith('/reservations/new')) {
      return 'Nueva reserva';
    }
    if (path.startsWith('/reservations')) {
      return 'Reservas';
    }
    if (/^\/spaces\/[^/]+/.test(path)) {
      return 'Sala';
    }
    return 'Salas';
  }

  private readOpen(): boolean {
    return sessionStorage.getItem(RAIL_KEY) !== '0';
  }
}
