import { Department } from '../../domain/department.aggregate';
import { MikroDepartment } from '../entities/mikro-department.entity';

export class DepartmentMapper {
  public static toDomain(mikroDepartment: MikroDepartment): Department {
    return Department.fromPersistent({
      id: mikroDepartment.id,
      name: mikroDepartment.name,
      deletedAt: mikroDepartment.deletedAt,
      createdAt: mikroDepartment.createdAt,
      updatedAt: mikroDepartment.updatedAt,
    });
  }

  public static toMikro(department: Department): MikroDepartment {
    return DepartmentMapper.assign(new MikroDepartment(), department);
  }

  public static assign(
    mikroDepartment: MikroDepartment,
    department: Department,
  ): MikroDepartment {
    mikroDepartment.id = department.getId();
    mikroDepartment.name = department.getName();
    mikroDepartment.deletedAt = department.getDeletedAt();

    return mikroDepartment;
  }
}
