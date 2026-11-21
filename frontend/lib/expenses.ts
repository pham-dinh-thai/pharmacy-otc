export type ExpenseCategory =
  | 'rent'
  | 'utilities'
  | 'salary'
  | 'transport'
  | 'marketing'
  | 'office_supplies'
  | 'other';

export type ExpenseStatus =
  'pending' | 'approved' | 'supplier_paid' | 'paid' | 'cancelled';

export type PaymentMethod = 'cash' | 'bank_transfer' | 'card' | 'other';

export type Expense = {
  id: string;
  name: string;
  category: ExpenseCategory;
  amount: string;
  expenseDate: string;
  supplierId: string | null;
  status: ExpenseStatus;
  paymentMethod: PaymentMethod | null;
  note: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type ExpensePage = {
  items: Expense[];
  total: number;
  page: number;
  limit: number;
};

export const EXPENSE_STATUS_FILTERS: readonly {
  value: ExpenseStatus | 'all';
  label: string;
}[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ duyệt' },
  { value: 'approved', label: 'Đã duyệt' },
  { value: 'supplier_paid', label: 'Đã trả NCC' },
  { value: 'paid', label: 'Đã chi' },
  { value: 'cancelled', label: 'Đã huỷ' },
];

export const EXPENSE_CATEGORY_OPTIONS: readonly {
  value: ExpenseCategory;
  label: string;
}[] = [
  { value: 'rent', label: 'Tiền thuê' },
  { value: 'utilities', label: 'Tiện ích' },
  { value: 'salary', label: 'Lương' },
  { value: 'transport', label: 'Vận chuyển' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'office_supplies', label: 'Văn phòng phẩm' },
  { value: 'other', label: 'Khác' },
];

export const PAYMENT_METHOD_OPTIONS: readonly {
  value: PaymentMethod;
  label: string;
}[] = [
  { value: 'cash', label: 'Tiền mặt' },
  { value: 'bank_transfer', label: 'Chuyển khoản' },
  { value: 'card', label: 'Thẻ' },
  { value: 'other', label: 'Khác' },
];

export function expenseStatusLabel(status: ExpenseStatus): string {
  return (
    EXPENSE_STATUS_FILTERS.find((item) => item.value === status)?.label ??
    status
  );
}

export function expenseCategoryLabel(category: ExpenseCategory): string {
  return (
    EXPENSE_CATEGORY_OPTIONS.find((item) => item.value === category)?.label ??
    category
  );
}

export function paymentMethodLabel(method: PaymentMethod | null): string {
  if (!method) return '—';

  return (
    PAYMENT_METHOD_OPTIONS.find((item) => item.value === method)?.label ??
    method
  );
}

export function formatExpenseDate(value: string | null | undefined): string {
  if (!value) return '—';

  return new Date(value).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatExpenseTimestamp(
  value: string | null | undefined,
): string {
  if (!value) return '—';

  return new Date(value).toLocaleString('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}
