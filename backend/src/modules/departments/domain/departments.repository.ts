import { type TriStateFilter } from '../../../shared/utils/list-filters';
import { Department } from './department.aggregate';

export const DEPARTMENTS_REPOSITORY = 'IDepartmentsRepository';

export type DepartmentPage = {
  items: Department[];
  total: number;
};

export type FindDepartmentsOptions = {
  limit: number;
  offset: number;
  search?: string;
  deleted?: TriStateFilter;
};

export interface IDepartmentsRepository {
  findPage(options: FindDepartmentsOptions): Promise<DepartmentPage>;

  findActive(): Promise<Department[]>;

  findById(id: string): Promise<Department | null>;

  create(department: Department): Promise<Department>;

  update(department: Department): Promise<Department>;
}
