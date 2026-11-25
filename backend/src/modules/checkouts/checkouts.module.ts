import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { OutBoxModule } from '../../shared/modules/outbox/outbox.module';
import { SecurityModule } from '../../shared/modules/security/security.module';
import { CartsModule } from '../carts/carts.module';
import { ProductsModule } from '../products/products.module';
import { ConfirmCheckoutHandler } from './application/commands/confirm-checkout/confirm-checkout.handler';
import { CreateCheckoutHandler } from './application/commands/create-checkout/create-checkout.handler';
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
    OutBoxModule,
    SecurityModule,
    CartsModule,
    ProductsModule,
  ],
  controllers: [CheckoutsController],
  providers: [
    { provide: CHECKOUTS_REPOSITORY, useClass: MikroCheckoutsRepository },
    { provide: CHECKOUT_CATALOG, useClass: ProductsCheckoutCatalogAdapter },
    CreateCheckoutHandler,
    ConfirmCheckoutHandler,
  ],
  exports: [CHECKOUTS_REPOSITORY],
})
export class CheckoutsModule {}
