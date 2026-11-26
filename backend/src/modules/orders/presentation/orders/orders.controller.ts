import {
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ActorContext } from '../../../../shared/modules/security/actor-context.decorator';
import { AuthGuard } from '../../../../shared/modules/security/auth.guard';
import type { ActorHeaders } from '../../../../shared/types/actor-headers';
import { CancelOrderCommand } from '../../application/commands/cancel-order/cancel-order.command';
import { ReorderOrderCommand } from '../../application/commands/reorder-order/reorder-order.command';
import { GetOrderByIdQuery } from '../../application/queries/get-order-by-id/get-order-by-id.query';
import type { OrderDetailReadModel } from '../../application/queries/get-order-by-id/order-detail.read-model';
import { GetOrdersQuery } from '../../application/queries/get-orders/get-orders.query';
import type { OrderListPageReadModel } from '../../application/queries/get-orders/order-list-page.read-model';
import { ListOrdersRequest } from './requests/list-orders.request';

@Controller('orders')
@UseGuards(AuthGuard)
export class OrdersController {
  public constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  public findAll(
    @Query() request: ListOrdersRequest,
    @ActorContext() headers: ActorHeaders,
  ): Promise<OrderListPageReadModel> {
    return this.queryBus.execute(
      new GetOrdersQuery(
        headers.actorId,
        request.status,
        request.cursor,
        request.limit,
      ),
    );
  }

  @Get(':id')
  public findOne(
    @Param('id') id: string,
    @ActorContext() headers: ActorHeaders,
  ): Promise<OrderDetailReadModel> {
    return this.queryBus.execute(new GetOrderByIdQuery(id, headers.actorId));
  }

  @Patch(':id/cancel')
  public cancel(
    @Param('id') id: string,
    @ActorContext() headers: ActorHeaders,
  ): Promise<{ id: string; status: string }> {
    return this.commandBus.execute(
      new CancelOrderCommand(id, headers.actorId, headers),
    );
  }

  @HttpCode(200)
  @Post(':id/reorder')
  public reorder(
    @Param('id') id: string,
    @ActorContext() headers: ActorHeaders,
  ): Promise<{ id: string; totalItems: number }> {
    return this.commandBus.execute(
      new ReorderOrderCommand(id, headers.actorId),
    );
  }
}
