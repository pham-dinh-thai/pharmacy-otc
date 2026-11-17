import { Migration } from '@mikro-orm/migrations';

export class Migration20261117142221_add_departments_audit_entity_type extends Migration {
  override name = 'Migration20261117142221_add_departments_audit_entity_type';

  override up(): void | Promise<void> {
    this.addSql(
      `alter table "audit_logs" drop constraint "audit_logs_entity_type_check";`,
    );
    this.addSql(
      `alter table "audit_logs" add constraint "audit_logs_entity_type_check" check ("entity_type" in ('accounts', 'users', 'customers', 'roles', 'orders', 'products', 'suppliers', 'goods_receipts', 'inventories', 'expenses', 'employees', 'departments'));`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(
      `alter table "audit_logs" drop constraint "audit_logs_entity_type_check";`,
    );
    this.addSql(
      `alter table "audit_logs" add constraint "audit_logs_entity_type_check" check ("entity_type" in ('accounts', 'users', 'customers', 'roles', 'orders', 'products', 'suppliers', 'goods_receipts', 'inventories', 'expenses', 'employees'));`,
    );
  }
}
