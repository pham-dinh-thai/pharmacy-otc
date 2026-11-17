import { Migration } from '@mikro-orm/migrations';

export class Migration20261117135015_add_employee_position_status extends Migration {
  override name = 'Migration20261117135015_add_employee_position_status';

  override up(): void | Promise<void> {
    this.addSql(
      `alter table "employees" add "position" varchar(255) null, add "status" text not null default 'working';`,
    );
    this.addSql(
      `alter table "employees" add constraint "employees_status_check" check ("status" in ('working', 'resigned', 'pregnant'));`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(
      `alter table "employees" drop constraint "employees_status_check";`,
    );
    this.addSql(
      `alter table "employees" drop column "position", drop column "status";`,
    );
  }
}
