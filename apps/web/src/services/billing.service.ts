import type { AxiosInstance } from 'axios';

import type {
  BillingStatusResponse,
  CheckoutSessionResponse,
  PortalSessionResponse,
} from '@/types/billing.types';

export class BillingService {
  constructor(private readonly http: AxiosInstance) {}

  checkoutSession(params: {
    teamId: string;
    plan: string;
  }): Promise<CheckoutSessionResponse> {
    return this.http
      .post<CheckoutSessionResponse>('/billing/checkout-session', params)
      .then((r) => r.data);
  }

  portalSession(teamId: string): Promise<PortalSessionResponse> {
    return this.http
      .post<PortalSessionResponse>('/billing/portal-session', { teamId })
      .then((r) => r.data);
  }

  status(teamId: string): Promise<BillingStatusResponse> {
    return this.http
      .get<BillingStatusResponse>(`/billing/status/${teamId}`)
      .then((r) => r.data);
  }
}
