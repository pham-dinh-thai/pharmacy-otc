import type { TriStateValue } from './list-filters';
import { authFetch } from './auth';

export type CategoryListItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type CategoryDetail = CategoryListItem & {
  productIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type CategoryPage = {
  items: CategoryListItem[];
  total: number;
  page: number;
  limit: number;
};

export type ProductOption = {
  id: string;
  name: string;
  sku: string | null;
};

export const CATEGORY_DELETED_FILTERS: readonly {
  value: TriStateValue;
  label: string;
}[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'false', label: 'Đang hoạt động' },
  { value: 'true', label: 'Đã xoá' },
];

export function isCategoryDeleted(category: CategoryListItem): boolean {
  return Boolean(category.deletedAt);
}

export function categoryStateLabel(deleted: boolean): string {
  return deleted ? 'Đã xoá' : 'Đang hoạt động';
}

export function formatCategoryDate(value: string | null | undefined): string {
  if (!value) return '—';

  return new Date(value).toLocaleString('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

/**
 * Sản phẩm đang hoạt động để chọn liên kết ở form danh mục. Trả rỗng khi tài khoản
 * không có `products:read` để trang danh mục vẫn dùng được độc lập.
 */
export async function fetchProductOptions(): Promise<ProductOption[]> {
  try {
    const res = await authFetch('/products?deleted=false&limit=100');

    if (!res.ok) return [];

    const body = (await res.json()) as { items: ProductOption[] };

    return body.items;
  } catch {
    return [];
  }
}
