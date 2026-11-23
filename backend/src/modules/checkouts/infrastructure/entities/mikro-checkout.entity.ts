import {
  Entity,
  Enum,
  ManyToOne,
  PrimaryKey,
  Property,
} from '@mikro-orm/decorators/legacy';
import { MikroUser } from '../../../users/infrastructure/entities/mikro-user.entity';
import { CheckoutStatus } from '../../domain/enums/checkout-status.enum';

@Entity({ tableName: 'checkouts' })
export class MikroCheckout {
  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @ManyToOne(() => MikroUser, {
    fieldName: 'user_id',
    mapToPk: true,
    updateRule: 'cascade',
    deleteRule: 'cascade',
  })
  userId!: string;

  @Property({ fieldName: 'shipping_name', type: 'string' })
  shippingName!: string;

  @Property({ fieldName: 'shipping_address', type: 'text' })
  shippingAddress!: string;

  @Property({ fieldName: 'shipping_phone', type: 'string' })
  shippingPhone!: string;

  @Enum(() => CheckoutStatus)
  status!: CheckoutStatus;

  @Property({ fieldName: 'confirmed_at', type: 'timestamptz', nullable: true })
  confirmedAt!: Date | null;

  @Property({ fieldName: 'cancelled_at', type: 'timestamptz', nullable: true })
  cancelledAt!: Date | null;

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
