import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { CreateOrderHandler } from './application/commands/create-order/create-order.handler';
import { ORDERS_REPOSITORY } from './domain/orders.repository';
import { MikroOrder } from './infrastructure/entities/mikro-order.entity';
import { MikroOrderLine } from './infrastructure/entities/mikro-order-line.entity';
import { MikroOrdersRepository } from './infrastructure/repositories/mikro-orders.repository';
import { OrdersController } from './presentation/orders/orders.controller';

@Module({
  imports: [MikroOrmModule.forFeature([MikroOrder, MikroOrderLine])],
  controllers: [OrdersController],
  providers: [
    { provide: ORDERS_REPOSITORY, useClass: MikroOrdersRepository },
    CreateOrderHandler,
  ],
  exports: [ORDERS_REPOSITORY],
})
export class OrdersModule {}
