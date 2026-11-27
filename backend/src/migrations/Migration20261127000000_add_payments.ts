import { Migration } from '@mikro-orm/migrations';

export class Migration20261127000000_add_payments extends Migration {
  override name = 'Migration20261127000000_add_payments';

  override up(): void | Promise<void> {
    this.addSql(
      `create table "payments" ("id" uuid not null, "order_id" uuid not null, "provider" text not null, "status" text not null, "amount" bigint not null, "transaction_ref" varchar(255) not null, "provider_transaction_no" varchar(255) null, "bank_code" varchar(50) null, "response_code" varchar(20) null, "provider_payload" jsonb null, "paid_at" timestamptz null, "expires_at" timestamptz null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`,
    );
    this.addSql(
      `alter table "payments" add constraint "payments_order_id_foreign" foreign key ("order_id") references "orders" ("id") on update cascade on delete cascade;`,
    );
    this.addSql(
      `alter table "payments" add constraint "payments_provider_check" check ("provider" in ('vnpay', 'cod'));`,
    );
    this.addSql(
      `alter table "payments" add constraint "payments_status_check" check ("status" in ('pending', 'success', 'failed', 'expired'));`,
    );
    this.addSql(
      `alter table "payments" add constraint "payments_amount_check" check ("amount" >= 0);`,
    );
    this.addSql(
      `alter table "payments" add constraint "payments_transaction_ref_unique" unique ("transaction_ref");`,
    );
    this.addSql(
      `create index "payments_order_id_idx" on "payments" ("order_id");`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists "payments" cascade;`);
  }
}
