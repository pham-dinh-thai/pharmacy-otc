import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { GetCategoriesQuery } from '../../application/queries/get-categories/get-categories.query';
import { CategoryListPageReadModel } from '../../application/queries/get-categories/category-list-page.read-model';
import { GetCategoryQuery } from '../../application/queries/get-category/get-category.query';
import { CategoryDetailReadModel } from '../../application/queries/get-category/category-detail.read-model';
import { CreateCategoryCommand } from '../../application/commands/create-category/create-category.command';
import { UpdateCategoryCommand } from '../../application/commands/update-category/update-category.command';
import { DeleteCategoryCommand } from '../../application/commands/delete-category/delete-category.command';
import { RestoreCategoryCommand } from '../../application/commands/restore-category/restore-category.command';
import { ListCategoriesRequest } from './requests/list-categories.request';
import { CreateCategoryRequest } from './requests/create-category.request';
import { UpdateCategoryRequest } from './requests/update-category.request';
import { AuthGuard } from '../../../../shared/modules/security/auth.guard';
import { PermissionsGuard } from '../../../../shared/modules/security/permissions.guard';
import { RequirePermissions } from '../../../../shared/modules/security/require-permissions.decorator';
import { ActorContext } from '../../../../shared/modules/security/actor-context.decorator';
import { type ActorHeaders } from '../../../../shared/types/actor-headers';

@Controller('categories')
@UseGuards(AuthGuard, PermissionsGuard)
export class CategoriesController {
  private readonly logger = new Logger(CategoriesController.name);

  public constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

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

  @Get(':id')
  @RequirePermissions(['categories:read'])
  public findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<CategoryDetailReadModel> {
    return this.queryBus.execute(new GetCategoryQuery(id));
  }

  @Post()
  @RequirePermissions(['categories:create'])
  public create(
    @Body() request: CreateCategoryRequest,
    @ActorContext() headers: ActorHeaders,
  ): Promise<{ id: string }> {
    const response = this.commandBus.execute(
      new CreateCategoryCommand(
        request.name,
        request.slug ?? null,
        request.description ?? null,
        headers,
      ),
    );

    this.logger.log('Category created');

    return response;
  }

  @Patch(':id')
  @RequirePermissions(['categories:update'])
  public update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() request: UpdateCategoryRequest,
    @ActorContext() headers: ActorHeaders,
  ): Promise<{ id: string }> {
    const response = this.commandBus.execute(
      new UpdateCategoryCommand(
        id,
        request.name,
        request.slug ?? null,
        request.description ?? null,
        headers,
      ),
    );

    this.logger.log(`Category ${id} updated`, response);

    return response;
  }

  @Delete(':id')
  @RequirePermissions(['categories:delete'])
  public delete(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @ActorContext() headers: ActorHeaders,
  ): Promise<{ id: string }> {
    const response = this.commandBus.execute(
      new DeleteCategoryCommand(id, headers),
    );

    this.logger.log(`Category ${id} deleted`);

    return response;
  }

  @Patch(':id/restore')
  @RequirePermissions(['categories:delete'])
  public restore(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @ActorContext() headers: ActorHeaders,
  ): Promise<{ id: string }> {
    const response = this.commandBus.execute(
      new RestoreCategoryCommand(id, headers),
    );

    this.logger.log(`Category ${id} restored`);

    return response;
  }
}
