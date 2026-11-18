import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { EmployeeStatus } from '../../../domain/enums/employee-status.enum';
import { EmployeePosition } from '../../../domain/enums/employee-position.enum';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class UpdateEmployeeRequest {
  @Transform(trim)
  @IsUUID('4')
  departmentId!: string;

  @Transform(trim)
  @IsOptional()
  @IsEnum(EmployeePosition)
  position?: EmployeePosition | null;

  @IsOptional()
  @IsEnum(EmployeeStatus)
  status?: EmployeeStatus;
}
