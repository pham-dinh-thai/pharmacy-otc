import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { OrderNotFoundException } from '../../../../orders/domain/exceptions/order.exception';
import {
  ORDERS_REPOSITORY,
  type IOrdersRepository,
} from '../../../../orders/domain/orders.repository';
import { PaymentNotFoundException } from '../../../domain/exceptions/payment.exception';
import {
  PAYMENTS_REPOSITORY,
  type IPaymentsRepository,
} from '../../../domain/payments.repository';
import { GetPaymentGatewayQuery } from './get-payment-gateway.query';
import { PaymentGatewayReadModel } from './payment-gateway.read-model';

@QueryHandler(GetPaymentGatewayQuery)
export class GetPaymentGatewayHandler implements IQueryHandler<
  GetPaymentGatewayQuery,
  PaymentGatewayReadModel
> {
  public constructor(
    @Inject(ORDERS_REPOSITORY)
    private readonly ordersRepository: IOrdersRepository,

    @Inject(PAYMENTS_REPOSITORY)
    private readonly paymentsRepository: IPaymentsRepository,
  ) {}

  public async execute(
    query: GetPaymentGatewayQuery,
  ): Promise<PaymentGatewayReadModel> {
    const order = await this.ordersRepository.findById(query.orderId);

    if (!order || order.getUserId() !== query.userId) {
      throw new OrderNotFoundException(query.orderId);
    }

    const payment = await this.paymentsRepository.findByOrderId(query.orderId);
    const gateway = payment?.getGateway();

    if (!payment || !gateway) {
      throw new PaymentNotFoundException(query.orderId);
    }

    return new PaymentGatewayReadModel(
      order.getId(),
      payment.getProvider(),
      payment.getStatus(),
      payment.getAmount().toString(),
      payment.getTransactionRef(),
      gateway,
    );
  }
}
