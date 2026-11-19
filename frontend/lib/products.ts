import type { TriStateValue } from './list-filters';
import { authFetch } from './auth';

export type ProductListItem = {
  id: string;
  name: string;
  unitPrice: string;
  quantity: number;
  sku: string | null;
  unit: string | null;
  description: string | null;
  imageUrl: string | null;
  expiryDate: string | null;
  warning: string | null;
  categoryIds: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type ProductDetail = ProductListItem;

export type ProductPage = {
  items: ProductListItem[];
  total: number;
  page: number;
  limit: number;
};

export type CategoryOption = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  deletedAt: string | null;
};

type CategoryPage = {
  items: CategoryOption[];
  total: number;
  page: number;
  limit: number;
};

export const PRODUCT_DELETED_FILTERS: readonly {
  value: TriStateValue;
  label: string;
}[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'false', label: 'Đang bán' },
  { value: 'true', label: 'Đã xoá' },
];

export const PRODUCT_STOCK_FILTERS: readonly {
  value: TriStateValue;
  label: string;
}[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'true', label: 'Còn hàng' },
  { value: 'false', label: 'Hết hàng' },
];

export function isProductDeleted(product: ProductListItem): boolean {
  return Boolean(product.deletedAt);
}

export function productStateLabel(deleted: boolean): string {
  return deleted ? 'Đã xoá' : 'Đang bán';
}

export function formatProductDate(value: string | null | undefined): string {
  if (!value) return '—';

  return new Date(value).toLocaleString('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

/**
 * Danh mục hoạt động dùng cho bộ lọc và form sản phẩm. Trả về rỗng khi người
 * dùng không có `categories:read` để trang sản phẩm vẫn dùng được độc lập.
 */
export async function fetchCategoryOptions(): Promise<CategoryOption[]> {
  try {
    const res = await authFetch('/categories?deleted=false&limit=100');

    if (!res.ok) return [];

    const body = (await res.json()) as CategoryPage;

    return body.items;
  } catch {
    return [];
  }
}
