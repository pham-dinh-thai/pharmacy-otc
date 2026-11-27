import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module';
import { SecurityModule } from '../../shared/modules/security/security.module';
import { CreatePaymentHandler } from './application/commands/create-payment/create-payment.handler';
import { GetPaymentGatewayHandler } from './application/queries/get-payment-gateway/get-payment-gateway.handler';
import { PAYMENTS_REPOSITORY } from './domain/payments.repository';
import { MikroPayment } from './infrastructure/entities/mikro-payment.entity';
import { MikroPaymentsRepository } from './infrastructure/repositories/mikro-payments.repository';
import { PaymentsController } from './presentation/payments/payments.controller';

@Module({
  imports: [
    MikroOrmModule.forFeature([MikroPayment]),
    SecurityModule,
    OrdersModule,
  ],
  controllers: [PaymentsController],
  providers: [
    { provide: PAYMENTS_REPOSITORY, useClass: MikroPaymentsRepository },
    CreatePaymentHandler,
    GetPaymentGatewayHandler,
  ],
  exports: [PAYMENTS_REPOSITORY],
})
export class PaymentsModule {}
