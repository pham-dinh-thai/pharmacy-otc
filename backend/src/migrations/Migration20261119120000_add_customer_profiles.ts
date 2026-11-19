import { Migration } from '@mikro-orm/migrations';

export class Migration20261119120000_add_customer_profiles extends Migration {
  override name = 'Migration20261119120000_add_customer_profiles';

  override up(): void | Promise<void> {
    this.addSql(
      `alter table "customers" add column "gender" varchar(255) null;`,
    );
    this.addSql(
      `alter table "customers" add column "date_of_birth" date null;`,
    );
    this.addSql(
      `alter table "customers" add column "deleted_at" timestamptz(6) null;`,
    );
    this.addSql(
      `create unique index "customers_user_id_unique" on "customers" ("user_id");`,
    );

    this.addSql(
      `create table "customer_phones" ("id" uuid not null, "customer_id" uuid not null, "phone" varchar(30) not null, "is_primary" boolean not null default false, "created_at" timestamptz(6) not null default now(), "updated_at" timestamptz(6) not null default now(), primary key ("id"));`,
    );
    this.addSql(
      `create index "customer_phones_customer_id_index" on "customer_phones" ("customer_id");`,
    );

    this.addSql(
      `create table "customer_addresses" ("id" uuid not null, "customer_id" uuid not null, "address" varchar(500) not null, "is_default" boolean not null default false, "created_at" timestamptz(6) not null default now(), "updated_at" timestamptz(6) not null default now(), primary key ("id"));`,
    );
    this.addSql(
      `create index "customer_addresses_customer_id_index" on "customer_addresses" ("customer_id");`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists "customer_addresses";`);
    this.addSql(`drop table if exists "customer_phones";`);
    this.addSql(`drop index if exists "customers_user_id_unique";`);
    this.addSql(`alter table "customers" drop column "deleted_at";`);
    this.addSql(`alter table "customers" drop column "date_of_birth";`);
    this.addSql(`alter table "customers" drop column "gender";`);
  }
}
