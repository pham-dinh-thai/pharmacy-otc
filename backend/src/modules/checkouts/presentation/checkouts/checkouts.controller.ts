import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ActorContext } from '../../../../shared/modules/security/actor-context.decorator';
import { AuthGuard } from '../../../../shared/modules/security/auth.guard';
import type { ActorHeaders } from '../../../../shared/types/actor-headers';
import { ConfirmCheckoutCommand } from '../../application/commands/confirm-checkout/confirm-checkout.command';
import { CreateCheckoutCommand } from '../../application/commands/create-checkout/create-checkout.command';
import type { CheckoutDetailReadModel } from '../../application/queries/get-checkout/checkout-detail.read-model';
import { GetCheckoutQuery } from '../../application/queries/get-checkout/get-checkout.query';
import type { CheckoutStatus } from '../../domain/enums/checkout-status.enum';
import { CreateCheckoutRequest } from './requests/create-checkout.request';

@Controller('checkouts')
@UseGuards(AuthGuard)
export class CheckoutsController {
  public constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  public async create(
    @Body() request: CreateCheckoutRequest,
    @ActorContext() headers: ActorHeaders,
  ): Promise<{ id: string }> {
    return this.commandBus.execute(
      new CreateCheckoutCommand(
        headers.actorId,
        request.productIds,
        request.shippingName,
        request.shippingAddress,
        request.shippingPhone,
        headers,
      ),
    );
  }

  @Get(':id')
  public async getCheckout(
    @Param('id', new ParseUUIDPipe()) id: string,
    @ActorContext() headers: ActorHeaders,
  ): Promise<CheckoutDetailReadModel> {
    return this.queryBus.execute(new GetCheckoutQuery(id, headers));
  }

  @Patch(':id/confirm')
  public async confirm(
    @Param('id', new ParseUUIDPipe()) id: string,
    @ActorContext() headers: ActorHeaders,
  ): Promise<{ id: string; status: CheckoutStatus; orderId: string }> {
    return this.commandBus.execute(new ConfirmCheckoutCommand(id, headers));
  }
}
