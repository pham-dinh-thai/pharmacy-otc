/** UUID sentinel the backend uses for rows written by the system. */
export const SYSTEM_ACTOR_ID = '00000000-0000-0000-0000-000000000000';

/** Hide the sentinel UUID from the UI; real actor ids stay untouched. */
export function formatActorLabel(actorId: string): string {
  return actorId === SYSTEM_ACTOR_ID ? 'SYSTEM' : actorId;
}
