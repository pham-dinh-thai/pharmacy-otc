import { Migration } from '@mikro-orm/migrations';

export class Migration20261117152013_add_must_change_password extends Migration {
  override name = 'Migration20261117152013_add_must_change_password';

  override up(): void | Promise<void> {
    this.addSql(
      `alter table "accounts" add "must_change_password" boolean not null default false;`,
    );
    this.addSql(
      `alter table "accounts" alter column "must_change_password" drop default;`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "accounts" drop column "must_change_password";`);
  }
}
