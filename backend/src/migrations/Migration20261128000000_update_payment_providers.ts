import { Migration } from '@mikro-orm/migrations';

export class Migration20261128000000_update_payment_providers extends Migration {
  override name = 'Migration20261128000000_update_payment_providers';

  override up(): void | Promise<void> {
    this.addSql(
      `alter table "payments" drop constraint "payments_provider_check";`,
    );
    this.addSql(
      `alter table "payments" add constraint "payments_provider_check" check ("provider" in ('sepay', 'zalopay', 'vietqr'));`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(
      `alter table "payments" drop constraint "payments_provider_check";`,
    );
    this.addSql(
      `alter table "payments" add constraint "payments_provider_check" check ("provider" in ('vnpay', 'cod'));`,
    );
  }
}
