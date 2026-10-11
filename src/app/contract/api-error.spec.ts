import { ApiError, isFailoverTrigger } from './api-error';
import {
  INJECT_FAILURE_KEY,
  InjectFailureStore,
  injectedGatewayError,
  injectedWriteDeniedError,
} from '../core/inject-failure';

describe('isFailoverTrigger', () => {
  it('treats an injected 503 as a failover trigger', () => {
    expect(isFailoverTrigger(injectedGatewayError())).toBe(true);
  });

  it('treats the write-denied 503 as a failover trigger', () => {
    const error = injectedWriteDeniedError();
    expect(error.status).toBe(503);
    expect(isFailoverTrigger(error)).toBe(true);
    expect(error.body.message).toContain('No se simula un pago ni una reserva');
  });

  it('does not fail over a 422 business error', () => {
    expect(
      isFailoverTrigger(new ApiError({ error: 'INVALID_STATUS_TRANSITION', message: 'no' }, 422)),
    ).toBe(false);
  });

  it('fails over a network-style status 0', () => {
    expect(isFailoverTrigger({ status: 0 })).toBe(true);
  });
});

describe('InjectFailureStore', () => {
  beforeEach(() => {
    sessionStorage.removeItem(INJECT_FAILURE_KEY);
  });

  afterEach(() => {
    sessionStorage.removeItem(INJECT_FAILURE_KEY);
  });

  it('defaults off and persists the session flag', () => {
    const store = new InjectFailureStore();
    expect(store.on()).toBe(false);
    store.toggle();
    expect(store.on()).toBe(true);
    expect(sessionStorage.getItem(INJECT_FAILURE_KEY)).toBe('1');
    expect(new InjectFailureStore().on()).toBe(true);
  });
});
