import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

@Entity({ tableName: 'categories' })
export class MikroCategory {
  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @Property({ type: 'string', unique: true })
  name!: string;

  @Property({ type: 'string', unique: true })
  slug!: string;

  @Property({ type: 'string', nullable: true })
  description!: string | null;

  @Property({
    fieldName: 'deleted_at',
    type: 'timestamptz',
    nullable: true,
    default: null,
  })
  deletedAt!: Date | null;

  @Property({
    fieldName: 'created_at',
    type: 'timestamptz',
    onCreate: () => new Date(),
  })
  createdAt = new Date();

  @Property({
    fieldName: 'updated_at',
    type: 'timestamptz',
    onCreate: () => new Date(),
    onUpdate: () => new Date(),
  })
  updatedAt = new Date();
}
