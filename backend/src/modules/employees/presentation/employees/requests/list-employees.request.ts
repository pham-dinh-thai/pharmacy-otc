import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { trimToNull } from '../../../../../shared/utils/list-filters';
import { EmployeePosition } from '../../../domain/enums/employee-position.enum';
import { EmployeeStatus } from '../../../domain/enums/employee-status.enum';

export class ListEmployeesRequest {
  @Transform(trimToNull)
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;

  @Transform(trimToNull)
  @IsOptional()
  @IsUUID('4')
  departmentId?: string;

  @Transform(trimToNull)
  @IsOptional()
  @IsEnum(EmployeePosition)
  position?: EmployeePosition;

  @Transform(trimToNull)
  @IsOptional()
  @IsEnum(EmployeeStatus)
  status?: EmployeeStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
