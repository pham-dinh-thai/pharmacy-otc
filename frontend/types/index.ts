/** Public storefront models returned by /api/storefront. */
export interface StorefrontProductCategory {
  id: string;
  name: string;
  slug: string;
}

export interface StorefrontCategory extends StorefrontProductCategory {
  description: string | null;
  productCount: number;
}

export interface StorefrontProduct {
  id: string;
  name: string;
  sku: string | null;
  unit: string | null;
  unitPrice: number;
  imageUrl: string | null;
  description: string | null;
  warning: string | null;
  stockQuantity: number;
  inStock: boolean;
  categories: StorefrontProductCategory[];
}

export interface StorefrontProductPage {
  items: StorefrontProduct[];
  total: number;
  page: number;
  limit: number;
}

export interface CartItem {
  product: StorefrontProduct;
  quantity: number;
}
