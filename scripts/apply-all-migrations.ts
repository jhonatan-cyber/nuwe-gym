import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import pg from 'pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })

// Read the journal to get migration in order
const journal = JSON.parse(readFileSync(resolve(import.meta.dirname, '../drizzle/meta/_journal.json'), 'utf-8'))
const entries = journal.entries as Array<{ idx: number; tag: string }>
entries.sort((a, b) => a.idx - b.idx)

console.log(`Found ${entries.length} migration${entries.length !== 1 ? 's' : ''} to apply\n`)

let applied = 0
for (const entry of entries) {
  const tag = entry.tag
  const sqlFile = resolve(import.meta.dirname, `../drizzle/${tag}.sql`)
  const sql = readFileSync(sqlFile, 'utf-8')
  const statements = sql
    .split('--> statement-breakpoint')
    .map((s) => s.trim())
    .filter(Boolean)

  for (const stmt of statements) {
    try {
      await pool.query(stmt)
    } catch (e: any) {
      // Skip "already exists" errors (safe for re-runs)
      if (
        e.message?.includes('ya existe') ||
        e.message?.includes('already exists') ||
        e.message?.includes('duplicate key')
      ) {
        continue
      }
      throw e
    }
  }

  console.log(`✓ ${tag}`)
  applied++

  // Register migration in drizzle tracking table
  try {
    await pool.query(
      `INSERT INTO __drizzle_migrations (hash) VALUES ($1) ON CONFLICT DO NOTHING`,
      [tag],
    )
  } catch {
    // __drizzle_migrations table might not exist yet on first migration
  }
}

console.log(`\n✅ Applied ${applied}/${entries.length} migration${applied !== 1 ? 's' : ''}`)
await pool.end()
