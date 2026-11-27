import {
  Entity,
  Enum,
  Index,
  ManyToOne,
  PrimaryKey,
  Property,
  Unique,
} from '@mikro-orm/decorators/legacy';
import { MikroOrder } from '../../../orders/infrastructure/entities/mikro-order.entity';
import { PaymentProvider } from '../../domain/enums/payment-provider.enum';
import { PaymentStatus } from '../../domain/enums/payment-status.enum';

@Entity({ tableName: 'payments' })
@Unique({ properties: ['transactionRef'] })
@Index({ name: 'payments_order_id_idx', properties: ['orderId'] })
export class MikroPayment {
  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @ManyToOne(() => MikroOrder, {
    fieldName: 'order_id',
    mapToPk: true,
    updateRule: 'cascade',
    deleteRule: 'cascade',
  })
  orderId!: string;

  @Enum({ items: () => PaymentProvider })
  provider!: PaymentProvider;

  @Enum({ items: () => PaymentStatus })
  status!: PaymentStatus;

  @Property({ type: 'bigint' })
  amount!: bigint;

  @Property({ fieldName: 'transaction_ref', type: 'string', length: 255 })
  transactionRef!: string;

  @Property({
    fieldName: 'provider_transaction_no',
    type: 'string',
    length: 255,
    nullable: true,
  })
  providerTransactionNo!: string | null;

  @Property({
    fieldName: 'bank_code',
    type: 'string',
    length: 50,
    nullable: true,
  })
  bankCode!: string | null;

  @Property({
    fieldName: 'response_code',
    type: 'string',
    length: 20,
    nullable: true,
  })
  responseCode!: string | null;

  @Property({ type: 'jsonb', nullable: true })
  providerPayload!: Record<string, unknown> | null;

  @Property({ fieldName: 'paid_at', type: 'timestamptz', nullable: true })
  paidAt!: Date | null;

  @Property({ fieldName: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt!: Date | null;

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
