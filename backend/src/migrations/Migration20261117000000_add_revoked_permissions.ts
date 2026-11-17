import { Migration } from '@mikro-orm/migrations';

export class Migration20261117000000 extends Migration {
  override name = 'Migration20261117000000';

  override up(): void | Promise<void> {
    this.addSql(
      `alter table "roles" add column "revoked_permissions" text[] not null default '{}';`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "roles" drop column "revoked_permissions";`);
  }
}
