import { config } from 'dotenv'
import { resolve } from 'node:path'

config({ path: resolve(__dirname, '../../.env'), override: true })

if (process.env.DATABASE_URL) {
  try {
    const parsed = new URL(process.env.DATABASE_URL)
    parsed.pathname = '/gym_test'
    process.env.DATABASE_URL = parsed.toString()
  } catch (e) {
    console.error('Error parsing DATABASE_URL for test environment:', e)
  }
}
