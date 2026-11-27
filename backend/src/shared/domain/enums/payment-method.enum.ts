export enum PaymentMethod {
  COD = 'cod',
  SEPAY = 'sepay',
  ZALOPAY = 'zalopay',
  VIETQR = 'vietqr',
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace PaymentMethod {
  export const ONLINE_TRANSFER = {
    SEPAY: PaymentMethod.SEPAY,
    ZALOPAY: PaymentMethod.ZALOPAY,
    VIETQR: PaymentMethod.VIETQR,
  } as const;
}

export const PAYMENT_METHODS = [
  PaymentMethod.COD,
  PaymentMethod.SEPAY,
  PaymentMethod.ZALOPAY,
  PaymentMethod.VIETQR,
] as const;

const ONLINE_PAYMENT_METHODS: readonly PaymentMethod[] = [
  PaymentMethod.SEPAY,
  PaymentMethod.ZALOPAY,
  PaymentMethod.VIETQR,
];

export function isOnlinePaymentMethod(method: PaymentMethod): boolean {
  return ONLINE_PAYMENT_METHODS.includes(method);
}
