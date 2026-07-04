import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import * as schema from './schema/index.ts'

// ponytail: import.meta.env.SSR is a Vite compile-time constant.
// On client builds (SSR=false), this if-block is completely treeshaken out.
// 'pg' (which uses Buffer) is never statically imported → no Buffer error in browser.
// The db variable is only accessed inside createServerFn handlers, which are
// wrapped as RPC calls on the client — db is NEVER dereferenced in the browser.
let _db!: NodePgDatabase<typeof schema>

if (typeof window === 'undefined') {
  const { default: pg } = await import('pg')
  const { drizzle } = await import('drizzle-orm/node-postgres')
  const { Pool } = pg
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl)
    throw new Error('DATABASE_URL environment variable is not set')
  _db = drizzle(new Pool({ connectionString: databaseUrl }), { schema })
}

export { _db as db }
