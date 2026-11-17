import { Command } from '@nestjs/cqrs';
import { type ActorHeaders } from '../../../../../shared/types/actor-headers';
import { type EmployeeStatus } from '../../../domain/enums/employee-status.enum';

export class UpdateEmployeeCommand extends Command<{
  id: string;
  departmentId: string;
  position: string | null;
  status: EmployeeStatus;
}> {
  public constructor(
    public readonly employeeId: string,
    public readonly departmentId: string,
    public readonly position: string | null | undefined,
    public readonly status: EmployeeStatus | undefined,
    public readonly headers: ActorHeaders,
  ) {
    super();
  }
}
