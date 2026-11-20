import { Migration } from '@mikro-orm/migrations';

export class Migration20261120080000_drop_product_quantity extends Migration {
  override name = 'Migration20261120080000_drop_product_quantity';

  override up(): void | Promise<void> {
    this.addSql(`alter table "products" drop column "quantity";`);
  }

  override down(): void | Promise<void> {
    this.addSql(
      `alter table "products" add "quantity" int not null default 0;`,
    );
    this.addSql(
      `update "products" p set "quantity" = coalesce(i.total_quantity, 0)
      from "inventories" i where i.product_id = p.id;`,
    );
    this.addSql(`alter table "products" alter column "quantity" drop default;`);
  }
}
