import { Migration } from '@mikro-orm/migrations';

export class Migration20261117133819_drop_employee_foreign_keys extends Migration {
  override name = 'Migration20261117133819_drop_employee_foreign_keys';

  override up(): void | Promise<void> {
    this.addSql(
      `alter table "employees" drop constraint "employees_user_id_foreign";`,
    );
    this.addSql(
      `alter table "employees" drop constraint "employees_department_id_foreign";`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(
      `alter table "employees" add constraint "employees_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade on delete cascade;`,
    );
    this.addSql(
      `alter table "employees" add constraint "employees_department_id_foreign" foreign key ("department_id") references "departments" ("id") on update cascade on delete no action;`,
    );
  }
}
