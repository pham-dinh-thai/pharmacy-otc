import type { ActorHeaders } from '../../../shared/types/actor-headers';
import type {
  AuditSnapshot,
  CreateAuditLogProps,
} from '../domain/audit-log.aggregate';
import { ActorType } from '../domain/enums/actor-type.enum';
import { AuditStatus } from '../domain/enums/audit-status.enum';
import type { EntityType } from '../domain/enums/entity-type.enum';

export type RecordAuditInput = {
  action: string;
  entityType: EntityType;
  entityId: string;
  before?: AuditSnapshot | null;
  after?: AuditSnapshot | null;
  metadata?: AuditSnapshot;
  reason?: string | null;
};

/** Builds a successful audit command from request-scoped actor metadata. */
export const recordAuditProps = (
  headers: ActorHeaders,
  input: RecordAuditInput,
): CreateAuditLogProps => ({
  occurredAt: new Date(),
  actorId: headers.actorId,
  actorType: headers.actorType === 'user' ? ActorType.USER : ActorType.SYSTEM,
  actorLabel: headers.actorLabel,
  action: input.action,
  entityType: input.entityType,
  entityId: input.entityId,
  status: AuditStatus.SUCCESS,
  before: input.before ?? null,
  after: input.after ?? null,
  metadata: input.metadata,
  reason: input.reason ?? null,
  ipAddress: headers.userIp,
  userAgent: headers.userAgent,
});
