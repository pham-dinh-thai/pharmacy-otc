import { Migration } from '@mikro-orm/migrations';

export class Migration20261117134045_add_employee_user_one_to_one extends Migration {
  override name = 'Migration20261117134045_add_employee_user_one_to_one';

  override up(): void | Promise<void> {
    this.addSql(
      `alter table "employees" add constraint "employees_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade on delete cascade;`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(
      `alter table "employees" drop constraint "employees_user_id_foreign";`,
    );
  }
}
