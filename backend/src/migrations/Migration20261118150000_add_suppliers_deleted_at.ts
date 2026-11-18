import { Migration } from '@mikro-orm/migrations';

export class Migration20261118150000 extends Migration {
  override name = 'Migration20261118150000';

  override up(): void | Promise<void> {
    this.addSql(
      `alter table "suppliers" add column "deleted_at" timestamptz(6) null;`,
    );
    this.addSql(
      `update "suppliers" set "deleted_at" = now() where "status" = 'inactive';`,
    );
    this.addSql(
      `alter table "suppliers" drop constraint "suppliers_status_check";`,
    );
    this.addSql(`alter table "suppliers" drop column "status";`);
  }

  override down(): void | Promise<void> {
    this.addSql(
      `alter table "suppliers" add column "status" text not null default 'active';`,
    );
    this.addSql(
      `alter table "suppliers" add constraint "suppliers_status_check" check ("status" in ('active', 'inactive'));`,
    );
    this.addSql(
      `update "suppliers" set "status" = 'inactive' where "deleted_at" is not null;`,
    );
    this.addSql(`alter table "suppliers" drop column "deleted_at";`);
  }
}
