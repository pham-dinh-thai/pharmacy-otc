export type BatchStatus = 'active' | 'expired' | 'out';

export type InventorySummary = {
  productId: string;
  totalQuantity: number;
  batchCount: number;
  nearestExpiry: string | null;
  stockValue: string;
  updatedAt: string;
};

export type InventorySummaryPage = {
  items: InventorySummary[];
  total: number;
  page: number;
  limit: number;
};

export type BatchListItem = {
  id: string;
  productId: string;
  lotNumber: string;
  quantity: number;
  unitCost: string;
  totalCost: string;
  status: BatchStatus;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
};

export type BatchDetail = BatchListItem & {
  createdBy: string;
};

export type BatchPage = {
  items: BatchListItem[];
  total: number;
  page: number;
  limit: number;
};

export const BATCH_STATUS_FILTERS: readonly {
  value: BatchStatus | 'all';
  label: string;
}[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'active', label: 'Còn hạn' },
  { value: 'expired', label: 'Hết hạn' },
  { value: 'out', label: 'Đã xuất hết' },
];

export const EXPIRY_FILTERS: readonly { value: string; label: string }[] = [
  { value: '', label: 'Tất cả' },
  { value: '30', label: 'Trong 30 ngày tới' },
  { value: '90', label: 'Trong 90 ngày tới' },
];

export function batchStatusLabel(status: BatchStatus): string {
  const option = BATCH_STATUS_FILTERS.find((item) => item.value === status);

  return option?.label ?? status;
}

export function formatBatchDate(value: string | null | undefined): string {
  if (!value) return '—';

  return new Date(value).toLocaleString('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

/** Đổi lựa chọn hạn dùng thành ngày giới hạn gửi cho API. */
export function expiryBeforeFromOption(value: string): string {
  const days = Number(value);

  if (!Number.isSafeInteger(days) || days <= 0) return '';

  const date = new Date();

  date.setDate(date.getDate() + days);

  return date.toISOString().slice(0, 10);
}
