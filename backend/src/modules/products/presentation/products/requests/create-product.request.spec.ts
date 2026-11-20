import 'reflect-metadata';
import { describe, expect, it } from '@jest/globals';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateProductRequest } from './create-product.request';

const CATEGORY_ID = '9b781a20-0ab6-494a-9bfd-e475e07c7a17';

const validateRequest = async (payload: Record<string, unknown>) => {
  const instance = plainToInstance(CreateProductRequest, payload);
  const errors = await validate(instance, { whitelist: true });

  return { instance, errors };
};

describe('CreateProductRequest', () => {
  it('trims category ids', async () => {
    const { instance, errors } = await validateRequest({
      name: '  Thuốc OTC  ',
      unitPrice: '12500',
      categoryIds: [` ${CATEGORY_ID} `, '   '],
    });

    expect(errors).toHaveLength(0);
    expect(instance.name).toBe('Thuốc OTC');
    expect(instance.categoryIds).toEqual([CATEGORY_ID]);
  });

  it('rejects category ids that are not UUID v4', async () => {
    const { errors } = await validateRequest({
      name: 'Thuốc OTC',
      unitPrice: '12500',
      categoryIds: ['not-a-uuid'],
    });

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('categoryIds');
  });

  it('allows omitting category ids', async () => {
    const { instance, errors } = await validateRequest({
      name: 'Thuốc OTC',
      unitPrice: '12500',
    });

    expect(errors).toHaveLength(0);
    expect(instance.categoryIds).toBeUndefined();
  });
});
