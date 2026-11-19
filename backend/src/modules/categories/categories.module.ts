import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { CATEGORIES_REPOSITORY } from './domain/categories.repository';
import { MikroCategoriesRepository } from './infrastructure/repositories/mikro-categories.repository';
import { MikroCategory } from './infrastructure/entities/mikro-category.entity';
import { MikroProductCategory } from './infrastructure/entities/mikro-product-category.entity';
import { GetCategoriesHandler } from './application/queries/get-categories/get-categories.handler';
import { CategoriesController } from './presentation/categories/categories.controller';
import { SecurityModule } from '../../shared/modules/security/security.module';

@Module({
  imports: [
    MikroOrmModule.forFeature([MikroCategory, MikroProductCategory]),
    SecurityModule,
  ],
  controllers: [CategoriesController],
  providers: [
    { provide: CATEGORIES_REPOSITORY, useClass: MikroCategoriesRepository },
    GetCategoriesHandler,
  ],
  exports: [CATEGORIES_REPOSITORY],
})
export class CategoriesModule {}
