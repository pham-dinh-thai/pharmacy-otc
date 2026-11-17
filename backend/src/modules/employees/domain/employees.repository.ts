import { Employee } from './employee.aggregate';
import { EmployeeStatus } from './enums/employee-status.enum';

export const EMPLOYEES_REPOSITORY = 'EMPLOYEES_REPOSITORY';

export interface IEmployeesRepository {
  findAll(): Promise<Employee[]>;

  findById(id: string): Promise<Employee | null>;

  findStatusByUserId(userId: string): Promise<EmployeeStatus | null>;

  create(employee: Employee): Promise<Employee>;

  update(employee: Employee): Promise<void>;
}
