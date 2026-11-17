import { Department } from './department.aggregate';

export const DEPARTMENTS_REPOSITORY = 'IDepartmentsRepository';

export interface IDepartmentsRepository {
  findAll(): Promise<Department[]>;

  findActive(): Promise<Department[]>;

  findById(id: string): Promise<Department | null>;

  create(department: Department): Promise<Department>;

  update(department: Department): Promise<Department>;
}
