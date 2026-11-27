import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { SecurityModule } from '../../shared/modules/security/security.module';
import { CartsModule } from '../carts/carts.module';
import { ProductsModule } from '../products/products.module';
import { ConfirmCheckoutHandler } from './application/commands/confirm-checkout/confirm-checkout.handler';
import { CreateCheckoutHandler } from './application/commands/create-checkout/create-checkout.handler';
import {
  ONLINE_PAYMENT_REQUEST_STRATEGIES,
  type IOnlinePaymentRequestStrategy,
} from './application/commands/confirm-checkout/strategies/online-payment-request.strategy';
import { OnlinePaymentRequestStrategyResolver } from './application/commands/confirm-checkout/strategies/online-payment-request.strategy-resolver';
import { SepayPaymentRequestStrategy } from './application/commands/confirm-checkout/strategies/sepay-payment-request.strategy';
import { VietQrPaymentRequestStrategy } from './application/commands/confirm-checkout/strategies/vietqr-payment-request.strategy';
import { ZalopayPaymentRequestStrategy } from './application/commands/confirm-checkout/strategies/zalopay-payment-request.strategy';
import { UpdateCheckoutHandler } from './application/commands/update-checkout/update-checkout.handler';
import { GetCheckoutHandler } from './application/queries/get-checkout/get-checkout.handler';
import { CHECKOUT_CATALOG } from './application/ports/checkout-catalog.port';
import { CHECKOUTS_REPOSITORY } from './domain/checkouts.repository';
import { ProductsCheckoutCatalogAdapter } from './infrastructure/adapters/products-checkout-catalog.adapter';
import { MikroCheckout } from './infrastructure/entities/mikro-checkout.entity';
import { MikroCheckoutLine } from './infrastructure/entities/mikro-checkout-line.entity';
import { MikroCheckoutsRepository } from './infrastructure/repositories/mikro-checkouts.repository';
import { CheckoutsController } from './presentation/checkouts/checkouts.controller';

@Module({
  imports: [
    MikroOrmModule.forFeature([MikroCheckout, MikroCheckoutLine]),
    SecurityModule,
    CartsModule,
    ProductsModule,
  ],
  controllers: [CheckoutsController],
  providers: [
    { provide: CHECKOUTS_REPOSITORY, useClass: MikroCheckoutsRepository },
    { provide: CHECKOUT_CATALOG, useClass: ProductsCheckoutCatalogAdapter },
    {
      provide: ONLINE_PAYMENT_REQUEST_STRATEGIES,
      useFactory: (
        sepay: IOnlinePaymentRequestStrategy,
        zalopay: IOnlinePaymentRequestStrategy,
        vietqr: IOnlinePaymentRequestStrategy,
      ): IOnlinePaymentRequestStrategy[] => [sepay, zalopay, vietqr],
      inject: [
        SepayPaymentRequestStrategy,
        ZalopayPaymentRequestStrategy,
        VietQrPaymentRequestStrategy,
      ],
    },
    SepayPaymentRequestStrategy,
    ZalopayPaymentRequestStrategy,
    VietQrPaymentRequestStrategy,
    OnlinePaymentRequestStrategyResolver,
    CreateCheckoutHandler,
    UpdateCheckoutHandler,
    ConfirmCheckoutHandler,
    GetCheckoutHandler,
  ],
  exports: [CHECKOUTS_REPOSITORY],
})
export class CheckoutsModule {}
