import { Migration } from '@mikro-orm/migrations';

export class Migration20261117001000 extends Migration {
  override name = 'Migration20261117001000';

  override up(): void | Promise<void> {
    this.addSql(
      `alter table "roles" add column "deleted_at" timestamptz null;`,
    );
    this.addSql(`alter table "roles" drop column "revoked_permissions";`);
  }

  override down(): void | Promise<void> {
    this.addSql(
      `alter table "roles" add column "revoked_permissions" text[] not null default '{}';`,
    );
    this.addSql(`alter table "roles" drop column "deleted_at";`);
  }
}
