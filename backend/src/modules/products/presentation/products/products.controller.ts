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
import { CreateProductCommand } from '../../application/commands/create-product/create-product.command';
import { UpdateProductCommand } from '../../application/commands/update-product/update-product.command';
import { DeleteProductCommand } from '../../application/commands/delete-product/delete-product.command';
import { RestoreProductCommand } from '../../application/commands/restore-product/restore-product.command';
import { GetProductQuery } from '../../application/queries/get-product/get-product.query';
import { ProductDetailReadModel } from '../../application/queries/get-product/product-detail.read-model';
import { GetProductsQuery } from '../../application/queries/get-products/get-products.query';
import { ProductListPageReadModel } from '../../application/queries/get-products/product-list-page.read-model';
import { CreateProductRequest } from './requests/create-product.request';
import { UpdateProductRequest } from './requests/update-product.request';
import { ListProductsRequest } from './requests/list-products.request';
import { AuthGuard } from '../../../../shared/modules/security/auth.guard';
import { PermissionsGuard } from '../../../../shared/modules/security/permissions.guard';
import { RequirePermissions } from '../../../../shared/modules/security/require-permissions.decorator';
import { ActorContext } from '../../../../shared/modules/security/actor-context.decorator';
import { type ActorHeaders } from '../../../../shared/types/actor-headers';

@Controller('products')
@UseGuards(AuthGuard, PermissionsGuard)
export class ProductsController {
  private readonly logger = new Logger(ProductsController.name);

  public constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @RequirePermissions(['products:read'])
  public findAll(
    @Query() request: ListProductsRequest,
  ): Promise<ProductListPageReadModel> {
    return this.queryBus.execute(
      new GetProductsQuery(
        request.search,
        request.deleted,
        request.categoryId,
        request.inStock,
        request.minPrice,
        request.maxPrice,
        request.page,
        request.limit,
      ),
    );
  }

  @Get(':id')
  @RequirePermissions(['products:read'])
  public findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<ProductDetailReadModel> {
    return this.queryBus.execute(new GetProductQuery(id));
  }

  @Post()
  @RequirePermissions(['products:create'])
  public create(
    @Body() request: CreateProductRequest,
    @ActorContext() headers: ActorHeaders,
  ): Promise<{ id: string }> {
    const response = this.commandBus.execute(
      new CreateProductCommand(
        request.name,
        request.unitPrice,
        request.quantity,
        request.categoryIds ?? [],
        headers,
        {
          sku: request.sku,
          unit: request.unit,
          description: request.description,
          imageUrl: request.imageUrl,
          expiryDate: request.expiryDate,
          warning: request.warning,
        },
      ),
    );

    this.logger.log(`Product created`);

    return response;
  }

  @Patch(':id')
  @RequirePermissions(['products:update'])
  public update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() request: UpdateProductRequest,
    @ActorContext() headers: ActorHeaders,
  ): Promise<{ id: string }> {
    const response = this.commandBus.execute(
      new UpdateProductCommand(
        id,
        request.name,
        request.unitPrice,
        request.quantity,
        request.categoryIds ?? [],
        headers,
        {
          sku: request.sku,
          unit: request.unit,
          description: request.description,
          imageUrl: request.imageUrl,
          expiryDate: request.expiryDate,
          warning: request.warning,
        },
      ),
    );

    this.logger.log(`Product ${id} updated`, response);

    return response;
  }

  @Delete(':id')
  @RequirePermissions(['products:delete'])
  public delete(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @ActorContext() headers: ActorHeaders,
  ): Promise<{ id: string }> {
    const response = this.commandBus.execute(
      new DeleteProductCommand(id, headers),
    );

    this.logger.log(`Product ${id} deleted`);

    return response;
  }

  @Patch(':id/restore')
  @RequirePermissions(['products:delete'])
  public restore(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @ActorContext() headers: ActorHeaders,
  ): Promise<{ id: string }> {
    const response = this.commandBus.execute(
      new RestoreProductCommand(id, headers),
    );

    this.logger.log(`Product ${id} restored`);

    return response;
  }
}
