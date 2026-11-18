import { Command } from '@nestjs/cqrs';
import { type ActorHeaders } from '../../../../../shared/types/actor-headers';
import { type EmployeeStatus } from '../../../domain/enums/employee-status.enum';
import { type EmployeePosition } from '../../../domain/enums/employee-position.enum';

export class UpdateEmployeeCommand extends Command<{
  id: string;
  departmentId: string;
  position: EmployeePosition | null;
  status: EmployeeStatus;
}> {
  public constructor(
    public readonly employeeId: string,
    public readonly departmentId: string,
    public readonly position: EmployeePosition | null | undefined,
    public readonly status: EmployeeStatus | undefined,
    public readonly headers: ActorHeaders,
  ) {
    super();
  }
}
