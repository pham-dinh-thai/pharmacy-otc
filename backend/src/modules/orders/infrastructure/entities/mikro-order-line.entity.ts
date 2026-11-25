import {
  Entity,
  Index,
  ManyToOne,
  PrimaryKey,
  Property,
  Unique,
} from '@mikro-orm/decorators/legacy';
import { MikroProduct } from '../../../products/infrastructure/entities/mikro-product.entity';
import { MikroOrder } from './mikro-order.entity';

@Entity({ tableName: 'order_lines' })
@Unique({ properties: ['orderId', 'productId'] })
@Index({ name: 'order_lines_order_id_idx', properties: ['orderId'] })
export class MikroOrderLine {
  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @ManyToOne(() => MikroOrder, {
    fieldName: 'order_id',
    mapToPk: true,
    updateRule: 'cascade',
    deleteRule: 'cascade',
  })
  orderId!: string;

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
