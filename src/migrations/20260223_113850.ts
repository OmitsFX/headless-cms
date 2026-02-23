import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db }: MigrateUpArgs): Promise<void> {

  await db.run(sql`
    CREATE TABLE deployment_logs_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      status TEXT NOT NULL,
      trigger TEXT NOT NULL,
      post_id INTEGER,
      post_slug TEXT,
      build_id TEXT,
      response_status NUMERIC,
      error_message TEXT,
      cloudflare_response TEXT,
      updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
      created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL
    );
  `)

  await db.run(sql`
    INSERT INTO deployment_logs_new (
      id, status, trigger, post_id, post_slug,
      build_id, response_status, error_message,
      cloudflare_response, updated_at, created_at
    )
    SELECT
      id, status, trigger, post_id, post_slug,
      build_id, response_status, error_message,
      cloudflare_response, updated_at, created_at
    FROM deployment_logs;
  `)

  await db.run(sql`DROP TABLE deployment_logs;`)
  await db.run(sql`ALTER TABLE deployment_logs_new RENAME TO deployment_logs;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // no-op (normal for SQLite)
}