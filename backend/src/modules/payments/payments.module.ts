import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module';
import { SecurityModule } from '../../shared/modules/security/security.module';
import { CreatePaymentHandler } from './application/commands/create-payment/create-payment.handler';
import { HandleSepayIpnHandler } from './application/commands/handle-sepay-ipn/handle-sepay-ipn.handler';
import { GetPaymentGatewayHandler } from './application/queries/get-payment-gateway/get-payment-gateway.handler';
import { PAYMENTS_REPOSITORY } from './domain/payments.repository';
import { MikroPayment } from './infrastructure/entities/mikro-payment.entity';
import { MikroPaymentsRepository } from './infrastructure/repositories/mikro-payments.repository';
import { PaymentsController } from './presentation/payments/payments.controller';
import { SepayIpnController } from './presentation/payments/sepay-ipn.controller';
import { SepayIpnGuard } from './presentation/payments/sepay-ipn.guard';

@Module({
  imports: [
    MikroOrmModule.forFeature([MikroPayment]),
    SecurityModule,
    OrdersModule,
  ],
  controllers: [PaymentsController, SepayIpnController],
  providers: [
    { provide: PAYMENTS_REPOSITORY, useClass: MikroPaymentsRepository },
    CreatePaymentHandler,
    GetPaymentGatewayHandler,
    HandleSepayIpnHandler,
    SepayIpnGuard,
  ],
  exports: [PAYMENTS_REPOSITORY],
})
export class PaymentsModule {}
