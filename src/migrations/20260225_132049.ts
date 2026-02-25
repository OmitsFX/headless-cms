import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_legal\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`slug\` text,
  	\`slug_lock\` integer DEFAULT false,
  	\`last_updated\` text,
  	\`previous_publication_date\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`_status\` text DEFAULT 'draft'
  );
  `)
  await db.run(sql`INSERT INTO \`__new_legal\`("id", "slug", "slug_lock", "last_updated", "previous_publication_date", "updated_at", "created_at", "_status") SELECT "id", "slug", "slug_lock", "last_updated", "previous_publication_date", "updated_at", "created_at", "_status" FROM \`legal\`;`)
  await db.run(sql`DROP TABLE \`legal\`;`)
  await db.run(sql`ALTER TABLE \`__new_legal\` RENAME TO \`legal\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`legal_slug_idx\` ON \`legal\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`legal_updated_at_idx\` ON \`legal\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`legal_created_at_idx\` ON \`legal\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`legal__status_idx\` ON \`legal\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`__new__legal_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version_slug\` text,
  	\`version_slug_lock\` integer DEFAULT false,
  	\`version_last_updated\` text,
  	\`version_previous_publication_date\` text,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`snapshot\` integer,
  	\`published_locale\` text,
  	\`latest\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`legal\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`INSERT INTO \`__new__legal_v\`("id", "parent_id", "version_slug", "version_slug_lock", "version_last_updated", "version_previous_publication_date", "version_updated_at", "version_created_at", "version__status", "created_at", "updated_at", "snapshot", "published_locale", "latest") SELECT "id", "parent_id", "version_slug", "version_slug_lock", "version_last_updated", "version_previous_publication_date", "version_updated_at", "version_created_at", "version__status", "created_at", "updated_at", "snapshot", "published_locale", "latest" FROM \`_legal_v\`;`)
  await db.run(sql`DROP TABLE \`_legal_v\`;`)
  await db.run(sql`ALTER TABLE \`__new__legal_v\` RENAME TO \`_legal_v\`;`)
  await db.run(sql`CREATE INDEX \`_legal_v_parent_idx\` ON \`_legal_v\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_legal_v_version_version_slug_idx\` ON \`_legal_v\` (\`version_slug\`);`)
  await db.run(sql`CREATE INDEX \`_legal_v_version_version_updated_at_idx\` ON \`_legal_v\` (\`version_updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_legal_v_version_version_created_at_idx\` ON \`_legal_v\` (\`version_created_at\`);`)
  await db.run(sql`CREATE INDEX \`_legal_v_version_version__status_idx\` ON \`_legal_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_legal_v_created_at_idx\` ON \`_legal_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_legal_v_updated_at_idx\` ON \`_legal_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_legal_v_snapshot_idx\` ON \`_legal_v\` (\`snapshot\`);`)
  await db.run(sql`CREATE INDEX \`_legal_v_published_locale_idx\` ON \`_legal_v\` (\`published_locale\`);`)
  await db.run(sql`CREATE INDEX \`_legal_v_latest_idx\` ON \`_legal_v\` (\`latest\`);`)
  await db.run(sql`ALTER TABLE \`deployment_logs\` ADD \`resource_type\` text;`)
  await db.run(sql`ALTER TABLE \`deployment_logs\` ADD \`resource_slug\` text;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_legal\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`slug\` text,
  	\`slug_lock\` integer DEFAULT false,
  	\`last_updated\` text DEFAULT '2026-02-24T21:20:29.236Z',
  	\`previous_publication_date\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`_status\` text DEFAULT 'draft'
  );
  `)
  await db.run(sql`INSERT INTO \`__new_legal\`("id", "slug", "slug_lock", "last_updated", "previous_publication_date", "updated_at", "created_at", "_status") SELECT "id", "slug", "slug_lock", "last_updated", "previous_publication_date", "updated_at", "created_at", "_status" FROM \`legal\`;`)
  await db.run(sql`DROP TABLE \`legal\`;`)
  await db.run(sql`ALTER TABLE \`__new_legal\` RENAME TO \`legal\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`legal_slug_idx\` ON \`legal\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`legal_updated_at_idx\` ON \`legal\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`legal_created_at_idx\` ON \`legal\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`legal__status_idx\` ON \`legal\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`__new__legal_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version_slug\` text,
  	\`version_slug_lock\` integer DEFAULT false,
  	\`version_last_updated\` text DEFAULT '2026-02-24T21:20:29.236Z',
  	\`version_previous_publication_date\` text,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`snapshot\` integer,
  	\`published_locale\` text,
  	\`latest\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`legal\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`INSERT INTO \`__new__legal_v\`("id", "parent_id", "version_slug", "version_slug_lock", "version_last_updated", "version_previous_publication_date", "version_updated_at", "version_created_at", "version__status", "created_at", "updated_at", "snapshot", "published_locale", "latest") SELECT "id", "parent_id", "version_slug", "version_slug_lock", "version_last_updated", "version_previous_publication_date", "version_updated_at", "version_created_at", "version__status", "created_at", "updated_at", "snapshot", "published_locale", "latest" FROM \`_legal_v\`;`)
  await db.run(sql`DROP TABLE \`_legal_v\`;`)
  await db.run(sql`ALTER TABLE \`__new__legal_v\` RENAME TO \`_legal_v\`;`)
  await db.run(sql`CREATE INDEX \`_legal_v_parent_idx\` ON \`_legal_v\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_legal_v_version_version_slug_idx\` ON \`_legal_v\` (\`version_slug\`);`)
  await db.run(sql`CREATE INDEX \`_legal_v_version_version_updated_at_idx\` ON \`_legal_v\` (\`version_updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_legal_v_version_version_created_at_idx\` ON \`_legal_v\` (\`version_created_at\`);`)
  await db.run(sql`CREATE INDEX \`_legal_v_version_version__status_idx\` ON \`_legal_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_legal_v_created_at_idx\` ON \`_legal_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_legal_v_updated_at_idx\` ON \`_legal_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_legal_v_snapshot_idx\` ON \`_legal_v\` (\`snapshot\`);`)
  await db.run(sql`CREATE INDEX \`_legal_v_published_locale_idx\` ON \`_legal_v\` (\`published_locale\`);`)
  await db.run(sql`CREATE INDEX \`_legal_v_latest_idx\` ON \`_legal_v\` (\`latest\`);`)
  await db.run(sql`ALTER TABLE \`deployment_logs\` DROP COLUMN \`resource_type\`;`)
  await db.run(sql`ALTER TABLE \`deployment_logs\` DROP COLUMN \`resource_slug\`;`)
}
