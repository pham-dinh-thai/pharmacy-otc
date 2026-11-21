import { Command } from '@nestjs/cqrs';
import { type ActorHeaders } from '../../../../../shared/types/actor-headers';
import { ExpenseCategory } from '../../../domain/enums/expense-category.enum';
import { PaymentMethod } from '../../../domain/enums/payment-method.enum';

export class UpdateExpenseCommand extends Command<{ id: string }> {
  public constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly category: ExpenseCategory,
    public readonly amount: bigint,
    public readonly expenseDate: Date,
    public readonly supplierId: string | null,
    public readonly paymentMethod: PaymentMethod | null,
    public readonly note: string | null,
    public readonly headers: ActorHeaders,
  ) {
    super();
  }
}
