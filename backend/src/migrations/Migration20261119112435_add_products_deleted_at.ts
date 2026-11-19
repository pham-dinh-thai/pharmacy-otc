import { Migration } from '@mikro-orm/migrations';

export class Migration20261119112435_add_products_deleted_at extends Migration {
  override name = 'Migration20261119112435_add_products_deleted_at';

  override up(): void | Promise<void> {
    this.addSql(
      `alter table "products" add column "deleted_at" timestamptz null;`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "products" drop column "deleted_at";`);
  }
}
