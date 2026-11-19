import 'reflect-metadata';
import { describe, expect, it } from '@jest/globals';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ListProductsRequest } from './list-products.request';

const CATEGORY_ID = '9b781a20-0ab6-494a-9bfd-e475e07c7a17';

const validateRequest = async (payload: Record<string, unknown>) => {
  const instance = plainToInstance(ListProductsRequest, payload);
  const errors = await validate(instance, { whitelist: true });

  return { instance, errors };
};

describe('ListProductsRequest', () => {
  it('defaults deleted and inStock to all', async () => {
    const { instance, errors } = await validateRequest({});

    expect(errors).toHaveLength(0);
    expect(instance.deleted).toBe('all');
    expect(instance.inStock).toBe('all');
  });

  it('parses tri-state filters and trims optional values', async () => {
    const { instance, errors } = await validateRequest({
      deleted: 'false',
      inStock: 'true',
      search: '  Thuốc OTC  ',
      categoryId: ` ${CATEGORY_ID} `,
      minPrice: ' 1000 ',
      maxPrice: ' 2000 ',
      page: '2',
      limit: '10',
    });

    expect(errors).toHaveLength(0);
    expect(instance).toMatchObject({
      deleted: false,
      inStock: true,
      search: 'Thuốc OTC',
      categoryId: CATEGORY_ID,
      minPrice: '1000',
      maxPrice: '2000',
      page: 2,
      limit: 10,
    });
  });

  it('rejects an invalid category id or non-integer price bound', async () => {
    const { errors } = await validateRequest({
      categoryId: 'not-a-uuid',
      minPrice: '1.5',
    });

    expect(errors.map((error) => error.property).sort()).toEqual([
      'categoryId',
      'minPrice',
    ]);
  });
});
