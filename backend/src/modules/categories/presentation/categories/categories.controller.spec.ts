import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { QueryBus } from '@nestjs/cqrs';
import { GetCategoriesQuery } from '../../application/queries/get-categories/get-categories.query';
import { CategoryListPageReadModel } from '../../application/queries/get-categories/category-list-page.read-model';
import { CategoriesController } from './categories.controller';
import { ListCategoriesRequest } from './requests/list-categories.request';

describe('CategoriesController', () => {
  let execute: jest.Mock<(query: GetCategoriesQuery) => Promise<unknown>>;
  let controller: CategoriesController;

  beforeEach(() => {
    execute = jest.fn<(query: GetCategoriesQuery) => Promise<unknown>>();
    controller = new CategoriesController({
      execute,
    } as unknown as QueryBus);
  });

  it('dispatches GetCategoriesQuery with the parsed filters', async () => {
    const expected = new CategoryListPageReadModel([], 0, 1, 20);
    execute.mockResolvedValue(expected);

    const request = Object.assign(new ListCategoriesRequest(), {
      search: 'OTC',
      deleted: false,
      page: 2,
      limit: 10,
    });

    await expect(controller.findAll(request)).resolves.toBe(expected);
    expect(execute).toHaveBeenCalledTimes(1);
    expect(execute.mock.calls[0][0]).toMatchObject({
      search: 'OTC',
      deleted: false,
      page: 2,
      limit: 10,
    });
  });
});
