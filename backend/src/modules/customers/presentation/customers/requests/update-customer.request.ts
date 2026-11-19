import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { CustomerGender } from '../../../domain/enums/customer-gender.enum';
import {
  CustomerAddressRequest,
  CustomerPhoneRequest,
} from './customer-contact.request';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class UpdateCustomerRequest {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  firstName!: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  lastName!: string;

  @Transform(trim)
  @IsString()
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @Transform(trim)
  @IsOptional()
  @IsIn(Object.values(CustomerGender))
  gender?: CustomerGender | null;

  @Transform(trim)
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  dateOfBirth?: string | null;

  @Type(() => CustomerPhoneRequest)
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  phones!: CustomerPhoneRequest[];

  @Type(() => CustomerAddressRequest)
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  addresses!: CustomerAddressRequest[];
}
