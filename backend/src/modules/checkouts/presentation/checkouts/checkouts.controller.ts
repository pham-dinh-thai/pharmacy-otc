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
import {
  ConfirmCheckoutCommand,
  type ConfirmCheckoutResult,
} from '../../application/commands/confirm-checkout/confirm-checkout.command';
import { CreateCheckoutCommand } from '../../application/commands/create-checkout/create-checkout.command';
import { UpdateCheckoutCommand } from '../../application/commands/update-checkout/update-checkout.command';
import type { CheckoutDetailReadModel } from '../../application/queries/get-checkout/checkout-detail.read-model';
import { GetCheckoutQuery } from '../../application/queries/get-checkout/get-checkout.query';
import { CreateCheckoutRequest } from './requests/create-checkout.request';
import { UpdateCheckoutRequest } from './requests/update-checkout.request';

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
        request.paymentMethod,
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

  @Patch(':id')
  public async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() request: UpdateCheckoutRequest,
    @ActorContext() headers: ActorHeaders,
  ): Promise<{ id: string }> {
    return this.commandBus.execute(
      new UpdateCheckoutCommand(
        id,
        request.shippingName,
        request.shippingAddress,
        request.shippingPhone,
        request.paymentMethod,
        headers,
      ),
    );
  }

  @Patch(':id/confirm')
  public async confirm(
    @Param('id', new ParseUUIDPipe()) id: string,
    @ActorContext() headers: ActorHeaders,
  ): Promise<ConfirmCheckoutResult> {
    return this.commandBus.execute(new ConfirmCheckoutCommand(id, headers));
  }
}
