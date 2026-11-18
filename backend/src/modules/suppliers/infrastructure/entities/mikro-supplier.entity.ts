import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

@Entity({ tableName: 'suppliers' })
export class MikroSupplier {
  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @Property({ type: 'string', unique: true })
  code!: string;

  @Property({ type: 'string' })
  name!: string;

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

  @Property({ type: 'string', nullable: true })
  phone!: string | null;

  @Property({ type: 'string', nullable: true })
  email!: string | null;

  @Property({ type: 'string', nullable: true })
  address!: string | null;

  @Property({
    type: 'string',
    fieldName: 'tax_code',
    nullable: true,
    unique: true,
  })
  taxCode!: string | null;
}
