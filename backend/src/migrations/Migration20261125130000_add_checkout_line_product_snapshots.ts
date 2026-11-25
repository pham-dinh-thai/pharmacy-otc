import { Migration } from '@mikro-orm/migrations';

export class Migration20261125130000_add_checkout_line_product_snapshots extends Migration {
  override name = 'Migration20261125130000_add_checkout_line_product_snapshots';

  override up(): void | Promise<void> {
    this.addSql(
      `alter table "checkout_lines" add column "product_name" varchar(255) null;`,
    );
    this.addSql(
      `alter table "checkout_lines" add column "product_sku" varchar(100) null;`,
    );
    this.addSql(
      `update "checkout_lines" as "cl" set "product_name" = "p"."name", "product_sku" = "p"."sku" from "products" as "p" where "p"."id" = "cl"."product_id";`,
    );
    this.addSql(
      `update "checkout_lines" set "product_name" = 'Unknown product' where "product_name" is null;`,
    );
    this.addSql(
      `alter table "checkout_lines" alter column "product_name" set not null;`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "checkout_lines" drop column "product_sku";`);
    this.addSql(`alter table "checkout_lines" drop column "product_name";`);
  }
}
