import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

@Entity({ tableName: 'carts' })
export class MikroCart {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @Property({
    fieldName: 'user_id',
    type: 'uuid',
    nullable: true,
    unique: true,
  })
  userId!: string | null;

  @Property({
    fieldName: 'guest_token',
    type: 'uuid',
    nullable: true,
    unique: true,
  })
  guestToken!: string | null;

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
