import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthStore } from '../core/auth-store';

export type DeskStep = 'search' | 'space' | 'create' | 'pay' | 'status' | 'inbox' | 'admin';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
})
export class Shell {
  readonly auth = inject(AuthStore);
  private readonly router = inject(Router);
  readonly url = signal(this.router.url);

  constructor() {
    this.router.events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd)).subscribe((event) => {
      this.url.set(event.urlAfterRedirects);
    });
  }

  signOut(): void {
    this.auth.clear();
  }

  step(): DeskStep {
    const path = this.url().split('?')[0];
    if (path.startsWith('/admin')) {
      return 'admin';
    }
    if (path.startsWith('/notifications')) {
      return 'inbox';
    }
    if (path.startsWith('/checkout')) {
      return 'pay';
    }
    if (path.startsWith('/reservations/new')) {
      return 'create';
    }
    if (path.startsWith('/reservations')) {
      return 'status';
    }
    if (/^\/spaces\/[^/]+/.test(path)) {
      return 'space';
    }
    return 'search';
  }

  deskTitle(): string {
    switch (this.step()) {
      case 'space':
        return 'Dossier del espacio';
      case 'create':
        return 'Fichar la reserva';
      case 'pay':
        return 'Caja del campus';
      case 'status':
        return 'Stub de la reserva';
      case 'inbox':
        return 'Tablón de avisos';
      case 'admin':
        return 'Inventario';
      default:
        return 'Buscar un hueco';
    }
  }

  deskCopy(): string {
    switch (this.step()) {
      case 'space':
        return 'El periodo ya está escrito. Si el sello dice Libre, el hueco se puede fichar.';
      case 'create':
        return 'La ficha nace en PAYMENT_PENDING. Nadie ocupa el aula hasta que la caja confirme.';
      case 'pay':
        return 'Un Idempotency-Key. El mismo talón no cobra dos veces.';
      case 'status':
        return 'El stub queda. Si un aviso falla, la confirmación no se revierte.';
      case 'inbox':
        return 'Notas del mostrador. El tablón llama a las APIs dueñas; no lee sus tablas.';
      case 'admin':
        return 'Catálogo completo. USER no entra a este libro.';
      default:
        return 'Primero el periodo, después la sala. El campus no es una grilla de colores.';
    }
  }

  owner(): string {
    switch (this.step()) {
      case 'space':
        return 'space-service + availability-service';
      case 'create':
      case 'status':
        return 'reservation-service';
      case 'pay':
        return 'payment-service';
      case 'inbox':
        return 'notification-service';
      case 'admin':
        return 'space-service';
      default:
        return 'space-service';
    }
  }
}
