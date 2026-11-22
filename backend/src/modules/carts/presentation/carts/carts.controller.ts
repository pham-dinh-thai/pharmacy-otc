import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import type { Request, Response } from 'express';
import { AddCartItemCommand } from '../../application/commands/add-cart-item/add-cart-item.command';
import { ClearCartCommand } from '../../application/commands/clear-cart/clear-cart.command';
import { RemoveCartItemCommand } from '../../application/commands/remove-cart-item/remove-cart-item.command';
import { SetCartItemQuantityCommand } from '../../application/commands/set-cart-item-quantity/set-cart-item-quantity.command';
import type { CartIdentity } from '../../domain/cart-identity';
import { GetCartQuery } from '../../application/queries/get-cart/get-cart.query';
import type { CartReadModel } from '../../application/cart.read-model';
import { CartIdentityResolver } from './cart-identity.resolver';
import { AddCartItemRequest } from './requests/add-cart-item.request';
import { UpdateCartItemRequest } from './requests/update-cart-item.request';

/** Guest carts use an httpOnly cookie; signed-in carts use the access token. */
@Controller('carts')
export class CartsController {
  public constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly identityResolver: CartIdentityResolver,
  ) {}

  @Get()
  public async getCart(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<CartReadModel> {
    return this.queryBus.execute(
      new GetCartQuery(await this.resolve(request, response)),
    );
  }

  @Post('items')
  public async addItem(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Body() body: AddCartItemRequest,
  ): Promise<CartReadModel> {
    const identity = await this.resolve(request, response);

    await this.commandBus.execute(
      new AddCartItemCommand(identity, body.productId, body.quantity),
    );

    return this.render(identity);
  }

  @Patch('items/:productId')
  public async setItemQuantity(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Param('productId', new ParseUUIDPipe({ version: '4' })) productId: string,
    @Body() body: UpdateCartItemRequest,
  ): Promise<CartReadModel> {
    const identity = await this.resolve(request, response);

    await this.commandBus.execute(
      new SetCartItemQuantityCommand(identity, productId, body.quantity),
    );

    return this.render(identity);
  }

  @Delete('items/:productId')
  public async removeItem(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Param('productId', new ParseUUIDPipe({ version: '4' })) productId: string,
  ): Promise<CartReadModel> {
    const identity = await this.resolve(request, response);

    await this.commandBus.execute(
      new RemoveCartItemCommand(identity, productId),
    );

    return this.render(identity);
  }

  @Delete()
  public async clearCart(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<CartReadModel> {
    const identity = await this.resolve(request, response);

    await this.commandBus.execute(new ClearCartCommand(identity));

    return this.render(identity);
  }

  private resolve(request: Request, response: Response): Promise<CartIdentity> {
    return this.identityResolver.resolve(request, response);
  }

  private render(identity: CartIdentity): Promise<CartReadModel> {
    return this.queryBus.execute(new GetCartQuery(identity));
  }
}
