import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ActorContext } from '../../../../shared/modules/security/actor-context.decorator';
import { AuthGuard } from '../../../../shared/modules/security/auth.guard';
import type { ActorHeaders } from '../../../../shared/types/actor-headers';
import { ConfirmCheckoutCommand } from '../../application/commands/confirm-checkout/confirm-checkout.command';
import { CreateCheckoutCommand } from '../../application/commands/create-checkout/create-checkout.command';
import type { CheckoutStatus } from '../../domain/enums/checkout-status.enum';
import { CreateCheckoutRequest } from './requests/create-checkout.request';

@Controller('checkouts')
@UseGuards(AuthGuard)
export class CheckoutsController {
  public constructor(private readonly commandBus: CommandBus) {}

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

  @Patch(':id/confirm')
  public async confirm(
    @Param('id', new ParseUUIDPipe()) id: string,
    @ActorContext() headers: ActorHeaders,
  ): Promise<{ id: string; status: CheckoutStatus }> {
    return this.commandBus.execute(new ConfirmCheckoutCommand(id, headers));
  }
}
