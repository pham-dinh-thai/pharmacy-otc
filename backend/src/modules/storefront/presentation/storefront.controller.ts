import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ProductNotFoundException } from '../../products/domain/exceptions/product.exceptions';
import { StorefrontService } from '../application/storefront.service';
import type {
  StorefrontCategory,
  StorefrontProduct,
  StorefrontProductPage,
} from '../application/storefront.read-model';
import { ListStorefrontProductsRequest } from './requests/list-storefront-products.request';

/** Unauthenticated, read-only API for the public storefront. */
@Controller('storefront')
export class StorefrontController {
  public constructor(private readonly service: StorefrontService) {}

  @Get('categories')
  public listCategories(): Promise<StorefrontCategory[]> {
    return this.service.listCategories();
  }

  @Get('products')
  public listProducts(
    @Query() query: ListStorefrontProductsRequest,
  ): Promise<StorefrontProductPage> {
    return this.service.listProducts({
      search: query.q,
      categoryId: query.category,
      page: query.page,
      limit: query.limit,
    });
  }

  @Get('products/:id')
  public async getProduct(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<StorefrontProduct> {
    const product = await this.service.getProduct(id);

    if (!product) {
      throw new ProductNotFoundException(id);
    }

    return product;
  }
}
