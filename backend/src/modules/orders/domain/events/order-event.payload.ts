import { type ActorHeaders } from '../../../../shared/types/actor-headers';

export type OrderEventPayload = {
  headers: ActorHeaders;
  payload: any;
};

export const orderEventPayload = (
  headers: ActorHeaders,
  payload: any,
): OrderEventPayload => ({ headers, payload });
