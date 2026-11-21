import type { ExpenseCategory } from '../../../domain/enums/expense-category.enum';
import type { ExpenseStatus } from '../../../domain/enums/expense-status.enum';
import type { PaymentMethod } from '../../../domain/enums/payment-method.enum';

export class ExpenseListItemReadModel {
  public constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly category: ExpenseCategory,
    public readonly amount: number,
    public readonly expenseDate: Date,
    public readonly supplierId: string | null,
    public readonly status: ExpenseStatus,
    public readonly paymentMethod: PaymentMethod | null,
    public readonly note: string | null,
    public readonly createdBy: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
