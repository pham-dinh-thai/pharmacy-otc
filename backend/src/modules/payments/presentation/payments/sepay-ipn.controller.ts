import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { HandleSepayIpnCommand } from '../../application/commands/handle-sepay-ipn/handle-sepay-ipn.command';
import { parseSepayIpn } from '../../infrastructure/sepay/sepay-ipn.mapper';
import { SepayIpnGuard } from './sepay-ipn.guard';

@Controller('payments')
@UseGuards(SepayIpnGuard)
export class SepayIpnController {
  public constructor(private readonly commandBus: CommandBus) {}

  @Post('ipn/sepay')
  @HttpCode(HttpStatus.OK)
  public async handle(@Body() body: unknown): Promise<{ success: true }> {
    await this.commandBus.execute(
      new HandleSepayIpnCommand(parseSepayIpn(body)),
    );

    return { success: true };
  }
}
