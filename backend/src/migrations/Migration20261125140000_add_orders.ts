import { Migration } from '@mikro-orm/migrations';

export class Migration20261125140000_add_orders extends Migration {
  override name = 'Migration20261125140000_add_orders';

  override up(): void | Promise<void> {
    this.addSql(
      `create table "orders" ("id" uuid not null, "user_id" uuid not null, "checkout_id" uuid not null, "shipping_name" varchar(255) not null, "shipping_address" text not null, "shipping_phone" varchar(20) not null, "shipping_fee" bigint not null, "note" text null, "status" text not null, "payment_status" text not null, "confirmed_at" timestamptz null, "delivering_at" timestamptz null, "completed_at" timestamptz null, "cancelled_at" timestamptz null, "failed_at" timestamptz null, "paid_at" timestamptz null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`,
    );
    this.addSql(
      `alter table "orders" add constraint "orders_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade on delete cascade;`,
    );
    this.addSql(
      `alter table "orders" add constraint "orders_checkout_id_unique" unique ("checkout_id");`,
    );
    this.addSql(
      `alter table "orders" add constraint "orders_status_check" check ("status" in ('pending', 'confirmed', 'delivering', 'completed', 'cancelled', 'failed'));`,
    );
    this.addSql(
      `alter table "orders" add constraint "orders_payment_status_check" check ("payment_status" in ('unpaid', 'paid'));`,
    );
    this.addSql(
      `create index "orders_user_created_idx" on "orders" ("user_id", "created_at" desc, "id" desc);`,
    );

    this.addSql(
      `create table "order_lines" ("id" uuid not null, "order_id" uuid not null, "product_id" uuid not null, "product_name" varchar(255) not null, "product_sku" varchar(100) null, "unit_price" bigint not null, "quantity" int not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`,
    );
    this.addSql(
      `alter table "order_lines" add constraint "order_lines_order_id_foreign" foreign key ("order_id") references "orders" ("id") on update cascade on delete cascade;`,
    );
    this.addSql(
      `alter table "order_lines" add constraint "order_lines_product_id_foreign" foreign key ("product_id") references "products" ("id") on update cascade on delete no action;`,
    );
    this.addSql(
      `alter table "order_lines" add constraint "order_lines_order_id_product_id_unique" unique ("order_id", "product_id");`,
    );
    this.addSql(
      `create index "order_lines_order_id_idx" on "order_lines" ("order_id");`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists "order_lines" cascade;`);
    this.addSql(`drop table if exists "orders" cascade;`);
  }
}
