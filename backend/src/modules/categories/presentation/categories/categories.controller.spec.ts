import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CategoryListPageReadModel } from '../../application/queries/get-categories/category-list-page.read-model';
import { GetCategoryQuery } from '../../application/queries/get-category/get-category.query';
import { CreateCategoryCommand } from '../../application/commands/create-category/create-category.command';
import { DeleteCategoryCommand } from '../../application/commands/delete-category/delete-category.command';
import { CategoriesController } from './categories.controller';
import { ListCategoriesRequest } from './requests/list-categories.request';
import { CreateCategoryRequest } from './requests/create-category.request';
import type { ActorHeaders } from '../../../../shared/types/actor-headers';

const headers: ActorHeaders = {
  actorId: 'actor-id',
  actorType: 'user',
  actorLabel: 'Test',
  userIp: '127.0.0.1',
  userAgent: 'test',
};

describe('CategoriesController', () => {
  let executeQuery: jest.Mock<(query: object) => Promise<unknown>>;
  let executeCommand: jest.Mock<(command: object) => Promise<unknown>>;
  let controller: CategoriesController;

  beforeEach(() => {
    executeQuery = jest.fn<(query: object) => Promise<unknown>>();
    executeCommand = jest.fn<(command: object) => Promise<unknown>>();
    controller = new CategoriesController(
      { execute: executeCommand } as unknown as CommandBus,
      { execute: executeQuery } as unknown as QueryBus,
    );
  });

  it('dispatches GetCategoriesQuery with the parsed filters', async () => {
    const expected = new CategoryListPageReadModel([], 0, 1, 20);
    executeQuery.mockResolvedValue(expected);

    const request = Object.assign(new ListCategoriesRequest(), {
      search: 'OTC',
      deleted: false,
      page: 2,
      limit: 10,
    });

    await expect(controller.findAll(request)).resolves.toBe(expected);
    expect(executeQuery).toHaveBeenCalledTimes(1);
    expect(executeQuery.mock.calls[0][0]).toMatchObject({
      search: 'OTC',
      deleted: false,
      page: 2,
      limit: 10,
    });
  });

  it('dispatches GetCategoryQuery for the detail endpoint', async () => {
    executeQuery.mockResolvedValue(null);

    await controller.findOne('11111111-1111-4111-8111-111111111111');

    expect(executeQuery.mock.calls[0][0]).toBeInstanceOf(GetCategoryQuery);
  });

  it('dispatches CreateCategoryCommand with the request fields', async () => {
    executeCommand.mockResolvedValue({ id: 'category-id' });

    const request = Object.assign(new CreateCategoryRequest(), {
      name: 'Thuốc cảm cúm',
      slug: 'thuoc-cam-cum',
      description: 'Danh mục thuốc cảm cúm',
    });

    await expect(controller.create(request, headers)).resolves.toEqual({
      id: 'category-id',
    });
    expect(executeCommand.mock.calls[0][0]).toBeInstanceOf(
      CreateCategoryCommand,
    );
    expect(executeCommand.mock.calls[0][0]).toMatchObject({
      name: 'Thuốc cảm cúm',
      slug: 'thuoc-cam-cum',
      description: 'Danh mục thuốc cảm cúm',
    });
  });

  it('dispatches DeleteCategoryCommand with the id', async () => {
    executeCommand.mockResolvedValue({ id: 'category-id' });

    await controller.delete('category-id', headers);

    expect(executeCommand.mock.calls[0][0]).toBeInstanceOf(
      DeleteCategoryCommand,
    );
  });
});
