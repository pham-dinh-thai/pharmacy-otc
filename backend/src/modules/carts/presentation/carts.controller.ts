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
import type { Request, Response } from 'express';
import { CartsService } from '../application/carts.service';
import type { CartReadModel } from '../application/cart.read-model';
import { CartIdentityResolver } from './cart-identity.resolver';
import { AddCartItemRequest } from './requests/add-cart-item.request';
import { UpdateCartItemRequest } from './requests/update-cart-item.request';

/** Guest carts use an httpOnly cookie; signed-in carts use the access token. */
@Controller('carts')
export class CartsController {
  public constructor(
    private readonly service: CartsService,
    private readonly identityResolver: CartIdentityResolver,
  ) {}

  @Get()
  public async getCart(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<CartReadModel> {
    const identity = await this.identityResolver.resolve(request, response);

    return this.service.getCart(identity);
  }

  @Post('items')
  public async addItem(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Body() body: AddCartItemRequest,
  ): Promise<CartReadModel> {
    const identity = await this.identityResolver.resolve(request, response);

    return this.service.addItem(identity, body.productId, body.quantity);
  }

  @Patch('items/:productId')
  public async setItemQuantity(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Param('productId', new ParseUUIDPipe({ version: '4' })) productId: string,
    @Body() body: UpdateCartItemRequest,
  ): Promise<CartReadModel> {
    const identity = await this.identityResolver.resolve(request, response);

    return this.service.setItemQuantity(identity, productId, body.quantity);
  }

  @Delete('items/:productId')
  public async removeItem(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Param('productId', new ParseUUIDPipe({ version: '4' })) productId: string,
  ): Promise<CartReadModel> {
    const identity = await this.identityResolver.resolve(request, response);

    return this.service.removeItem(identity, productId);
  }

  @Delete()
  public async clearCart(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<CartReadModel> {
    const identity = await this.identityResolver.resolve(request, response);

    return this.service.clear(identity);
  }
}
