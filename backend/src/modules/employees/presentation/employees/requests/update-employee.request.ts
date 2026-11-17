import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { EmployeeStatus } from '../../../domain/enums/employee-status.enum';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class UpdateEmployeeRequest {
  @Transform(trim)
  @IsUUID('4')
  departmentId!: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(255)
  position?: string | null;

  @IsOptional()
  @IsEnum(EmployeeStatus)
  status?: EmployeeStatus;
}
