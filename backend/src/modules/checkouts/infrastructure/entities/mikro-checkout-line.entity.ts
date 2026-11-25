import {
  Entity,
  ManyToOne,
  PrimaryKey,
  Property,
  Unique,
} from '@mikro-orm/decorators/legacy';
import { MikroProduct } from '../../../products/infrastructure/entities/mikro-product.entity';
import { MikroCheckout } from './mikro-checkout.entity';

@Entity({ tableName: 'checkout_lines' })
@Unique({ properties: ['checkoutId', 'productId'] })
export class MikroCheckoutLine {
  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @ManyToOne(() => MikroCheckout, {
    fieldName: 'checkout_id',
    mapToPk: true,
    updateRule: 'cascade',
    deleteRule: 'cascade',
  })
  checkoutId!: string;

  @ManyToOne(() => MikroProduct, {
    fieldName: 'product_id',
    mapToPk: true,
    updateRule: 'cascade',
    deleteRule: 'no action',
  })
  productId!: string;

  @Property({ fieldName: 'product_name', type: 'string', length: 255 })
  productName!: string;

  @Property({
    fieldName: 'product_sku',
    type: 'string',
    length: 100,
    nullable: true,
  })
  productSku!: string | null;

  @Property({ fieldName: 'unit_price', type: 'bigint' })
  unitPrice!: bigint;

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
