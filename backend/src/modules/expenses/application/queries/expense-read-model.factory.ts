import { Expense } from '../../domain/expense.aggregate';
import { ExpenseDetailReadModel } from './get-expense/expense-detail.read-model';
import { ExpenseListItemReadModel } from './get-expenses/expense-list-item.read-model';

export function expenseToListItem(expense: Expense): ExpenseListItemReadModel {
  return new ExpenseListItemReadModel(
    expense.getId(),
    expense.getName(),
    expense.getCategory(),
    expense.getAmount(),
    expense.getExpenseDate(),
    expense.getSupplierId(),
    expense.getStatus(),
    expense.getPaymentMethod(),
    expense.getNote(),
    expense.getCreatedBy(),
    expense.getCreatedAt(),
    expense.getUpdatedAt(),
  );
}

export function expenseToDetail(expense: Expense): ExpenseDetailReadModel {
  return new ExpenseDetailReadModel(
    expense.getId(),
    expense.getName(),
    expense.getCategory(),
    expense.getAmount(),
    expense.getExpenseDate(),
    expense.getSupplierId(),
    expense.getStatus(),
    expense.getPaymentMethod(),
    expense.getNote(),
    expense.getCreatedBy(),
    expense.getCreatedAt(),
    expense.getUpdatedAt(),
  );
}
