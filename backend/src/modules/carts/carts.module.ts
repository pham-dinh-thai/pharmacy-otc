import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { SecurityModule } from '../../shared/modules/security/security.module';
import { StorefrontModule } from '../storefront/storefront.module';
import { AddCartItemHandler } from './application/commands/add-cart-item/add-cart-item.handler';
import { AddCartItemsHandler } from './application/commands/add-cart-items/add-cart-items.handler';
import { ClearCartHandler } from './application/commands/clear-cart/clear-cart.handler';
import { DeductCartItemsHandler } from './application/commands/deduct-cart-items/deduct-cart-items.handler';
import { RemoveCartItemHandler } from './application/commands/remove-cart-item/remove-cart-item.handler';
import { SetCartItemQuantityHandler } from './application/commands/set-cart-item-quantity/set-cart-item-quantity.handler';
import { GetCartHandler } from './application/queries/get-cart/get-cart.handler';
import { CART_CATALOG } from './application/ports/cart-catalog.port';
import { CARTS_REPOSITORY } from './domain/carts.repository';
import { StorefrontCartCatalogAdapter } from './infrastructure/adapters/storefront-cart-catalog.adapter';
import { MikroCart } from './infrastructure/entities/mikro-cart.entity';
import { MikroCartItem } from './infrastructure/entities/mikro-cart-item.entity';
import { MikroCartsRepository } from './infrastructure/repositories/mikro-carts.repository';
import { CartIdentityResolver } from './presentation/carts/cart-identity.resolver';
import { CartsController } from './presentation/carts/carts.controller';

@Module({
  imports: [
    MikroOrmModule.forFeature([MikroCart, MikroCartItem]),
    StorefrontModule,
    SecurityModule,
  ],
  controllers: [CartsController],
  providers: [
    { provide: CARTS_REPOSITORY, useClass: MikroCartsRepository },
    { provide: CART_CATALOG, useClass: StorefrontCartCatalogAdapter },
    CartIdentityResolver,
    AddCartItemHandler,
    AddCartItemsHandler,
    SetCartItemQuantityHandler,
    RemoveCartItemHandler,
    ClearCartHandler,
    DeductCartItemsHandler,
    GetCartHandler,
  ],
  exports: [CARTS_REPOSITORY],
})
export class CartsModule {}
