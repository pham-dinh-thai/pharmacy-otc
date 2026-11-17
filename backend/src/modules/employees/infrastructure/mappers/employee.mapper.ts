import { Employee } from '../../domain/employee.aggregate';
import { MikroEmployee } from '../entities/mikro-employee.entity';

export class EmployeeMapper {
  public static toDomain(mikroEmployee: MikroEmployee): Employee {
    return Employee.fromPersistent({
      id: mikroEmployee.id,
      userId: mikroEmployee.userId,
      departmentId: mikroEmployee.departmentId,
      position: mikroEmployee.position,
      status: mikroEmployee.status,
      createdAt: mikroEmployee.createdAt,
      updatedAt: mikroEmployee.updatedAt,
    });
  }
}
