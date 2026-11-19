import {
  Entity,
  Index,
  PrimaryKey,
  Property,
} from '@mikro-orm/decorators/legacy';

@Entity({ tableName: 'customer_phones' })
@Index({ name: 'customer_phones_customer_id_index', properties: 'customerId' })
export class MikroCustomerPhone {
  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @Property({ fieldName: 'customer_id', type: 'uuid' })
  customerId!: string;

  @Property({ type: 'string', length: 30 })
  phone!: string;

  @Property({ fieldName: 'is_primary', type: 'boolean', default: false })
  isPrimary = false;

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
