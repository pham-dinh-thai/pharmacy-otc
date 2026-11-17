import { Command } from '@nestjs/cqrs';
import type { ActorHeaders } from '../../../../../shared/types/actor-headers';
import type { EmployeeStatus } from '../../../domain/enums/employee-status.enum';

export class UpdateEmployeeStatusCommand extends Command<{
  id: string;
  status: EmployeeStatus;
}> {
  public constructor(
    public readonly employeeId: string,
    public readonly status: EmployeeStatus,
    public readonly headers: ActorHeaders,
  ) {
    super();
  }
}
