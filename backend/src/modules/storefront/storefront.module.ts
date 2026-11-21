import { Module } from '@nestjs/common';
import { CategoriesModule } from '../categories/categories.module';
import { ProductsModule } from '../products/products.module';
import { StorefrontService } from './application/storefront.service';
import { StorefrontController } from './presentation/storefront.controller';

@Module({
  imports: [ProductsModule, CategoriesModule],
  controllers: [StorefrontController],
  providers: [StorefrontService],
})
export class StorefrontModule {}
