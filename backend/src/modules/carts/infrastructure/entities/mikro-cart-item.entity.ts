import {
  Entity,
  ManyToOne,
  PrimaryKey,
  Property,
  Unique,
} from '@mikro-orm/decorators/legacy';
import { MikroCart } from './mikro-cart.entity';

@Entity({ tableName: 'cart_items' })
@Unique({ properties: ['cartId', 'productId'] })
export class MikroCartItem {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @ManyToOne(() => MikroCart, {
    fieldName: 'cart_id',
    mapToPk: true,
    updateRule: 'cascade',
    deleteRule: 'cascade',
  })
  cartId!: string;

  @Property({ fieldName: 'product_id', type: 'uuid' })
  productId!: string;

  @Property({ type: 'int' })
  quantity!: number;

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
