import { Migration } from '@mikro-orm/migrations';

export class Migration20261125150000_drop_outbox_events extends Migration {
  override name = 'Migration20261125150000_drop_outbox_events';

  override up(): void | Promise<void> {
    this.addSql(`drop table if exists "outbox_events" cascade;`);
  }

  override down(): void | Promise<void> {
    this.addSql(
      `create table "outbox_events" ("id" serial primary key, "event_type" varchar(255) not null, "payload" jsonb not null, "created_at" timestamptz not null, "processed" boolean not null default false, "attempts" int not null default 0, "last_error" text null, "failed_at" timestamptz null);`,
    );
  }
}
