import { Injectable } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { GetEmploymentStatusQuery } from '../../../employees/application/queries/get-employment-status/get-employment-status.query';
import { EmployeeStatus } from '../../../employees/domain/enums/employee-status.enum';
import { IGetEmploymentStatusPort } from '../../application/ports/get-employment-status.port';

@Injectable()
export class GetEmploymentStatusAdapter implements IGetEmploymentStatusPort {
  public constructor(private readonly queryBus: QueryBus) {}

  public async execute(userId: string): Promise<EmployeeStatus | null> {
    return this.queryBus.execute(new GetEmploymentStatusQuery(userId));
  }
}
