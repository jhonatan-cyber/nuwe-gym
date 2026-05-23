import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import * as schema from './schema/index.ts'

const { Pool } = pg
const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL environment variable is not set')
const pool = new Pool({ connectionString: databaseUrl })
export const db = drizzle(pool, { schema })
