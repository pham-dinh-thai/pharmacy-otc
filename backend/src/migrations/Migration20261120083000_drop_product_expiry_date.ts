import { Migration } from '@mikro-orm/migrations';

export class Migration20261120083000_drop_product_expiry_date extends Migration {
  override name = 'Migration20261120083000_drop_product_expiry_date';

  override up(): void | Promise<void> {
    this.addSql(`alter table "products" drop column "expiry_date";`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "products" add "expiry_date" date null;`);
  }
}
