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

  public static toMikro(employee: Employee): MikroEmployee {
    return EmployeeMapper.assign(new MikroEmployee(), employee);
  }

  public static assign(
    mikroEmployee: MikroEmployee,
    employee: Employee,
  ): MikroEmployee {
    mikroEmployee.id = employee.getId();
    mikroEmployee.userId = employee.getUserId();
    mikroEmployee.departmentId = employee.getDepartmentId();
    mikroEmployee.position = employee.getPosition();
    mikroEmployee.status = employee.getStatus();

    return mikroEmployee;
  }
}
