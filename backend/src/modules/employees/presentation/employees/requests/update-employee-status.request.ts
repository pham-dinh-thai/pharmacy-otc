import { IsEnum } from 'class-validator';
import { EmployeeStatus } from '../../../domain/enums/employee-status.enum';

export class UpdateEmployeeStatusRequest {
  @IsEnum(EmployeeStatus)
  status!: EmployeeStatus;
}
