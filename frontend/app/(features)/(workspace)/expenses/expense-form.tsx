import Link from 'next/link';
import {
  EXPENSE_CATEGORY_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
  type Expense,
  type ExpenseCategory,
  type PaymentMethod,
} from '@/lib/expenses';
import type { SupplierOption } from '@/lib/goods-receipts';

const LABEL_CLASS = 'block text-[13px] font-medium text-muted';
const FIELD_CLASS =
  'mt-1 w-full border border-rule bg-paper px-3 py-2.5 text-[14px] placeholder:text-muted/60 focus:border-ink disabled:bg-rule/30';

export type ExpenseFormValues = {
  name: string;
  category: ExpenseCategory;
  amount: string;
  expenseDate: string;
  supplierId: string | null;
  paymentMethod: PaymentMethod | null;
  note: string | null;
};

export function expenseFormValues(expense?: Expense | null): ExpenseFormValues {
  return {
    name: expense?.name ?? '',
    category: expense?.category ?? 'rent',
    amount: expense ? String(expense.amount) : '',
    expenseDate: expense ? expense.expenseDate.slice(0, 10) : '',
    supplierId: expense?.supplierId ?? null,
    paymentMethod: expense?.paymentMethod ?? null,
    note: expense?.note ?? null,
  };
}

export function ExpenseForm({
  action,
  values,
  supplierOptions,
  submitLabel,
  cancelHref,
  expenseId,
  returnTo,
  disabled = false,
}: {
  action: (formData: FormData) => Promise<void>;
  values: ExpenseFormValues;
  supplierOptions: SupplierOption[];
  submitLabel: string;
  cancelHref: string;
  expenseId?: string;
  returnTo?: string;
  disabled?: boolean;
}) {
  return (
    <form action={action} className="grid gap-5 px-6 py-6 md:grid-cols-2">
      {expenseId && <input type="hidden" name="expenseId" value={expenseId} />}
      {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}

      <div>
        <label htmlFor="expense-name" className={LABEL_CLASS}>
          Tên chi phí
        </label>
        <input
          id="expense-name"
          name="name"
          type="text"
          required
          maxLength={255}
          defaultValue={values.name}
          disabled={disabled}
          placeholder="Ví dụ: Tiền điện tháng 11"
          className={FIELD_CLASS}
        />
      </div>

      <div>
        <label htmlFor="expense-category" className={LABEL_CLASS}>
          Danh mục
        </label>
        <select
          id="expense-category"
          name="category"
          defaultValue={values.category}
          disabled={disabled}
          className={FIELD_CLASS}
        >
          {EXPENSE_CATEGORY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="expense-amount" className={LABEL_CLASS}>
          Số tiền (VNĐ)
        </label>
        <input
          id="expense-amount"
          name="amount"
          type="text"
          inputMode="numeric"
          required
          pattern="\d+"
          defaultValue={values.amount}
          disabled={disabled}
          placeholder="5000000"
          className={`${FIELD_CLASS} tabular-nums`}
        />
      </div>

      <div>
        <label htmlFor="expense-date" className={LABEL_CLASS}>
          Ngày chi
        </label>
        <input
          id="expense-date"
          name="expenseDate"
          type="date"
          required
          defaultValue={values.expenseDate}
          disabled={disabled}
          className={FIELD_CLASS}
        />
      </div>

      <div>
        <label htmlFor="expense-supplier" className={LABEL_CLASS}>
          Nhà cung cấp (tuỳ chọn)
        </label>
        <select
          id="expense-supplier"
          name="supplierId"
          defaultValue={values.supplierId ?? ''}
          disabled={disabled}
          className={FIELD_CLASS}
        >
          <option value="">Không liên kết</option>
          {supplierOptions.map((supplier) => (
            <option key={supplier.id} value={supplier.id}>
              {supplier.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="expense-payment" className={LABEL_CLASS}>
          Phương thức thanh toán (tuỳ chọn)
        </label>
        <select
          id="expense-payment"
          name="paymentMethod"
          defaultValue={values.paymentMethod ?? ''}
          disabled={disabled}
          className={FIELD_CLASS}
        >
          <option value="">Chưa chọn</option>
          {PAYMENT_METHOD_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="md:col-span-2">
        <label htmlFor="expense-note" className={LABEL_CLASS}>
          Ghi chú (tuỳ chọn)
        </label>
        <textarea
          id="expense-note"
          name="note"
          rows={3}
          maxLength={2000}
          defaultValue={values.note ?? ''}
          disabled={disabled}
          className={FIELD_CLASS}
        />
      </div>

      <div className="flex flex-wrap items-center gap-4 md:col-span-2">
        {!disabled && (
          <button
            type="submit"
            className="bg-accent px-5 py-2.5 text-[13px] font-semibold text-paper transition-colors hover:bg-ink"
          >
            {submitLabel}
          </button>
        )}
        <Link
          href={cancelHref}
          className="text-[13px] font-medium text-muted hover:text-accent hover:underline"
        >
          {disabled ? 'Quay lại danh sách' : 'Huỷ'}
        </Link>
      </div>
    </form>
  );
}
