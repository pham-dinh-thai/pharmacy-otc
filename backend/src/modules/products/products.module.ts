import { Module } from '@nestjs/common';
import { PRODUCTS_REPOSITORY } from './domain/products.repository';
import { MikroProductsRepository } from './infrastructure/repositories/mikro-products.repository';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MikroProduct } from './infrastructure/entities/mikro-product.entity';
import { ProductsController } from './presentation/products/products.controller';
import { CreateProductHandler } from './application/commands/create-product/create-product.handler';
import { UpdateProductHandler } from './application/commands/update-product/update-product.handler';
import { DeleteProductHandler } from './application/commands/delete-product/delete-product.handler';
import { RestoreProductHandler } from './application/commands/restore-product/restore-product.handler';
import { GetProductHandler } from './application/queries/get-product/get-product.handler';
import { GetProductsHandler } from './application/queries/get-products/get-products.handler';
import { SecurityModule } from '../../shared/modules/security/security.module';
import { CategoriesModule } from '../categories/categories.module';

@Module({
  imports: [
    MikroOrmModule.forFeature([MikroProduct]),
    SecurityModule,
    CategoriesModule,
  ],
  providers: [
    { provide: PRODUCTS_REPOSITORY, useClass: MikroProductsRepository },
    CreateProductHandler,
    UpdateProductHandler,
    DeleteProductHandler,
    RestoreProductHandler,
    GetProductHandler,
    GetProductsHandler,
  ],
  controllers: [ProductsController],
  exports: [PRODUCTS_REPOSITORY],
})
export class ProductsModule {}
