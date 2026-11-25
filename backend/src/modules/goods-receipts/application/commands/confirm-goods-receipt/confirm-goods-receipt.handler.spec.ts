import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { CommandBus } from '@nestjs/cqrs';
import type { IUnitOfWork } from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { RecordAuditLogCommand } from '../../../../audit-logs/application/commands/record-audit-log/record-audit-log.command';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';
import { CreateExpenseCommand } from '../../../../expenses/application/commands/create-expense/create-expense.command';
import { ExpenseCategory } from '../../../../expenses/domain/enums/expense-category.enum';
import { ReceiveStockCommand } from '../../../../inventories/application/commands/receive-stock/receive-stock.command';
import { Supplier } from '../../../../suppliers/domain/supplier.aggregate';
import type { ISuppliersRepository } from '../../../../suppliers/domain/suppliers.repository';
import {
  GoodsReceiptNotFoundException,
  GoodsReceiptNotPendingException,
} from '../../../domain/exceptions/goods-receipt.exceptions';
import { GoodsReceipt } from '../../../domain/goods-receipt.aggregate';
import { GoodsReceiptLine } from '../../../domain/goods-receipt-line.entity';
import { GoodsReceiptStatus } from '../../../domain/goods-receipt-status.enum';
import type {
  FindGoodsReceiptOptions,
  IGoodsReceiptsRepository,
} from '../../../domain/goods-receipts.repository';
import { ConfirmGoodsReceiptCommand } from './confirm-goods-receipt.command';
import { ConfirmGoodsReceiptHandler } from './confirm-goods-receipt.handler';

const RECEIPT_ID = 'b3d7f2a8-7a0e-4f1c-9c1a-4d3f5e6a7b8c';
const SUPPLIER_ID = '0ca741a6-ce41-4010-8148-f7b2a32aef1c';
const SUPPLIER_NAME = 'Dược phẩm ABC';
const PRODUCT_ID = '8a2f6c1e-3b4d-4e5f-9a0b-1c2d3e4f5a6b';
const OTHER_PRODUCT_ID = '11111111-1111-4111-8111-111111111111';
const CREATED_BY = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
const CONFIRMED_BY = 'f1e2d3c4-b5a6-4978-8a9b-0c1d2e3f4a5b';
const EXPIRES_AT = new Date('2030-01-01T00:00:00.000Z');
const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const headers = {
  actorId: CONFIRMED_BY,
  actorType: 'user',
  actorLabel: 'admin@example.com',
  userIp: '127.0.0.1',
  userAgent: 'jest',
};

type FindById = (
  id: string,
  options?: FindGoodsReceiptOptions,
) => Promise<GoodsReceipt | null>;
type Update = (receipt: GoodsReceipt) => Promise<GoodsReceipt>;
type Run = (work: () => Promise<unknown>) => Promise<unknown>;

const createLine = (
  overrides: {
    lotNumber?: string;
    productId?: string;
    quantity?: number;
  } = {},
): GoodsReceiptLine =>
  GoodsReceiptLine.create({
    lotNumber: 'LOT-001',
    productId: PRODUCT_ID,
    quantity: 10,
    unitCost: '2500',
    expiresAt: EXPIRES_AT,
    ...overrides,
  });

const createReceipt = (
  lines: GoodsReceiptLine[] = [createLine()],
): GoodsReceipt =>
  GoodsReceipt.create({
    sequence: 1,
    supplierId: SUPPLIER_ID,
    goodsReceiptLines: lines,
    createdBy: CREATED_BY,
  });

const setup = (receipt: GoodsReceipt | null) => {
  const findById = jest.fn<FindById>(() => Promise.resolve(receipt));
  const update = jest.fn<Update>((value) => Promise.resolve(value));
  const run = jest.fn<Run>((work) => work());
  const execute = jest.fn<CommandBus['execute']>(() =>
    Promise.resolve({ id: 'command-id' }),
  );

  const goodsReceiptsRepository = {
    nextSequence: jest.fn(),
    findPage: jest.fn(),
    findById,
    create: jest.fn(),
    update,
  } as unknown as IGoodsReceiptsRepository;
  const unitOfWork = { run } as unknown as IUnitOfWork;

  const supplier = Supplier.create({
    sequence: 1,
    name: SUPPLIER_NAME,
    phone: null,
    email: null,
    address: null,
    taxCode: null,
  });
  const findSupplier = jest
    .fn<ISuppliersRepository['findByIdIncludingDeleted']>()
    .mockResolvedValue(supplier);
  const suppliersRepository = {
    findByIdIncludingDeleted: findSupplier,
  } as unknown as ISuppliersRepository;

  const handler = new ConfirmGoodsReceiptHandler(
    goodsReceiptsRepository,
    unitOfWork,
    suppliersRepository,
    { execute } as unknown as CommandBus,
  );

  return { handler, findById, update, run, execute };
};

describe('ConfirmGoodsReceiptHandler', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('confirms the receipt and dispatches audit, stock and expense commands', async () => {
    const receipt = createReceipt();
    const { handler, findById, update, run, execute } = setup(receipt);

    const result = await handler.execute(
      new ConfirmGoodsReceiptCommand(RECEIPT_ID, CONFIRMED_BY, headers),
    );

    expect(result).toEqual({ id: receipt.getId() });
    expect(run).toHaveBeenCalledTimes(1);
    expect(findById).toHaveBeenCalledWith(RECEIPT_ID, { forUpdate: true });
    expect(receipt.getStatus()).toBe(GoodsReceiptStatus.CONFIRMED);
    expect(receipt.getConfirmedBy()).toBe(CONFIRMED_BY);
    expect(update).toHaveBeenCalledWith(receipt);

    expect(execute).toHaveBeenCalledTimes(3);

    const [auditCommand, stockCommand, expenseCommand] = execute.mock.calls.map(
      (call) => call[0],
    );
    expect(auditCommand).toBeInstanceOf(RecordAuditLogCommand);
    expect((auditCommand as RecordAuditLogCommand).props).toMatchObject({
      actorId: CONFIRMED_BY,
      action: 'confirm',
      entityType: EntityType.GOODS_RECEIPTS,
      entityId: receipt.getId(),
      before: { status: GoodsReceiptStatus.PENDING },
    });

    const line = receipt.getGoodsReceiptLines()[0];
    expect(line.getBatchId()).toMatch(UUID_V4_REGEX);
    expect(stockCommand).toBeInstanceOf(ReceiveStockCommand);
    expect(stockCommand).toMatchObject({
      lotNumber: 'LOT-001',
      productId: PRODUCT_ID,
      quantity: 10,
      unitCost: '2500',
      expiresAt: EXPIRES_AT,
      createdBy: CONFIRMED_BY,
      batchId: line.getBatchId(),
    });

    expect(expenseCommand).toBeInstanceOf(CreateExpenseCommand);
    expect(expenseCommand).toMatchObject({
      name: `Trả tiền cho nhà cung cấp ${SUPPLIER_NAME}`,
      category: ExpenseCategory.OTHER,
      amount: 25000n,
      supplierId: SUPPLIER_ID,
      paymentMethod: null,
      note: `Trả tiền cho phiếu nhập ${receipt.getCode()}`,
      createdBy: CONFIRMED_BY,
      headers,
    });
  });

  it('dispatches one stock command per receipt line with distinct batch ids', async () => {
    const receipt = createReceipt([
      createLine({ lotNumber: 'LOT-001' }),
      createLine({ lotNumber: 'LOT-002' }),
      createLine({ lotNumber: 'LOT-003', productId: OTHER_PRODUCT_ID }),
    ]);
    const { handler, execute } = setup(receipt);

    await handler.execute(
      new ConfirmGoodsReceiptCommand(RECEIPT_ID, CONFIRMED_BY, headers),
    );

    const stockCommands = execute.mock.calls
      .map((call) => call[0])
      .filter(
        (command): command is ReceiveStockCommand =>
          command instanceof ReceiveStockCommand,
      );

    expect(stockCommands).toHaveLength(3);
    expect(stockCommands.map((command) => command.lotNumber)).toEqual([
      'LOT-001',
      'LOT-002',
      'LOT-003',
    ]);
    expect(stockCommands[2].productId).toBe(OTHER_PRODUCT_ID);
    expect(new Set(stockCommands.map((command) => command.batchId)).size).toBe(
      3,
    );
  });

  it('rejects an unknown receipt', async () => {
    const { handler, update, execute } = setup(null);

    await expect(
      handler.execute(
        new ConfirmGoodsReceiptCommand(RECEIPT_ID, CONFIRMED_BY, headers),
      ),
    ).rejects.toThrow(GoodsReceiptNotFoundException);

    expect(update).not.toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
  });

  it('rejects confirming a receipt that is not pending', async () => {
    const receipt = createReceipt();
    receipt.confirm(CREATED_BY);

    const { handler, update, execute } = setup(receipt);

    await expect(
      handler.execute(
        new ConfirmGoodsReceiptCommand(RECEIPT_ID, CONFIRMED_BY, headers),
      ),
    ).rejects.toThrow(GoodsReceiptNotPendingException);

    expect(update).not.toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
  });
});
