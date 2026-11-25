import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GoodsReceiptNotFoundException } from '../../../domain/exceptions/goods-receipt.exceptions';
import {
  type IGoodsReceiptsRepository,
  GOODS_RECEIPTS_REPOSITORY,
} from '../../../domain/goods-receipts.repository';
import { goodsReceiptSnapshot } from '../../../domain/goods-receipt.snapshot';
import {
  type IUnitOfWork,
  UNIT_OF_WORK,
} from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { RecordAuditLogCommand } from '../../../../audit-logs/application/commands/record-audit-log/record-audit-log.command';
import { recordAuditProps } from '../../../../audit-logs/application/record-audit-log-props';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';
import { CancelGoodsReceiptCommand } from './cancel-goods-receipt.command';

@CommandHandler(CancelGoodsReceiptCommand)
export class CancelGoodsReceiptHandler implements ICommandHandler<CancelGoodsReceiptCommand> {
  public constructor(
    @Inject(GOODS_RECEIPTS_REPOSITORY)
    private readonly goodsReceiptsRepository: IGoodsReceiptsRepository,

    private readonly commandBus: CommandBus,

    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  public execute(command: CancelGoodsReceiptCommand): Promise<{ id: string }> {
    return this.unitOfWork.run(async () => {
      const goodsReceipt = await this.goodsReceiptsRepository.findById(
        command.id,
        { forUpdate: true },
      );

      if (!goodsReceipt) {
        throw new GoodsReceiptNotFoundException(command.id);
      }

      const previousStatus = goodsReceipt.getStatus();

      goodsReceipt.cancel(command.cancelledBy);

      await this.goodsReceiptsRepository.update(goodsReceipt);

      await this.commandBus.execute(
        new RecordAuditLogCommand(
          recordAuditProps(command.headers, {
            action: 'cancel',
            entityType: EntityType.GOODS_RECEIPTS,
            entityId: goodsReceipt.getId(),
            before: { status: previousStatus },
            after: goodsReceiptSnapshot(goodsReceipt),
          }),
        ),
      );

      return { id: goodsReceipt.getId() };
    });
  }
}
