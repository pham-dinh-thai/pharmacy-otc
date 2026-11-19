import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { GetCategoriesQuery } from '../../application/queries/get-categories/get-categories.query';
import { CategoryListPageReadModel } from '../../application/queries/get-categories/category-list-page.read-model';
import { ListCategoriesRequest } from './requests/list-categories.request';
import { AuthGuard } from '../../../../shared/modules/security/auth.guard';
import { PermissionsGuard } from '../../../../shared/modules/security/permissions.guard';
import { RequirePermissions } from '../../../../shared/modules/security/require-permissions.decorator';

/** Endpoint đọc danh mục phục vụ form sản phẩm; chưa có CRUD danh mục. */
@Controller('categories')
@UseGuards(AuthGuard, PermissionsGuard)
export class CategoriesController {
  public constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @RequirePermissions(['categories:read'])
  public findAll(
    @Query() request: ListCategoriesRequest,
  ): Promise<CategoryListPageReadModel> {
    return this.queryBus.execute(
      new GetCategoriesQuery(
        request.search,
        request.deleted,
        request.page,
        request.limit,
      ),
    );
  }
}
