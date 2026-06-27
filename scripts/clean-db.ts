import { config } from 'dotenv'
import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import { sql } from 'drizzle-orm'

config({ path: ['.env.local', '.env'] })

async function clean() {
  const { Pool } = pg
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! })
  const db = drizzle(pool)

  console.log('🌱 Cleaning database...')

  const tablenames = await db.execute(sql`
    SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename != '__drizzle_migrations';
  `)

  for (const row of tablenames.rows) {
    const table = row.tablename as string
    console.log(`Truncating ${table}...`)
    await db.execute(
      sql.raw(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE;`),
    )
  }

  console.log('🌱 Seeding base roles...')
  await db.execute(sql`
    INSERT INTO roles (name, label) VALUES
      ('ADMIN', 'Administrador'),
      ('RECEPTIONIST', 'Recepcionista'),
      ('TRAINER', 'Entrenador')
    ON CONFLICT (name) DO NOTHING;
  `)

  console.log('✅ Database cleaned successfully!')
  await pool.end()
  process.exit(0)
}

clean().catch((e) => {
  console.error('❌ Error cleaning database:', e)
  process.exit(1)
})
