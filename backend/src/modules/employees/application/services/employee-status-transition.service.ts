import { Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Employee } from '../../domain/employee.aggregate';
import { EmployeeStatus } from '../../domain/enums/employee-status.enum';
import { RecordAuditLogCommand } from '../../../audit-logs/application/commands/record-audit-log/record-audit-log.command';
import { recordAuditProps } from '../../../audit-logs/application/record-audit-log-props';
import { EntityType } from '../../../audit-logs/domain/enums/entity-type.enum';
import { type ActorHeaders } from '../../../../shared/types/actor-headers';
import { DeactivateUserCommand } from '../../../users/application/commands/deactivate-user/deactivate-user.command';

/**
 * Shared status transition for every endpoint that can change employee status.
 * The caller is responsible for persisting the employee; this service records
 * the audit entry and triggers the deactivation side effect on resignation.
 */
@Injectable()
export class EmployeeStatusTransitionService {
  public constructor(private readonly commandBus: CommandBus) {}

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

    await this.commandBus.execute(
      new RecordAuditLogCommand(
        recordAuditProps(headers, {
          action: 'update',
          entityType: EntityType.EMPLOYEES,
          entityId: employee.getId(),
          before: { status: previousStatus },
          after: { status: nextStatus },
        }),
      ),
    );

    if (nextStatus === EmployeeStatus.RESIGNED) {
      await this.commandBus.execute(
        new DeactivateUserCommand(employee.getUserId(), headers),
      );
    }

    return true;
  }
}
