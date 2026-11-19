import { Migration } from '@mikro-orm/migrations';

export class Migration20261119110753_add_categories extends Migration {
  override name = 'Migration20261119110753_add_categories';

  override up(): void | Promise<void> {
    this.addSql(
      `create table "categories" ("id" uuid not null, "name" varchar(255) not null, "slug" varchar(255) not null, "description" varchar(255) null, "deleted_at" timestamptz null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`,
    );
    this.addSql(
      `alter table "categories" add constraint "categories_name_unique" unique ("name");`,
    );
    this.addSql(
      `alter table "categories" add constraint "categories_slug_unique" unique ("slug");`,
    );

    this.addSql(
      `create table "product_categories" ("category_id" uuid not null, "product_id" uuid not null, primary key ("category_id", "product_id"));`,
    );
    this.addSql(
      `alter table "product_categories" add constraint "product_categories_category_id_foreign" foreign key ("category_id") references "categories" ("id") on update cascade on delete cascade;`,
    );
    this.addSql(
      `alter table "product_categories" add constraint "product_categories_product_id_foreign" foreign key ("product_id") references "products" ("id") on update cascade on delete cascade;`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists "product_categories" cascade;`);
    this.addSql(`drop table if exists "categories" cascade;`);
  }
}
