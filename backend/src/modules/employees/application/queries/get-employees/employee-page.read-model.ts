import { EmployeeReadModel } from '../employee.read-model';

export class EmployeePageReadModel {
  public constructor(
    public readonly items: EmployeeReadModel[],
    public readonly total: number,
    public readonly page: number,
    public readonly limit: number,
  ) {}
}
