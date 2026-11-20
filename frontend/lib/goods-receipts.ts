import { authFetch } from './auth';

export type GoodsReceiptStatus = 'pending' | 'confirmed' | 'cancelled';

export type GoodsReceiptLine = {
  id: string;
  productId: string;
  lotNumber: string;
  quantity: number;
  unitCost: string;
  totalCost: string;
  expiresAt: string;
  batchId: string | null;
};

export type GoodsReceiptListItem = {
  id: string;
  code: string;
  supplierId: string;
  status: GoodsReceiptStatus;
  lineCount: number;
  totalQuantity: number;
  totalCost: string;
  createdBy: string;
  confirmedBy: string | null;
  confirmedAt: string | null;
  cancelledBy: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GoodsReceiptDetail = GoodsReceiptListItem & {
  lines: GoodsReceiptLine[];
};

export type GoodsReceiptPage = {
  items: GoodsReceiptListItem[];
  total: number;
  page: number;
  limit: number;
};

export type SupplierOption = {
  id: string;
  code: string;
  name: string;
};

type SupplierPage = {
  items: SupplierOption[];
  total: number;
  page: number;
  limit: number;
};

export const GOODS_RECEIPT_STATUS_FILTERS: readonly {
  value: GoodsReceiptStatus | 'all';
  label: string;
}[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ xác nhận' },
  { value: 'confirmed', label: 'Đã xác nhận' },
  { value: 'cancelled', label: 'Đã huỷ' },
];

export function goodsReceiptStatusLabel(status: GoodsReceiptStatus): string {
  const option = GOODS_RECEIPT_STATUS_FILTERS.find(
    (item) => item.value === status,
  );

  return option?.label ?? status;
}

export function formatReceiptDate(value: string | null | undefined): string {
  if (!value) return '—';

  return new Date(value).toLocaleString('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export function formatExpiryDate(value: string | null | undefined): string {
  if (!value) return '—';

  return new Date(value).toLocaleDateString('vi-VN', { dateStyle: 'short' });
}

/** Nhà cung cấp còn hoạt động để chọn khi tạo phiếu nhập. */
export async function fetchSupplierOptions(): Promise<SupplierOption[]> {
  try {
    const res = await authFetch('/suppliers?deleted=false&limit=100');

    if (!res.ok) return [];

    const body = (await res.json()) as SupplierPage;

    return body.items;
  } catch {
    return [];
  }
}
