import { describe, expect, it, jest } from '@jest/globals';
import { ProductNotFoundException } from '../../products/domain/exceptions/product.exceptions';
import type { StorefrontService } from '../application/storefront.service';
import type { StorefrontProduct } from '../application/storefront.read-model';
import { StorefrontController } from './storefront.controller';

const PRODUCT_ID = '642b3190-9e97-4ce3-8533-894bc879b4fc';

const product: StorefrontProduct = {
  id: PRODUCT_ID,
  name: 'Sản phẩm A',
  sku: 'SP-A',
  unit: 'hộp',
  unitPrice: '25000',
  imageUrl: null,
  description: null,
  warning: null,
  stockQuantity: 3,
  inStock: true,
  categories: [],
};

const setup = () => {
  const listCategories = jest
    .fn<StorefrontService['listCategories']>()
    .mockResolvedValue([]);
  const listProducts = jest
    .fn<StorefrontService['listProducts']>()
    .mockResolvedValue({ items: [product], total: 1, page: 1, limit: 20 });
  const getProduct = jest
    .fn<StorefrontService['getProduct']>()
    .mockResolvedValue(product);
  const controller = new StorefrontController({
    listCategories,
    listProducts,
    getProduct,
  } as unknown as StorefrontService);

  return { controller, listCategories, listProducts, getProduct };
};

describe('StorefrontController', () => {
  it('lists categories without authentication metadata', async () => {
    const { controller, listCategories } = setup();

    await expect(controller.listCategories()).resolves.toEqual([]);
    expect(listCategories).toHaveBeenCalled();
  });

  it('maps public query params to the service', async () => {
    const { controller, listProducts } = setup();

    await controller.listProducts({
      q: 'cảm cúm',
      category: PRODUCT_ID,
      page: 2,
      limit: 12,
    });

    expect(listProducts).toHaveBeenCalledWith({
      search: 'cảm cúm',
      categoryId: PRODUCT_ID,
      page: 2,
      limit: 12,
    });
  });

  it('returns a public product detail', async () => {
    const { controller, getProduct } = setup();

    await expect(controller.getProduct(PRODUCT_ID)).resolves.toBe(product);
    expect(getProduct).toHaveBeenCalledWith(PRODUCT_ID);
  });

  it('maps a missing or deleted product to 404', async () => {
    const { controller, getProduct } = setup();
    getProduct.mockResolvedValue(null);

    await expect(controller.getProduct(PRODUCT_ID)).rejects.toThrow(
      ProductNotFoundException,
    );
  });
});
