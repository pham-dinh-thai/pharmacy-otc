export type StorefrontCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  productCount: number;
};

export type StorefrontProductCategory = Pick<
  StorefrontCategory,
  'id' | 'name' | 'slug'
>;

export type StorefrontProduct = {
  id: string;
  name: string;
  sku: string | null;
  unit: string | null;
  unitPrice: string;
  imageUrl: string | null;
  description: string | null;
  warning: string | null;
  stockQuantity: number;
  inStock: boolean;
  categories: StorefrontProductCategory[];
};

export type StorefrontProductPage = {
  items: StorefrontProduct[];
  total: number;
  page: number;
  limit: number;
};
