import {
  Payment,
  type PaymentGateway,
  type PaymentGatewayField,
  type PaymentSettlement,
} from '../../domain/payment.aggregate';
import { orderPaymentGatewayFields } from '../../domain/payment-gateway';
import { MikroPayment } from '../entities/mikro-payment.entity';

type PaymentPayload = {
  gateway?: PaymentGateway;
  settlement?: PaymentSettlement;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readGatewayFields = (value: unknown): PaymentGatewayField[] | null => {
  if (Array.isArray(value)) {
    if (
      value.some(
        (field) =>
          !isRecord(field) ||
          typeof field.name !== 'string' ||
          typeof field.value !== 'string',
      )
    ) {
      return null;
    }

    return value as PaymentGatewayField[];
  }

  if (
    !isRecord(value) ||
    Object.values(value).some((field) => typeof field !== 'string')
  ) {
    return null;
  }

  return orderPaymentGatewayFields(value as Record<string, string>);
};

const readGateway = (value: unknown): PaymentGateway | null => {
  if (!isRecord(value) || typeof value.url !== 'string') return null;

  const fields = readGatewayFields(value.fields);
  if (!fields) return null;

  return { url: value.url, fields };
};

const readSettlement = (value: unknown): PaymentSettlement | null => {
  if (!isRecord(value) || !isRecord(value.payload)) return null;

  return {
    providerTransactionNo:
      typeof value.providerTransactionNo === 'string'
        ? value.providerTransactionNo
        : null,
    bankCode: typeof value.bankCode === 'string' ? value.bankCode : null,
    responseCode:
      typeof value.responseCode === 'string' ? value.responseCode : null,
    payload: value.payload,
  };
};

export class PaymentMapper {
  public static toDomain(mikroPayment: MikroPayment): Payment {
    const payload = isRecord(mikroPayment.providerPayload)
      ? (mikroPayment.providerPayload as PaymentPayload)
      : {};

    return Payment.fromPersistent({
      id: mikroPayment.id,
      orderId: mikroPayment.orderId,
      provider: mikroPayment.provider,
      status: mikroPayment.status,
      amount: mikroPayment.amount,
      transactionRef: mikroPayment.transactionRef,
      gateway: readGateway(payload.gateway),
      settlement: readSettlement(payload.settlement),
      paidAt: mikroPayment.paidAt,
      expiresAt: mikroPayment.expiresAt,
      createdAt: mikroPayment.createdAt,
      updatedAt: mikroPayment.updatedAt,
    });
  }

  public static toMikro(payment: Payment): MikroPayment {
    return PaymentMapper.assign(new MikroPayment(), payment);
  }

  public static assign(
    mikroPayment: MikroPayment,
    payment: Payment,
  ): MikroPayment {
    const payload: PaymentPayload = {};
    const gateway = payment.getGateway();
    const settlement = payment.getSettlement();

    if (gateway) payload.gateway = gateway;
    if (settlement) payload.settlement = settlement;

    mikroPayment.id = payment.getId();
    mikroPayment.orderId = payment.getOrderId();
    mikroPayment.provider = payment.getProvider();
    mikroPayment.status = payment.getStatus();
    mikroPayment.amount = payment.getAmount();
    mikroPayment.transactionRef = payment.getTransactionRef();
    mikroPayment.providerTransactionNo =
      settlement?.providerTransactionNo ?? null;
    mikroPayment.bankCode = settlement?.bankCode ?? null;
    mikroPayment.responseCode = settlement?.responseCode ?? null;
    mikroPayment.providerPayload =
      Object.keys(payload).length > 0 ? payload : null;
    mikroPayment.paidAt = payment.getPaidAt();
    mikroPayment.expiresAt = payment.getExpiresAt();
    mikroPayment.createdAt = payment.getCreatedAt();
    mikroPayment.updatedAt = payment.getUpdatedAt();

    return mikroPayment;
  }
}
