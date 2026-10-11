import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SpacehubApi } from '../../contract/spacehub-api';
import { AuthStore } from '../../core/auth-store';
import { InjectFailureStore } from '../../core/inject-failure';
import { InjectFailureToggle } from '../../layout/inject-failure-toggle';
import { errorMessage } from '../../util/error-message';

@Component({
  selector: 'app-login-page',
  imports: [FormsModule, InjectFailureToggle],
  templateUrl: './login-page.html',
})
export class LoginPage {
  private readonly api = inject(SpacehubApi);
  private readonly auth = inject(AuthStore);
  readonly injectFailure = inject(InjectFailureStore);
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
      this.auth.setSession(response.accessToken, response.user);
      await this.router.navigateByUrl('/spaces');
    } catch (err) {
      this.error.set(errorMessage(err, 'Email o contraseña inválidos'));
    } finally {
      this.busy.set(false);
    }
  }
}
