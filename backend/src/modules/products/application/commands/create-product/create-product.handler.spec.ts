import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { InvalidAmountException } from '../../../../../shared/domain/exceptions/value-object.exceptions';
import { Product } from '../../../domain/product.aggregate';
import { ProductCategoryNotFoundException } from '../../../domain/exceptions/product.exceptions';
import { CreateProductCommand } from './create-product.command';
import { CreateProductHandler } from './create-product.handler';
import { type IOutboxRepository } from '../../../../../shared/modules/outbox/domain/outbox.repository';
import { type IUnitOfWork } from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { PRODUCT_CREATED_EVENT } from '../../../domain/events/product-created.event';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';

const CATEGORY_ID = '9b781a20-0ab6-494a-9bfd-e475e07c7a17';

const headers = {
  actorId: '7d0d2c55-9a9d-4c7d-9f6a-3f7f5a1b2c3d',
  actorType: 'user',
  actorLabel: 'admin@example.com',
  userIp: '127.0.0.1',
  userAgent: 'jest',
};

describe('CreateProductHandler', () => {
  let create: jest.Mock<(product: Product) => Promise<void>>;
  let findActiveByIds: jest.Mock<(ids: string[]) => Promise<string[]>>;
  let outboxCreate: jest.Mock<IOutboxRepository['create']>;
  let unitOfWork: IUnitOfWork;
  let handler: CreateProductHandler;

  beforeEach(() => {
    create = jest
      .fn<(product: Product) => Promise<void>>()
      .mockResolvedValue(undefined);

    findActiveByIds = jest
      .fn<(ids: string[]) => Promise<string[]>>()
      .mockResolvedValue([CATEGORY_ID]);

    outboxCreate = jest
      .fn<IOutboxRepository['create']>()
      .mockResolvedValue(undefined);

    unitOfWork = {
      run: async (callback) => callback(),
    };

    handler = new CreateProductHandler(
      {
        create,
        findPage: jest.fn(),
        findById: jest.fn(),
        findByIdIncludingDeleted: jest.fn(),
        findCategoryIds: jest.fn(),
        existsById: jest.fn(),
        update: jest.fn(),
      } as unknown as never,
      { findActiveByIds } as unknown as never,
      { create: outboxCreate } as unknown as IOutboxRepository,
      unitOfWork,
    );
  });

  it('creates a product, links active categories and appends an audit event', async () => {
    const result = await handler.execute(
      new CreateProductCommand('Coffee', '12500', 3, [CATEGORY_ID], headers),
    );

    expect(findActiveByIds).toHaveBeenCalledWith([CATEGORY_ID]);
    expect(result.id).toEqual(expect.any(String));
    expect(create).toHaveBeenCalledTimes(1);

    const product = create.mock.calls[0][0];
    expect(product).toBeInstanceOf(Product);
    expect(product.getId()).toBe(result.id);
    expect(product.getName()).toBe('Coffee');
    expect(product.getUnitPrice()).toBe('12500');
    expect(product.getQuantity()).toBe(3);
    expect(product.getCategoryIds()).toEqual([CATEGORY_ID]);

    expect(outboxCreate).toHaveBeenCalledWith({
      eventType: PRODUCT_CREATED_EVENT,
      payload: {
        headers,
        audit: {
          entityType: EntityType.PRODUCTS,
          entityId: product.getId(),
          after: {
            name: 'Coffee',
            unitPrice: '12500',
            quantity: 3,
            categoryIds: [CATEGORY_ID],
          },
        },
      },
    });
  });

  it('rejects a product that references a missing or deleted category', async () => {
    findActiveByIds.mockResolvedValue([]);

    await expect(
      handler.execute(
        new CreateProductCommand('Coffee', '12500', 3, [CATEGORY_ID], headers),
      ),
    ).rejects.toThrow(ProductCategoryNotFoundException);

    expect(create).not.toHaveBeenCalled();
    expect(outboxCreate).not.toHaveBeenCalled();
  });

  it('does not persist a product that violates a domain rule', async () => {
    findActiveByIds.mockResolvedValue([]);

    await expect(
      handler.execute(new CreateProductCommand('Tea', '1.234', 1, [], headers)),
    ).rejects.toThrow(InvalidAmountException);

    expect(create).not.toHaveBeenCalled();
    expect(outboxCreate).not.toHaveBeenCalled();
  });
});
