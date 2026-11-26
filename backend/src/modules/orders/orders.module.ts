import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { SecurityModule } from '../../shared/modules/security/security.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { CartsModule } from '../carts/carts.module';
import { CancelOrderHandler } from './application/commands/cancel-order/cancel-order.handler';
import { CreateOrderHandler } from './application/commands/create-order/create-order.handler';
import { ReorderOrderHandler } from './application/commands/reorder-order/reorder-order.handler';
import { GetOrderByIdHandler } from './application/queries/get-order-by-id/get-order-by-id.handler';
import { GetOrdersHandler } from './application/queries/get-orders/get-orders.handler';
import { ORDERS_REPOSITORY } from './domain/orders.repository';
import { MikroOrder } from './infrastructure/entities/mikro-order.entity';
import { MikroOrderLine } from './infrastructure/entities/mikro-order-line.entity';
import { MikroOrdersRepository } from './infrastructure/repositories/mikro-orders.repository';
import { OrdersController } from './presentation/orders/orders.controller';

@Module({
  imports: [
    MikroOrmModule.forFeature([MikroOrder, MikroOrderLine]),
    SecurityModule,
    AuditLogsModule,
    CartsModule,
  ],
  controllers: [OrdersController],
  providers: [
    { provide: ORDERS_REPOSITORY, useClass: MikroOrdersRepository },
    CreateOrderHandler,
    CancelOrderHandler,
    ReorderOrderHandler,
    GetOrderByIdHandler,
    GetOrdersHandler,
  ],
  exports: [ORDERS_REPOSITORY],
})
export class OrdersModule {}
