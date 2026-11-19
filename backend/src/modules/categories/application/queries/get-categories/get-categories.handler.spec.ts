import { describe, expect, it, jest } from '@jest/globals';
import { Category } from '../../../domain/category.aggregate';
import { GetCategoriesHandler } from './get-categories.handler';
import { GetCategoriesQuery } from './get-categories.query';

const CATEGORY_ID = '9b781a20-0ab6-494a-9bfd-e475e07c7a17';

const category = (): Category =>
  Category.fromPersistent({
    id: CATEGORY_ID,
    name: 'Thuốc OTC',
    slug: 'thuoc-otc',
    description: null,
    deletedAt: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  });

describe('GetCategoriesHandler', () => {
  it('maps the repository page and pagination', async () => {
    const findPage = jest
      .fn<(filters: unknown) => Promise<{ items: Category[]; total: number }>>()
      .mockResolvedValue({ items: [category()], total: 1 });
    const handler = new GetCategoriesHandler({
      findPage,
    } as never);

    const result = await handler.execute(
      new GetCategoriesQuery('OTC', false, 2, 10),
    );

    expect(findPage).toHaveBeenCalledWith({
      search: 'OTC',
      deleted: false,
      limit: 10,
      offset: 10,
    });
    expect(result).toMatchObject({ total: 1, page: 2, limit: 10 });
    expect(result.items[0]).toMatchObject({
      id: CATEGORY_ID,
      name: 'Thuốc OTC',
      slug: 'thuoc-otc',
      description: null,
      deletedAt: null,
    });
  });
});
