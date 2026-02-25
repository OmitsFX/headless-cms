import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Recovery for a previously failed migration attempt.
  // If temp tables exist from a partial run, remove them first.
  await db.run(sql`DROP TABLE IF EXISTS \`__new__legal_v\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`__new_legal\`;`)

  // Add new deployment log columns (additive, no table rebuild).
  await db.run(sql`ALTER TABLE \`deployment_logs\` ADD \`resource_type\` text;`)
  await db.run(sql`ALTER TABLE \`deployment_logs\` ADD \`resource_slug\` text;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`deployment_logs\` DROP COLUMN \`resource_type\`;`)
  await db.run(sql`ALTER TABLE \`deployment_logs\` DROP COLUMN \`resource_slug\`;`)
}

