import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { CATEGORIES_REPOSITORY } from './domain/categories.repository';
import { MikroCategoriesRepository } from './infrastructure/repositories/mikro-categories.repository';
import { MikroCategory } from './infrastructure/entities/mikro-category.entity';
import { MikroProductCategory } from './infrastructure/entities/mikro-product-category.entity';

@Module({
  imports: [MikroOrmModule.forFeature([MikroCategory, MikroProductCategory])],
  providers: [
    { provide: CATEGORIES_REPOSITORY, useClass: MikroCategoriesRepository },
  ],
  exports: [CATEGORIES_REPOSITORY],
})
export class CategoriesModule {}
