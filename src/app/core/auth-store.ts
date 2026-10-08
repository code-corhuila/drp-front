import { Injectable, signal } from '@angular/core';
import { User } from '../contract/types';

const SESSION_KEY = 'spacehub.session';

interface StoredSession {
  token: string;
  user: User;
}

@Injectable({ providedIn: 'root' })
export class AuthStore {
  readonly user = signal<User | null>(null);
  readonly usingSynthetic = signal(false);

  constructor() {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) {
      return;
    }
    try {
      const parsed = JSON.parse(raw) as StoredSession;
      if (parsed?.token && parsed?.user) {
        this.user.set(parsed.user);
        this.tokenValue = parsed.token;
      }
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }

  private tokenValue: string | null = null;

  token(): string | null {
    return this.tokenValue;
  }

  /** Hold the bearer so `me()` can run before the session is stored (E-01 then E-03). */
  setToken(token: string): void {
    this.tokenValue = token;
  }

  setSession(token: string, user: User): void {
    this.tokenValue = token;
    this.user.set(user);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ token, user } satisfies StoredSession));
  }

  clear(): void {
    this.tokenValue = null;
    this.user.set(null);
    sessionStorage.removeItem(SESSION_KEY);
  }
}
