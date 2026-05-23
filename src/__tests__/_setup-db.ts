import { config } from 'dotenv'
import pg from 'pg'
import { writeFileSync } from 'fs'
import { resolve } from 'path'

config({ path: ['.env.local', '.env'] })

const url = process.env.DATABASE_URL
if (!url) {
  console.error('NO DATABASE_URL found')
  process.exit(1)
}

const parsed = new URL(url)
const testUrl = `${parsed.protocol}//${parsed.username}:${parsed.password}@${parsed.hostname}:${parsed.port}/gym_test`
const envPath = resolve(import.meta.dirname, '../../.env.test')

const { Pool } = pg
const pool = new Pool({ connectionString: url })

try {
  await pool.query('DROP DATABASE IF EXISTS gym_test')
  console.log('Dropped gym_test')
  await pool.query('CREATE DATABASE gym_test')
  console.log('Created gym_test')
  
  writeFileSync(envPath, `DATABASE_URL=${testUrl}\n`, 'utf-8')
  console.log('Wrote .env.test')
  console.log('DB URL:', testUrl.replace(/\/\/.*@/, '//***:***@'))
} catch (e) {
  console.error('Error:', (e as Error).message)
  process.exit(1)
} finally {
  await pool.end()
}
