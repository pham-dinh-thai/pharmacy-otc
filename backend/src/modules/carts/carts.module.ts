import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { SecurityModule } from '../../shared/modules/security/security.module';
import { StorefrontModule } from '../storefront/storefront.module';
import { CartsService } from './application/carts.service';
import { CARTS_REPOSITORY } from './domain/carts.repository';
import { MikroCart } from './infrastructure/entities/mikro-cart.entity';
import { MikroCartItem } from './infrastructure/entities/mikro-cart-item.entity';
import { MikroCartsRepository } from './infrastructure/repositories/mikro-carts.repository';
import { CartIdentityResolver } from './presentation/cart-identity.resolver';
import { CartsController } from './presentation/carts.controller';

@Module({
  imports: [
    MikroOrmModule.forFeature([MikroCart, MikroCartItem]),
    StorefrontModule,
    SecurityModule,
  ],
  controllers: [CartsController],
  providers: [
    CartsService,
    CartIdentityResolver,
    { provide: CARTS_REPOSITORY, useClass: MikroCartsRepository },
  ],
  exports: [CartsService],
})
export class CartsModule {}
