export type PaymentGatewayField = {
  name: string;
  value: string;
};

export type PaymentGateway = {
  url: string;
  fields: PaymentGatewayField[];
};

const FIELD_ORDER = [
  'operation',
  'payment_method',
  'order_invoice_number',
  'order_amount',
  'currency',
  'order_description',
  'success_url',
  'error_url',
  'cancel_url',
  'merchant',
  'signature',
] as const;

/** SePay signs fields in submission order, so jsonb key reordering is unsafe. */
export function orderPaymentGatewayFields(
  fields: Record<string, string>,
): PaymentGatewayField[] {
  const ordered = FIELD_ORDER.filter((name) => fields[name] !== undefined).map(
    (name) => ({ name, value: fields[name] }),
  );
  const remaining = Object.entries(fields)
    .filter(([name]) => !(FIELD_ORDER as readonly string[]).includes(name))
    .map(([name, value]) => ({ name, value }));

  return [...ordered, ...remaining];
}
