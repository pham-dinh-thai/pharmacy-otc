import { Migration } from '@mikro-orm/migrations';

export class Migration20261123120500_add_checkouts extends Migration {
  override name = 'Migration20261123120500_add_checkouts';

  override up(): void | Promise<void> {
    this.addSql(
      `create table "checkouts" ("id" uuid not null, "user_id" uuid not null, "shipping_name" varchar(255) not null, "shipping_address" text not null, "shipping_phone" varchar(20) not null, "status" text not null, "confirmed_at" timestamptz null, "cancelled_at" timestamptz null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`,
    );

    this.addSql(
      `alter table "checkouts" add constraint "checkouts_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade on delete cascade;`,
    );
    this.addSql(
      `alter table "checkouts" add constraint "checkouts_status_check" check ("status" in ('pending', 'confirmed', 'cancelled', 'expired'));`,
    );
    this.addSql(
      `create index "checkouts_user_id_created_at_id_idx" on "checkouts" ("user_id", "created_at" desc, "id" desc);`,
    );

    this.addSql(
      `create table "checkout_lines" ("id" uuid not null, "checkout_id" uuid not null, "product_id" uuid not null, "unit_price" bigint not null, "quantity" int not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`,
    );

    this.addSql(
      `alter table "checkout_lines" add constraint "checkout_lines_checkout_id_foreign" foreign key ("checkout_id") references "checkouts" ("id") on update cascade on delete cascade;`,
    );
    this.addSql(
      `alter table "checkout_lines" add constraint "checkout_lines_product_id_foreign" foreign key ("product_id") references "products" ("id") on update cascade on delete no action;`,
    );
    this.addSql(
      `alter table "checkout_lines" add constraint "checkout_lines_checkout_id_product_id_unique" unique ("checkout_id", "product_id");`,
    );
    this.addSql(
      `create index "checkout_lines_checkout_id_idx" on "checkout_lines" ("checkout_id");`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists "checkout_lines" cascade;`);
    this.addSql(`drop table if exists "checkouts" cascade;`);
  }
}
