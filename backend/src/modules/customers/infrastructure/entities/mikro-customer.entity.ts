import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { CustomerGender } from '../../domain/enums/customer-gender.enum';

@Entity({ tableName: 'customers' })
export class MikroCustomer {
  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @PrimaryKey({ fieldName: 'user_id', type: 'string' })
  userId!: string;

  @Property({ type: 'string', nullable: true })
  gender!: CustomerGender | null;

  @Property({ fieldName: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth!: Date | null;

  @Property({
    fieldName: 'deleted_at',
    type: 'timestamptz',
    nullable: true,
    default: null,
  })
  deletedAt!: Date | null;

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
