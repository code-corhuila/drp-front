import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SpacehubApi } from '../../contract/spacehub-api';
import { AuthStore } from '../../core/auth-store';
import { errorMessage } from '../../util/error-message';

@Component({
  selector: 'app-login-page',
  imports: [FormsModule],
  templateUrl: './login-page.html',
})
export class LoginPage {
  private readonly api = inject(SpacehubApi);
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);

  email = '';
  password = '';
  readonly busy = signal(false);
  readonly error = signal('');

  async submit(): Promise<void> {
    this.error.set('');
    this.busy.set(true);
    try {
      const response = await this.api.login(this.email, this.password);
      this.auth.setToken(response.accessToken);
      const user = await this.api.me();
      this.auth.setSession(response.accessToken, user);
      await this.router.navigateByUrl('/spaces');
    } catch (err) {
      this.error.set(errorMessage(err, 'Usuario o contraseña incorrectos.'));
    } finally {
      this.busy.set(false);
    }
  }
}
