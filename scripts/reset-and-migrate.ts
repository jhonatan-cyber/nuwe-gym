import pg from 'pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })

async function main() {
  // 1. Register the migration in the drizzle tracking table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS __drizzle_migrations (
      id SERIAL PRIMARY KEY,
      hash TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `)
  await pool.query(
    `INSERT INTO __drizzle_migrations (hash, created_at) VALUES ($1, NOW()) ON CONFLICT DO NOTHING`,
    ['0000_brave_jean_grey'],
  )
  console.log('✔ Migration registered in __drizzle_migrations')
  await pool.end()
}

main().catch(console.error)
