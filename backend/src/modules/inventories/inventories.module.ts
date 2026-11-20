import { Module } from '@nestjs/common';
import { InventoriesController } from './presentation/inventories/inventories.controller';
import { INVENTORIES_REPOSITORY } from './domain/inventories.repository';
import { MikroInventoriesRepository } from './infrastructure/repositories/mikro-inventories.repository';
import { ReceiveStockHandler } from './application/commands/receive-stock/receive-stock.handler';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MikroBatch } from './infrastructure/entities/mikro-batch.entity';
import { MikroInventory } from './infrastructure/entities/mikro-inventory.entity';
import { ReconcileBatchStockHandler } from './application/commands/reconcile-batch-stock/reconcile-batch-stock.handler';
import { IssueBatchStockHandler } from './application/commands/issue-batch-stock/issue-batch-stock.handler';
import { SecurityModule } from '../../shared/modules/security/security.module';
import { OutBoxModule } from '../../shared/modules/outbox/outbox.module';
import { GoodsReceiptStockReceivedConsumer } from './application/consumers/goods-receipt-stock-received.consumer';
import { GetInventorySummaryHandler } from './application/queries/get-inventory-summary/get-inventory-summary.handler';
import { GetBatchesHandler } from './application/queries/get-batches/get-batches.handler';
import { GetBatchHandler } from './application/queries/get-batch/get-batch.handler';

@Module({
  imports: [
    MikroOrmModule.forFeature([MikroBatch, MikroInventory]),
    SecurityModule,
    OutBoxModule,
  ],
  controllers: [InventoriesController],
  providers: [
    { provide: INVENTORIES_REPOSITORY, useClass: MikroInventoriesRepository },
    ReceiveStockHandler,
    ReconcileBatchStockHandler,
    IssueBatchStockHandler,
    GoodsReceiptStockReceivedConsumer,
    GetInventorySummaryHandler,
    GetBatchesHandler,
    GetBatchHandler,
  ],
})
export class InventoriesModule {}
