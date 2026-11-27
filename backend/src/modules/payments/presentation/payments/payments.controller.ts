import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ActorContext } from '../../../../shared/modules/security/actor-context.decorator';
import { AuthGuard } from '../../../../shared/modules/security/auth.guard';
import type { ActorHeaders } from '../../../../shared/types/actor-headers';
import { GetPaymentGatewayQuery } from '../../application/queries/get-payment-gateway/get-payment-gateway.query';
import type { PaymentGatewayReadModel } from '../../application/queries/get-payment-gateway/payment-gateway.read-model';

@Controller('payments')
@UseGuards(AuthGuard)
export class PaymentsController {
  public constructor(private readonly queryBus: QueryBus) {}

  @Get('orders/:orderId')
  public getGateway(
    @Param('orderId') orderId: string,
    @ActorContext() headers: ActorHeaders,
  ): Promise<PaymentGatewayReadModel> {
    return this.queryBus.execute(
      new GetPaymentGatewayQuery(orderId, headers.actorId),
    );
  }
}
