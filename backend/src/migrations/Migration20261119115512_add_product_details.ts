import { Migration } from '@mikro-orm/migrations';

export class Migration20261119115512_add_product_details extends Migration {
  override name = 'Migration20261119115512_add_product_details';

  override up(): void | Promise<void> {
    this.addSql(
      `alter table "audit_logs" drop constraint "audit_logs_entity_type_check";`,
    );
    this.addSql(
      `alter table "audit_logs" add constraint "audit_logs_entity_type_check" check ("entity_type" in ('accounts', 'users', 'customers', 'roles', 'orders', 'products', 'categories', 'suppliers', 'goods_receipts', 'inventories', 'expenses', 'employees', 'departments'));`,
    );

    this.addSql(
      `alter table "products" add "sku" varchar(100) null, add "unit" varchar(50) null, add "description" text null, add "image_url" varchar(2048) null, add "expiry_date" date null, add "warning" text null;`,
    );
    this.addSql(
      `alter table "products" add constraint "products_sku_unique" unique ("sku");`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(
      `alter table "audit_logs" drop constraint "audit_logs_entity_type_check";`,
    );
    this.addSql(
      `alter table "audit_logs" add constraint "audit_logs_entity_type_check" check ("entity_type" in ('accounts', 'users', 'customers', 'roles', 'orders', 'products', 'suppliers', 'goods_receipts', 'inventories', 'expenses', 'employees', 'departments'));`,
    );

    this.addSql(
      `alter table "products" drop constraint "products_sku_unique";`,
    );
    this.addSql(
      `alter table "products" drop column "sku", drop column "unit", drop column "description", drop column "image_url", drop column "expiry_date", drop column "warning";`,
    );
  }
}
