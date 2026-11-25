import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { CommandBus } from '@nestjs/cqrs';
import { InvalidAmountException } from '../../../../../shared/domain/exceptions/value-object.exceptions';
import { Product } from '../../../domain/product.aggregate';
import {
  ProductCategoryNotFoundException,
  ProductSkuAlreadyExistsException,
} from '../../../domain/exceptions/product.exceptions';
import { CreateProductCommand } from './create-product.command';
import { CreateProductHandler } from './create-product.handler';
import { type IUnitOfWork } from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { RecordAuditLogCommand } from '../../../../audit-logs/application/commands/record-audit-log/record-audit-log.command';
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
  let existsBySku: jest.Mock<(sku: string) => Promise<boolean>>;
  let execute: jest.Mock<CommandBus['execute']>;
  let unitOfWork: IUnitOfWork;
  let handler: CreateProductHandler;

  beforeEach(() => {
    create = jest
      .fn<(product: Product) => Promise<void>>()
      .mockResolvedValue(undefined);

    findActiveByIds = jest
      .fn<(ids: string[]) => Promise<string[]>>()
      .mockResolvedValue([CATEGORY_ID]);

    existsBySku = jest
      .fn<(sku: string) => Promise<boolean>>()
      .mockResolvedValue(false);

    execute = jest.fn<CommandBus['execute']>(() =>
      Promise.resolve({ id: 'audit-id' }),
    );

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
        existsBySku,
        findActiveByIds: jest.fn(),
        update: jest.fn(),
      } as unknown as never,
      { findActiveByIds } as unknown as never,
      { execute } as unknown as CommandBus,
      unitOfWork,
    );
  });

  it('creates a product, links active categories and dispatches an audit command', async () => {
    const result = await handler.execute(
      new CreateProductCommand('Coffee', '12500', [CATEGORY_ID], headers),
    );

    expect(findActiveByIds).toHaveBeenCalledWith([CATEGORY_ID]);
    expect(result.id).toEqual(expect.any(String));
    expect(create).toHaveBeenCalledTimes(1);

    const product = create.mock.calls[0][0];
    expect(product).toBeInstanceOf(Product);
    expect(product.getId()).toBe(result.id);
    expect(product.getName()).toBe('Coffee');
    expect(product.getUnitPrice()).toBe('12500');
    expect(product.getCategoryIds()).toEqual([CATEGORY_ID]);

    expect(execute).toHaveBeenCalledTimes(1);

    const auditCommand = execute.mock.calls[0][0];
    expect(auditCommand).toBeInstanceOf(RecordAuditLogCommand);
    expect((auditCommand as RecordAuditLogCommand).props).toMatchObject({
      actorId: headers.actorId,
      actorType: headers.actorType,
      actorLabel: headers.actorLabel,
      ipAddress: headers.userIp,
      userAgent: headers.userAgent,
      action: 'create',
      entityType: EntityType.PRODUCTS,
      entityId: product.getId(),
      before: null,
      after: {
        name: 'Coffee',
        unitPrice: '12500',
        sku: null,
        unit: null,
        description: null,
        imageUrl: null,
        warning: null,
        categoryIds: [CATEGORY_ID],
      },
      reason: null,
    });
  });

  it('rejects a duplicate SKU before persisting the product', async () => {
    findActiveByIds.mockResolvedValue([]);
    existsBySku.mockResolvedValue(true);

    await expect(
      handler.execute(
        new CreateProductCommand('Coffee', '12500', [], headers, {
          sku: ' otc-001 ',
        }),
      ),
    ).rejects.toThrow(ProductSkuAlreadyExistsException);

    expect(existsBySku).toHaveBeenCalledWith('OTC-001');
    expect(create).not.toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
  });

  it('rejects a product that references a missing or deleted category', async () => {
    findActiveByIds.mockResolvedValue([]);

    await expect(
      handler.execute(
        new CreateProductCommand('Coffee', '12500', [CATEGORY_ID], headers),
      ),
    ).rejects.toThrow(ProductCategoryNotFoundException);

    expect(create).not.toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
  });

  it('does not persist a product that violates a domain rule', async () => {
    findActiveByIds.mockResolvedValue([]);

    await expect(
      handler.execute(new CreateProductCommand('Tea', '1.234', [], headers)),
    ).rejects.toThrow(InvalidAmountException);

    expect(create).not.toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
  });
});
