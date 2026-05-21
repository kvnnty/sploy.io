export type DeliveryPayload = {
  title: string;
  body: string;
  drivers: { headline: string; detail: string }[];
  reportUrl?: string;
};

export interface DeliveryAdapter {
  send(teamId: string, payload: DeliveryPayload): Promise<void>;
}
