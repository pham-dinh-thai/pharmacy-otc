import {
  Entity,
  OneToOne,
  PrimaryKey,
  Property,
} from '@mikro-orm/decorators/legacy';
import { MikroUser } from '../../../users/infrastructure/entities/mikro-user.entity';

@Entity({ tableName: 'employees' })
export class MikroEmployee {
  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @OneToOne(() => MikroUser, {
    fieldName: 'user_id',
    mapToPk: true,
    owner: true,
    updateRule: 'cascade',
    deleteRule: 'cascade',
  })
  userId!: string;

  @Property({ fieldName: 'department_id', type: 'uuid' })
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
