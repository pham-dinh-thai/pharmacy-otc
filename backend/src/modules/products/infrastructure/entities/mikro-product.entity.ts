import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

@Entity({ tableName: 'products' })
export class MikroProduct {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @Property({ type: 'string' })
  name!: string;

  @Property({
    fieldName: 'unit_price',
    type: 'bigint',
  })
  unitPrice!: bigint;

  @Property({
    type: 'string',
    length: 100,
    nullable: true,
    unique: true,
  })
  sku!: string | null;

  @Property({ type: 'string', length: 50, nullable: true })
  unit!: string | null;

  @Property({ type: 'text', nullable: true })
  description!: string | null;

  @Property({
    fieldName: 'image_url',
    type: 'string',
    length: 2048,
    nullable: true,
  })
  imageUrl!: string | null;

  @Property({
    fieldName: 'expiry_date',
    type: 'date',
    nullable: true,
  })
  expiryDate!: Date | null;

  @Property({ type: 'text', nullable: true })
  warning!: string | null;

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
