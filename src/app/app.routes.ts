import { Routes } from '@angular/router';
import { adminGuard, authGuard, guestGuard } from './core/guards';
import { Shell } from './layout/shell';
import { AdminSpacesPage } from './pages/admin-spaces/admin-spaces-page';
import { CheckoutPage } from './pages/checkout/checkout-page';
import { LoginPage } from './pages/login/login-page';
import { NotificationsPage } from './pages/notifications/notifications-page';
import { ReservationDetailPage } from './pages/reservation-detail/reservation-detail-page';
import { ReservationNewPage } from './pages/reservation-new/reservation-new-page';
import { ReservationsPage } from './pages/reservations/reservations-page';
import { SpaceDetailPage } from './pages/space-detail/space-detail-page';
import { SpacesPage } from './pages/spaces/spaces-page';

export const routes: Routes = [
  { path: 'login', canActivate: [guestGuard], component: LoginPage },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'spaces' },
      { path: 'spaces', component: SpacesPage },
      { path: 'spaces/:id', component: SpaceDetailPage },
      { path: 'reservations/new', component: ReservationNewPage },
      { path: 'reservations', component: ReservationsPage },
      { path: 'reservations/:id', component: ReservationDetailPage },
      { path: 'checkout/:reservationId', component: CheckoutPage },
      { path: 'notifications', component: NotificationsPage },
      { path: 'admin/spaces', canActivate: [adminGuard], component: AdminSpacesPage },
    ],
  },
  { path: '**', redirectTo: 'spaces' },
];
