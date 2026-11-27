import { Migration } from '@mikro-orm/migrations';

export class Migration20261127150000_add_checkout_payment_method extends Migration {
  override name = 'Migration20261127150000_add_checkout_payment_method';

  override up(): void | Promise<void> {
    this.addSql(
      `alter table "checkouts" add column "payment_method" text not null default 'cod';`,
    );
    this.addSql(
      `alter table "checkouts" alter column "payment_method" drop default;`,
    );
    this.addSql(
      `alter table "checkouts" add constraint "checkouts_payment_method_check" check ("payment_method" in ('cod', 'sepay', 'zalopay', 'vietqr'));`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(
      `alter table "checkouts" drop constraint if exists "checkouts_payment_method_check";`,
    );
    this.addSql(
      `alter table "checkouts" drop column if exists "payment_method";`,
    );
  }
}
