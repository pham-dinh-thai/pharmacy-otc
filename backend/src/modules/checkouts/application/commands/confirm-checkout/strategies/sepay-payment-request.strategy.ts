import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CommandBus } from '@nestjs/cqrs';
import { SePayPgClient } from 'sepay-pg-node';
import { PaymentMethod } from '../../../../../../shared/domain/enums/payment-method.enum';
import { Money } from '../../../../../../shared/domain/value-objects/money.value-object';
import { CreatePaymentCommand } from '../../../../../payments/application/commands/create-payment/create-payment.command';
import { PaymentProvider } from '../../../../../payments/domain/enums/payment-provider.enum';
import { orderPaymentGatewayFields } from '../../../../../payments/domain/payment-gateway';
import { paymentReferenceForOrder } from '../../../../../payments/domain/payment-reference';
import {
  IOnlinePaymentRequestStrategy,
  PaymentRequestInput,
  PaymentRequestResult,
} from './online-payment-request.strategy';

@Injectable()
export class SepayPaymentRequestStrategy implements IOnlinePaymentRequestStrategy {
  public readonly paymentMethod = PaymentMethod.SEPAY;

  public constructor(
    private readonly configService: ConfigService,
    private readonly commandBus: CommandBus,
  ) {}

  public async buildRequest(
    input: PaymentRequestInput,
  ): Promise<PaymentRequestResult> {
    const client = new SePayPgClient({
      env:
        this.configService.get<string>('SEPAY_ENV', 'sandbox') === 'production'
          ? 'production'
          : 'sandbox',
      merchant_id: this.configService.getOrThrow<string>('SEPAY_MERCHANT_ID'),
      secret_key: this.configService.getOrThrow<string>('SEPAY_SECRET_KEY'),
    });

    const url = client.checkout.initCheckoutUrl();
    const transactionRef = paymentReferenceForOrder(input.orderId);
    const returnUrl =
      this.configService.getOrThrow<string>('PAYMENT_RETURN_URL');
    const fields = client.checkout.initOneTimePaymentFields({
      operation: 'PURCHASE',
      payment_method: 'BANK_TRANSFER',
      order_invoice_number: transactionRef,
      order_amount: Number(Money.create(input.amount).toBigInt()),
      currency: 'VND',
      order_description: `Thanh toan don hang ${transactionRef}`,
      success_url: returnUrl,
      error_url: returnUrl,
      cancel_url: returnUrl,
    });
    const gateway = {
      url,
      fields: orderPaymentGatewayFields(
        Object.fromEntries(
          Object.entries(fields)
            .filter(([, value]) => value !== undefined)
            .map(([key, value]) => [key, String(value)]),
        ),
      ),
    };

    await this.commandBus.execute(
      new CreatePaymentCommand(
        input.orderId,
        PaymentProvider.SEPAY,
        input.amount,
        transactionRef,
        gateway,
        input.headers,
      ),
    );

    return {
      provider: PaymentProvider.SEPAY,
      transactionRef,
      gateway,
    };
  }
}
