import { Supplier } from './supplier.aggregate';

export type FindSuppliersFilters = {
  search?: string;
  deleted?: boolean;
};

export interface ISuppliersRepository {
  findAll(filters?: FindSuppliersFilters): Promise<Supplier[]>;

  /** Detail lookups exclude soft-deleted suppliers. */
  findById(id: string): Promise<Supplier | null>;

  /** Used by delete/restore to detect the current soft-delete state. */
  findByIdIncludingDeleted(id: string): Promise<Supplier | null>;

  nextSequence(): Promise<number>;

  create(supplier: Supplier): Promise<Supplier>;

  update(supplier: Supplier): Promise<Supplier>;
}

export const SUPPLIERS_REPOSITORY = 'ISuppliersRepository';
