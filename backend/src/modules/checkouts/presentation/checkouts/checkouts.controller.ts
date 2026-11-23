import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ActorContext } from '../../../../shared/modules/security/actor-context.decorator';
import { AuthGuard } from '../../../../shared/modules/security/auth.guard';
import type { ActorHeaders } from '../../../../shared/types/actor-headers';
import { CreateCheckoutCommand } from '../../application/commands/create-checkout/create-checkout.command';
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
}
