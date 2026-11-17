import { Employee } from './employee.aggregate';
import { EmployeeStatus } from './enums/employee-status.enum';

export const EMPLOYEES_REPOSITORY = 'EMPLOYEES_REPOSITORY';

export interface IEmployeesRepository {
  findById(id: string): Promise<Employee | null>;

  findStatusByUserId(userId: string): Promise<EmployeeStatus | null>;

  update(employee: Employee): Promise<void>;
}
