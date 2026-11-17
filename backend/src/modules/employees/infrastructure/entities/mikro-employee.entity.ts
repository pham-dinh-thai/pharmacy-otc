import {
  Entity,
  ManyToOne,
  PrimaryKey,
  Property,
  Unique,
} from '@mikro-orm/decorators/legacy';
import { MikroUser } from '../../../users/infrastructure/entities/mikro-user.entity';
import { MikroDepartment } from '../../../departments/infrastructure/entities/mikro-department.entity';

@Entity({ tableName: 'employees' })
@Unique({ properties: 'userId' })
export class MikroEmployee {
  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @ManyToOne(() => MikroUser, {
    fieldName: 'user_id',
    mapToPk: true,
    updateRule: 'cascade',
    deleteRule: 'cascade',
  })
  userId!: string;

  @ManyToOne(() => MikroDepartment, {
    fieldName: 'department_id',
    mapToPk: true,
    updateRule: 'cascade',
    deleteRule: 'no action',
  })
  departmentId!: string;

  @Property({
    type: 'timestamptz',
    fieldName: 'created_at',
    onCreate: () => new Date(),
  })
  createdAt = new Date();

  @Property({
    type: 'timestamptz',
    fieldName: 'updated_at',
    onCreate: () => new Date(),
    onUpdate: () => new Date(),
  })
  updatedAt = new Date();
}
