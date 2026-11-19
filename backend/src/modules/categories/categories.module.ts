import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { CATEGORIES_REPOSITORY } from './domain/categories.repository';
import { MikroCategoriesRepository } from './infrastructure/repositories/mikro-categories.repository';
import { MikroCategory } from './infrastructure/entities/mikro-category.entity';
import { MikroProductCategory } from './infrastructure/entities/mikro-product-category.entity';
import { GetCategoriesHandler } from './application/queries/get-categories/get-categories.handler';
import { GetCategoryHandler } from './application/queries/get-category/get-category.handler';
import { CreateCategoryHandler } from './application/commands/create-category/create-category.handler';
import { UpdateCategoryHandler } from './application/commands/update-category/update-category.handler';
import { DeleteCategoryHandler } from './application/commands/delete-category/delete-category.handler';
import { RestoreCategoryHandler } from './application/commands/restore-category/restore-category.handler';
import { CategoriesController } from './presentation/categories/categories.controller';
import { SecurityModule } from '../../shared/modules/security/security.module';
import { OutBoxModule } from '../../shared/modules/outbox/outbox.module';

@Module({
  imports: [
    MikroOrmModule.forFeature([MikroCategory, MikroProductCategory]),
    SecurityModule,
    OutBoxModule,
  ],
  controllers: [CategoriesController],
  providers: [
    { provide: CATEGORIES_REPOSITORY, useClass: MikroCategoriesRepository },
    GetCategoriesHandler,
    GetCategoryHandler,
    CreateCategoryHandler,
    UpdateCategoryHandler,
    DeleteCategoryHandler,
    RestoreCategoryHandler,
  ],
  exports: [CATEGORIES_REPOSITORY],
})
export class CategoriesModule {}
