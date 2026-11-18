import { Supplier } from './supplier.aggregate';

export type FindSuppliersFilters = {
  search?: string;
  deleted?: boolean;
  limit?: number;
  offset?: number;
};

export type SupplierPage = {
  items: Supplier[];
  total: number;
};

export interface ISuppliersRepository {
  findPage(filters?: FindSuppliersFilters): Promise<SupplierPage>;

  /** Detail lookups exclude soft-deleted suppliers. */
  findById(id: string): Promise<Supplier | null>;

  /** Used by delete/restore to detect the current soft-delete state. */
  findByIdIncludingDeleted(id: string): Promise<Supplier | null>;

  nextSequence(): Promise<number>;

  create(supplier: Supplier): Promise<Supplier>;

  update(supplier: Supplier): Promise<Supplier>;
}

export const SUPPLIERS_REPOSITORY = 'ISuppliersRepository';
