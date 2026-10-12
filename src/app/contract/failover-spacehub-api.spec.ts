import { TestBed } from '@angular/core/testing';
import { AuthStore } from '../core/auth-store';
import { InjectFailureStore } from '../core/inject-failure';
import { ApiError } from './api-error';
import { FailoverSpacehubApi } from './failover-spacehub-api';
import { HttpSpacehubApi } from './http-spacehub-api';
import { SyntheticSpacehubApi } from './synthetic-spacehub-api';
import { Payment, Reservation } from './types';

const gateway503 = () =>
  new ApiError({ error: 'SERVICE_UNAVAILABLE', message: 'gateway 503' }, 503);

const syntheticReservation: Reservation = {
  id: 'syn-res',
  userId: 'usr-1',
  spaceId: 'spc-1',
  startAt: '2026-10-20T14:00:00Z',
  endAt: '2026-10-20T15:00:00Z',
  state: 'CONFIRMED',
};

const syntheticPayment: Payment = {
  id: 'syn-pay',
  reservationId: 'res-1',
  amountCents: 5000,
  currency: 'COP',
  state: 'CONFIRMED',
  idempotencyKey: 'key-pay',
};

describe('FailoverSpacehubApi fail-closed writes', () => {
  let api: FailoverSpacehubApi;
  let syntheticCreateReservation: ReturnType<typeof vi.fn>;
  let syntheticCreatePayment: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    sessionStorage.clear();
    syntheticCreateReservation = vi.fn().mockResolvedValue(syntheticReservation);
    syntheticCreatePayment = vi.fn().mockResolvedValue(syntheticPayment);

    TestBed.configureTestingModule({
      providers: [
        FailoverSpacehubApi,
        AuthStore,
        InjectFailureStore,
        {
          provide: HttpSpacehubApi,
          useValue: {
            createReservation: () => Promise.reject(gateway503()),
            createPayment: () => Promise.reject(gateway503()),
          },
        },
        {
          provide: SyntheticSpacehubApi,
          useValue: {
            createReservation: syntheticCreateReservation,
            createPayment: syntheticCreatePayment,
          },
        },
      ],
    });
    api = TestBed.inject(FailoverSpacehubApi);
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('does not return a CONFIRMED reservation when booking gets 503', async () => {
    await expect(
      api.createReservation(
        { spaceId: 'spc-1', startAt: '2026-10-20T14:00:00Z', endAt: '2026-10-20T15:00:00Z' },
        'key-book',
      ),
    ).rejects.toMatchObject({ status: 503 });
    expect(syntheticCreateReservation).not.toHaveBeenCalled();
  });

  it('does not return a CONFIRMED payment when payment gets 503', async () => {
    await expect(
      api.createPayment({ reservationId: 'res-1', amountCents: 5000, currency: 'COP' }, 'key-pay'),
    ).rejects.toMatchObject({ status: 503 });
    expect(syntheticCreatePayment).not.toHaveBeenCalled();
  });
});
