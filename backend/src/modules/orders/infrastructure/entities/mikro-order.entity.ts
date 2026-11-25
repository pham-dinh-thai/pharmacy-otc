import {
  Entity,
  Enum,
  Index,
  ManyToOne,
  PrimaryKey,
  Property,
  Unique,
} from '@mikro-orm/decorators/legacy';
import { MikroUser } from '../../../users/infrastructure/entities/mikro-user.entity';
import { OrderPaymentStatus } from '../../domain/enums/order-payment-status.enum';
import { OrderStatus } from '../../domain/enums/order-status.enum';

@Entity({ tableName: 'orders' })
@Unique({ properties: ['checkoutId'] })
@Index({ name: 'orders_user_created_idx', properties: ['userId', 'createdAt'] })
export class MikroOrder {
  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @ManyToOne(() => MikroUser, {
    fieldName: 'user_id',
    mapToPk: true,
    updateRule: 'cascade',
    deleteRule: 'cascade',
  })
  userId!: string;

  @Property({ fieldName: 'checkout_id', type: 'uuid' })
  checkoutId!: string;

  @Property({ fieldName: 'shipping_name', type: 'string', length: 255 })
  shippingName!: string;

  @Property({ fieldName: 'shipping_address', type: 'text' })
  shippingAddress!: string;

  @Property({ fieldName: 'shipping_phone', type: 'string', length: 20 })
  shippingPhone!: string;

  @Property({ fieldName: 'shipping_fee', type: 'bigint' })
  shippingFee!: bigint;

  @Property({ type: 'text', nullable: true })
  note!: string | null;

  @Enum(() => OrderStatus)
  status!: OrderStatus;

  @Enum({ fieldName: 'payment_status', items: () => OrderPaymentStatus })
  paymentStatus!: OrderPaymentStatus;

  @Property({ fieldName: 'confirmed_at', type: 'timestamptz', nullable: true })
  confirmedAt!: Date | null;

  @Property({ fieldName: 'delivering_at', type: 'timestamptz', nullable: true })
  deliveringAt!: Date | null;

  @Property({ fieldName: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt!: Date | null;

  @Property({ fieldName: 'cancelled_at', type: 'timestamptz', nullable: true })
  cancelledAt!: Date | null;

  @Property({ fieldName: 'failed_at', type: 'timestamptz', nullable: true })
  failedAt!: Date | null;

  @Property({ fieldName: 'paid_at', type: 'timestamptz', nullable: true })
  paidAt!: Date | null;

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
