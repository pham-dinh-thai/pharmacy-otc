export type SupplierDeletedFilter = 'false' | 'true';

export type Supplier = {
  id: string;
  code: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  taxCode: string | null;
  createdAt: string;
  updatedAt: string;
  /** Có mặt trên bản ghi đã xoá mềm; có thể thiếu trên danh sách đang dùng. */
  deletedAt?: string | null;
};

export const SUPPLIER_DELETED_FILTERS: readonly {
  value: SupplierDeletedFilter;
  label: string;
}[] = [
  { value: 'false', label: 'Đang dùng' },
  { value: 'true', label: 'Đã xoá' },
];

export function isSupplierDeletedFilter(
  value: string,
): value is SupplierDeletedFilter {
  return value === 'false' || value === 'true';
}

export function isSupplierDeleted(supplier: Supplier): boolean {
  return Boolean(supplier.deletedAt);
}

/** Nhãn trạng thái xoá mềm, suy từ deletedAt. */
export function supplierStateLabel(deleted: boolean): string {
  return deleted ? 'Đã xoá' : 'Đang dùng';
}

/** Ghép số điện thoại và email để hiển thị trong cột liên hệ. */
export function supplierContact(supplier: Supplier): string | null {
  return [supplier.phone, supplier.email].filter(Boolean).join(' · ') || null;
}

export function formatSupplierDate(value: string | null | undefined): string {
  if (!value) return '—';

  return new Date(value).toLocaleString('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

/** Tạo query string cho GET /suppliers; luôn gửi deleted, bỏ search rỗng. */
export function supplierQuery(
  deleted: SupplierDeletedFilter = 'false',
  search = '',
): string {
  const params = new URLSearchParams();
  const keyword = search.trim();

  params.set('deleted', deleted);
  if (keyword) params.set('search', keyword);

  const query = params.toString();

  return query ? `?${query}` : '';
}

export function supplierListHref(
  deleted: SupplierDeletedFilter = 'false',
  search = '',
): string {
  return `/suppliers${supplierQuery(deleted, search)}`;
}
