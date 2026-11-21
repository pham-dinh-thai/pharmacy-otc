/**
 * Actor metadata captured from the incoming request and attached to events,
 * so consumers can rebuild an audit entry outside the original request scope.
 */
export type ActorHeaders = {
  actorId: string;
  actorType: string;
  actorLabel: string;
  userIp: string;
  userAgent: string;
};

/** Valid UUID that never belongs to a real account, used for system-written rows. */
export const SYSTEM_ACTOR_ID = '00000000-0000-0000-0000-000000000000';

export function systemActorHeaders(): ActorHeaders {
  return {
    actorId: SYSTEM_ACTOR_ID,
    actorType: 'system',
    actorLabel: 'system',
    userIp: '',
    userAgent: '',
  };
}
