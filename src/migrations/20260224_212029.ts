import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`legal\` (
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
  await db.run(sql`CREATE INDEX \`legal_slug_idx\` ON \`legal\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`legal_updated_at_idx\` ON \`legal\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`legal_created_at_idx\` ON \`legal\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`legal__status_idx\` ON \`legal\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`legal_locales\` (
  	\`title\` text,
  	\`description\` text,
  	\`body\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`legal\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`legal_locales_locale_parent_id_unique\` ON \`legal_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_legal_v\` (
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
  await db.run(sql`CREATE TABLE \`_legal_v_locales\` (
  	\`version_title\` text,
  	\`version_description\` text,
  	\`version_body\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_legal_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`_legal_v_locales_locale_parent_id_unique\` ON \`_legal_v_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`deployment_settings_enabled_collections\` (
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`value\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`deployment_settings\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`deployment_settings_enabled_collections_order_idx\` ON \`deployment_settings_enabled_collections\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`deployment_settings_enabled_collections_parent_idx\` ON \`deployment_settings_enabled_collections\` (\`parent_id\`);`)
  await db.run(sql`CREATE TABLE \`deployment_settings\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`deploy_on_publish\` integer DEFAULT true,
  	\`deploy_on_update\` integer DEFAULT true,
  	\`deploy_on_delete\` integer DEFAULT true,
  	\`deploy_hook_url\` text,
  	\`enable_logging\` integer DEFAULT true,
  	\`updated_at\` text,
  	\`created_at\` text
  );
  `)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`legal_id\` integer REFERENCES legal(id);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_legal_id_idx\` ON \`payload_locked_documents_rels\` (\`legal_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`legal\`;`)
  await db.run(sql`DROP TABLE \`legal_locales\`;`)
  await db.run(sql`DROP TABLE \`_legal_v\`;`)
  await db.run(sql`DROP TABLE \`_legal_v_locales\`;`)
  await db.run(sql`DROP TABLE \`deployment_settings_enabled_collections\`;`)
  await db.run(sql`DROP TABLE \`deployment_settings\`;`)
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`users_id\` integer,
  	\`media_id\` integer,
  	\`posts_id\` integer,
  	\`deployment_logs_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`posts_id\`) REFERENCES \`posts\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`deployment_logs_id\`) REFERENCES \`deployment_logs\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "users_id", "media_id", "posts_id", "deployment_logs_id") SELECT "id", "order", "parent_id", "path", "users_id", "media_id", "posts_id", "deployment_logs_id" FROM \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_payload_locked_documents_rels\` RENAME TO \`payload_locked_documents_rels\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_posts_id_idx\` ON \`payload_locked_documents_rels\` (\`posts_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_deployment_logs_id_idx\` ON \`payload_locked_documents_rels\` (\`deployment_logs_id\`);`)
}
