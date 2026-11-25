import type { TriStateFilter } from '../../../shared/utils/list-filters';
import { Customer } from './customer.aggregate';

export type CustomerPage = {
  items: Customer[];
  total: number;
};

export type FindCustomersOptions = {
  limit: number;
  offset: number;
  search?: string;
  deleted?: TriStateFilter;
};

export interface ICustomersRepository {
  findPage(options: FindCustomersOptions): Promise<CustomerPage>;

  findById(id: string): Promise<Customer | null>;

  findByUserId(userId: string): Promise<Customer | null>;

  findByIdIncludingDeleted(id: string): Promise<Customer | null>;

  existsByIdAndUserId(id: string, userId: string): Promise<boolean>;

  create(customer: Customer): Promise<Customer>;

  update(customer: Customer): Promise<Customer>;
}

export const CUSTOMERS_REPOSITORY = 'ICustomersRepository';
