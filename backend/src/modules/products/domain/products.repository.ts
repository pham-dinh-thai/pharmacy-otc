import type { TriStateFilter } from '../../../shared/utils/list-filters';
import { Product } from './product.aggregate';

export type FindProductsFilters = {
  search?: string;
  deleted?: TriStateFilter;
  categoryId?: string;
  inStock?: TriStateFilter;
  minPrice?: string;
  maxPrice?: string;
  limit?: number;
  offset?: number;
};

export type ProductPage = {
  items: Product[];
  total: number;
};

export interface IProductsRepository {
  findPage(filters?: FindProductsFilters): Promise<ProductPage>;

  findByIdIncludingDeleted(id: string): Promise<Product | null>;

  findById(id: string): Promise<Product | null>;

  findCategoryIds(productId: string): Promise<string[]>;

  existsById(id: string): Promise<boolean>;

  create(product: Product): Promise<void>;

  update(product: Product): Promise<void>;
}

export const PRODUCTS_REPOSITORY = 'IProductsRepository';
