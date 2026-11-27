const PAYMENT_CODE_MODULUS = 10_000_000_000n;

/** Stable DH-prefixed code embedded in the SePay transfer content. */
export function paymentReferenceForOrder(orderId: string): string {
  const hex = orderId.replace(/-/g, '');

  return `DH${(BigInt(`0x${hex}`) % PAYMENT_CODE_MODULUS)
    .toString()
    .padStart(10, '0')}`;
}
