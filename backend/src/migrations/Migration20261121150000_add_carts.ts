import { Migration } from '@mikro-orm/migrations';

export class Migration20261121150000_add_carts extends Migration {
  override name = 'Migration20261121150000_add_carts';

  override up(): void | Promise<void> {
    this.addSql(
      `create table "carts" ("id" uuid not null, "user_id" uuid null, "guest_token" uuid null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`,
    );
    this.addSql(
      `alter table "carts" add constraint "carts_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade on delete cascade;`,
    );
    this.addSql(
      `alter table "carts" add constraint "carts_user_id_unique" unique ("user_id");`,
    );
    this.addSql(
      `alter table "carts" add constraint "carts_guest_token_unique" unique ("guest_token");`,
    );

    this.addSql(
      `create table "cart_items" ("id" uuid not null, "cart_id" uuid not null, "product_id" uuid not null, "quantity" int not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`,
    );
    this.addSql(
      `alter table "cart_items" add constraint "cart_items_cart_id_foreign" foreign key ("cart_id") references "carts" ("id") on update cascade on delete cascade;`,
    );
    this.addSql(
      `alter table "cart_items" add constraint "cart_items_product_id_foreign" foreign key ("product_id") references "products" ("id") on update cascade on delete no action;`,
    );
    this.addSql(
      `alter table "cart_items" add constraint "cart_items_cart_id_product_id_unique" unique ("cart_id", "product_id");`,
    );
    this.addSql(
      `alter table "cart_items" add constraint "cart_items_quantity_check" check ("quantity" > 0);`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists "cart_items" cascade;`);
    this.addSql(`drop table if exists "carts" cascade;`);
  }
}
