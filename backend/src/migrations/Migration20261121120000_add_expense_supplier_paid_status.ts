import { Migration } from '@mikro-orm/migrations';

export class Migration20261121120000_add_expense_supplier_paid_status extends Migration {
  override name = 'Migration20261121120000_add_expense_supplier_paid_status';

  override up(): void | Promise<void> {
    this.addSql(
      `alter table "expenses" drop constraint "expenses_status_check";`,
    );
    this.addSql(
      `alter table "expenses" add constraint "expenses_status_check" check ("status" in ('pending', 'approved', 'supplier_paid', 'paid', 'cancelled'));`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(
      `alter table "expenses" drop constraint "expenses_status_check";`,
    );
    this.addSql(
      `alter table "expenses" add constraint "expenses_status_check" check ("status" in ('pending', 'approved', 'paid', 'cancelled'));`,
    );
  }
}
