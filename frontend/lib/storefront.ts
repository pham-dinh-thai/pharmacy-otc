import { BACKEND_URL } from './session';
import type {
  StorefrontCategory,
  StorefrontProduct,
  StorefrontProductPage,
} from '@/types';

type ApiProduct = Omit<StorefrontProduct, 'unitPrice'> & {
  unitPrice: string;
};

type ApiProductPage = Omit<StorefrontProductPage, 'items'> & {
  items: ApiProduct[];
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function toProduct(product: ApiProduct): StorefrontProduct {
  return { ...product, unitPrice: Number(product.unitPrice) };
}

async function fetchStorefront(path: string): Promise<Response> {
  return fetch(`${BACKEND_URL}${path}`, { cache: 'no-store' });
}

export async function fetchStorefrontCategories(): Promise<
  StorefrontCategory[]
> {
  const response = await fetchStorefront('/storefront/categories');

  if (!response.ok) {
    throw new Error('Không tải được danh mục sản phẩm.');
  }

  return (await response.json()) as StorefrontCategory[];
}

export async function fetchStorefrontProducts({
  q,
  category,
  page = 1,
  limit = 100,
}: {
  q?: string;
  category?: string;
  page?: number;
  limit?: number;
} = {}): Promise<StorefrontProductPage> {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (category && UUID_PATTERN.test(category)) params.set('category', category);
  params.set('page', String(page));
  params.set('limit', String(limit));

  const response = await fetchStorefront(`/storefront/products?${params}`);

  if (!response.ok) {
    throw new Error('Không tải được danh sách sản phẩm.');
  }

  const result = (await response.json()) as ApiProductPage;

  return { ...result, items: result.items.map(toProduct) };
}

export async function fetchStorefrontProduct(
  id: string,
): Promise<StorefrontProduct | null> {
  if (!UUID_PATTERN.test(id)) return null;

  const response = await fetchStorefront(
    `/storefront/products/${encodeURIComponent(id)}`,
  );

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error('Không tải được thông tin sản phẩm.');
  }

  return toProduct((await response.json()) as ApiProduct);
}
