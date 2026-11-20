import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { GetInventorySummaryQuery } from '../../application/queries/get-inventory-summary/get-inventory-summary.query';
import { InventorySummaryPageReadModel } from '../../application/queries/get-inventory-summary/inventory-summary-page.read-model';
import { GetBatchesQuery } from '../../application/queries/get-batches/get-batches.query';
import { BatchListPageReadModel } from '../../application/queries/get-batches/batch-list-page.read-model';
import { GetBatchQuery } from '../../application/queries/get-batch/get-batch.query';
import { BatchDetailReadModel } from '../../application/queries/get-batch/batch-detail.read-model';
import { ListInventorySummaryRequest } from './requests/list-inventory-summary.request';
import { ListBatchesRequest } from './requests/list-batches.request';
import { ReconcileBatchStockRequest } from './requests/reconcile-batch-stock.request';
import { ReconcileBatchStockCommand } from '../../application/commands/reconcile-batch-stock/reconcile-batch-stock.command';
import { IssueBatchStockCommand } from '../../application/commands/issue-batch-stock/issue-batch-stock.command';
import { IssueBatchStockRequest } from './requests/issue-batch-stock.request';
import { CommandBus } from '@nestjs/cqrs';
import { AuthGuard } from '../../../../shared/modules/security/auth.guard';
import { PermissionsGuard } from '../../../../shared/modules/security/permissions.guard';
import { RequirePermissions } from '../../../../shared/modules/security/require-permissions.decorator';
import { ActorContext } from '../../../../shared/modules/security/actor-context.decorator';
import { type ActorHeaders } from '../../../../shared/types/actor-headers';

@Controller('inventories')
@UseGuards(AuthGuard, PermissionsGuard)
export class InventoriesController {
  private readonly logger = new Logger(InventoriesController.name);

  public constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @RequirePermissions(['inventories:read'])
  public findSummary(
    @Query() request: ListInventorySummaryRequest,
  ): Promise<InventorySummaryPageReadModel> {
    return this.queryBus.execute(
      new GetInventorySummaryQuery(
        request.productId,
        request.page,
        request.limit,
      ),
    );
  }

  @Get('batches')
  @RequirePermissions(['inventories:read'])
  public findBatches(
    @Query() request: ListBatchesRequest,
  ): Promise<BatchListPageReadModel> {
    return this.queryBus.execute(
      new GetBatchesQuery(
        request.productId,
        request.lotNumber,
        request.status,
        request.expiresBefore,
        request.page,
        request.limit,
      ),
    );
  }

  @Get('batches/:id')
  @RequirePermissions(['inventories:read'])
  public findBatch(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<BatchDetailReadModel> {
    return this.queryBus.execute(new GetBatchQuery(id));
  }

  @Patch(':productId/issue/:batchId')
  @RequirePermissions(['inventories:issue'])
  public async issueBatchStock(
    @Param('productId', new ParseUUIDPipe({ version: '4' })) productId: string,
    @Param('batchId', new ParseUUIDPipe({ version: '4' })) batchId: string,
    @Body() request: IssueBatchStockRequest,
    @ActorContext() headers: ActorHeaders,
  ): Promise<{ quantity: number }> {
    const quantity = await this.commandBus.execute(
      new IssueBatchStockCommand(productId, batchId, request.quantity, headers),
    );

    this.logger.log(`Batch ${batchId} issued`, request);

    return { quantity };
  }

  @Patch(':productId/reconcile/:batchId')
  @RequirePermissions(['inventories:reconcile'])
  public async reconcileBatchStock(
    @Param('productId', new ParseUUIDPipe({ version: '4' })) productId: string,
    @Param('batchId', new ParseUUIDPipe({ version: '4' })) batchId: string,
    @Body() request: ReconcileBatchStockRequest,
    @ActorContext() headers: ActorHeaders,
  ): Promise<{ quantity: number }> {
    const quantity = await this.commandBus.execute(
      new ReconcileBatchStockCommand(
        productId,
        batchId,
        request.quantity,
        headers,
      ),
    );

    this.logger.log(`Batch ${batchId} reconciled`, request);

    return { quantity };
  }
}
