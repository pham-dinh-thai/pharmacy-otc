'use client';

import { useEffect, useRef } from 'react';
import type { PaymentGatewayResponse } from '@/types';

export function SepayCheckoutForm({
  payment,
}: {
  payment: PaymentGatewayResponse;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const submittedRef = useRef(false);

  useEffect(() => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    formRef.current?.requestSubmit();
  }, []);

  return (
    <form ref={formRef} method="POST" action={payment.gateway.url}>
      {payment.gateway.fields.map((field) => (
        <input
          key={field.name}
          type="hidden"
          name={field.name}
          value={field.value}
        />
      ))}
      <p className="mt-6 text-[13px] text-muted">
        Đang chuyển đến cổng thanh toán SePay cho mã {payment.transactionRef}…
      </p>
      <button
        type="submit"
        className="mt-3 border border-ink bg-ink px-5 py-2.5 text-[13px] font-semibold text-paper hover:bg-accent"
      >
        Chuyển lại cổng thanh toán
      </button>
    </form>
  );
}
