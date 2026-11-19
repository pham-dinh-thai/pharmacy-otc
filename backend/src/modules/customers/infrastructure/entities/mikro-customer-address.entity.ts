import {
  Entity,
  Index,
  PrimaryKey,
  Property,
} from '@mikro-orm/decorators/legacy';

@Entity({ tableName: 'customer_addresses' })
@Index({
  name: 'customer_addresses_customer_id_index',
  properties: 'customerId',
})
export class MikroCustomerAddress {
  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @Property({ fieldName: 'customer_id', type: 'uuid' })
  customerId!: string;

  @Property({ type: 'string', length: 500 })
  address!: string;

  @Property({ fieldName: 'is_default', type: 'boolean', default: false })
  isDefault = false;

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
