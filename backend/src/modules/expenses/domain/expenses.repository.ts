import { Expense } from './expense.aggregate';
import { ExpenseCategory } from './enums/expense-category.enum';
import { ExpenseStatus } from './enums/expense-status.enum';

export type FindExpensesFilters = {
  search?: string;
  status?: ExpenseStatus | 'all';
  category?: ExpenseCategory | 'all';
  supplierId?: string;
  limit?: number;
  offset?: number;
};

export type FindExpenseOptions = {
  forUpdate?: boolean;
};

export type ExpensePage = {
  items: Expense[];
  total: number;
};

export interface IExpensesRepository {
  findAll(): Promise<Expense[]>;

  findPage(filters?: FindExpensesFilters): Promise<ExpensePage>;

  findById(id: string, options?: FindExpenseOptions): Promise<Expense | null>;

  create(expense: Expense): Promise<Expense>;

  update(expense: Expense): Promise<Expense>;
}

export const EXPENSES_REPOSITORY = 'IExpensesRepository';
