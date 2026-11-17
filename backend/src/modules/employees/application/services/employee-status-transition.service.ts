import { Inject, Injectable } from '@nestjs/common';
import { Employee } from '../../domain/employee.aggregate';
import { EmployeeStatus } from '../../domain/enums/employee-status.enum';
import { EMPLOYEE_STATUS_CHANGED_EVENT } from '../../domain/events/employee-status-changed.event';
import { EMPLOYEE_RESIGNED_EVENT } from '../../domain/events/employee-resigned.event';
import {
  type IOutboxRepository,
  OUTBOX_REPOSITORY,
} from '../../../../shared/modules/outbox/domain/outbox.repository';
import { auditEventPayload } from '../../../audit-logs/domain/events/audit-event.payload';
import { EntityType } from '../../../audit-logs/domain/enums/entity-type.enum';
import { type ActorHeaders } from '../../../../shared/types/actor-headers';

/**
 * Shared status transition for every endpoint that can change employee status.
 * The caller is responsible for persisting the employee; this service only
 * mutates the aggregate and appends the resulting outbox events.
 */
@Injectable()
export class EmployeeStatusTransitionService {
  public constructor(
    @Inject(OUTBOX_REPOSITORY)
    private readonly outboxRepository: IOutboxRepository,
  ) {}

  public async apply(
    employee: Employee,
    nextStatus: EmployeeStatus,
    headers: ActorHeaders,
  ): Promise<boolean> {
    const previousStatus = employee.getStatus();

    if (previousStatus === nextStatus) {
      return false;
    }

    employee.changeStatus(nextStatus);

    await this.outboxRepository.create({
      eventType: EMPLOYEE_STATUS_CHANGED_EVENT,
      payload: auditEventPayload(headers, {
        entityType: EntityType.EMPLOYEES,
        entityId: employee.getId(),
        before: { status: previousStatus },
        after: { status: nextStatus },
      }),
    });

    if (nextStatus === EmployeeStatus.RESIGNED) {
      await this.outboxRepository.create({
        eventType: EMPLOYEE_RESIGNED_EVENT,
        payload: {
          employeeId: employee.getId(),
          userId: employee.getUserId(),
          headers,
        },
      });
    }

    return true;
  }
}
