import { Migration } from '@mikro-orm/migrations';

export class Migration20261127160000_add_checkout_confirming extends Migration {
  override name = 'Migration20261127160000_add_checkout_confirming';

  override up(): void | Promise<void> {
    this.addSql(
      `alter table "checkouts" add column "confirming_at" timestamptz null;`,
    );
    this.addSql(
      `alter table "checkouts" drop constraint "checkouts_status_check";`,
    );
    this.addSql(
      `alter table "checkouts" add constraint "checkouts_status_check" check ("status" in ('pending', 'confirming', 'confirmed', 'cancelled', 'expired'));`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(
      `alter table "checkouts" drop constraint "checkouts_status_check";`,
    );
    this.addSql(
      `alter table "checkouts" add constraint "checkouts_status_check" check ("status" in ('pending', 'confirmed', 'cancelled', 'expired'));`,
    );
    this.addSql(
      `alter table "checkouts" drop column if exists "confirming_at";`,
    );
  }
}
