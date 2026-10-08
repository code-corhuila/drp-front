import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { FailoverSpacehubApi } from './contract/failover-spacehub-api';
import { SpacehubApi } from './contract/spacehub-api';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),
    { provide: SpacehubApi, useExisting: FailoverSpacehubApi },
  ],
};
