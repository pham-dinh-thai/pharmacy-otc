import { Migration } from '@mikro-orm/migrations';

export class Migration20261117132737_add_employees_departments extends Migration {
  override name = 'Migration20261117132737_add_employees_departments';

  override up(): void | Promise<void> {
    this.addSql(
      `create table "departments" ("id" uuid not null, "name" varchar(255) not null, "deleted_at" timestamptz null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`,
    );
    this.addSql(
      `alter table "departments" add constraint "departments_name_unique" unique ("name");`,
    );

    this.addSql(
      `create table "employees" ("id" uuid not null, "user_id" uuid not null, "department_id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`,
    );
    this.addSql(
      `alter table "employees" add constraint "employees_user_id_unique" unique ("user_id");`,
    );

    this.addSql(
      `alter table "employees" add constraint "employees_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade on delete cascade;`,
    );
    this.addSql(
      `alter table "employees" add constraint "employees_department_id_foreign" foreign key ("department_id") references "departments" ("id") on update cascade on delete no action;`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists "employees" cascade;`);
    this.addSql(`drop table if exists "departments" cascade;`);
  }
}
