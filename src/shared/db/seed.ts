import { config } from 'dotenv'
import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import { roles } from './schema/roles.ts'
import { branches } from './schema/branches.ts'

config({ path: ['.env.local', '.env'] })

async function seed() {
  const { Pool } = pg
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! })
  const db = drizzle(pool)

  console.log('🌱 Seeding database...')

  // Seed base roles
  const existingRoles = await db.select().from(roles).limit(1)
  if (existingRoles.length === 0) {
    await db.insert(roles).values([
      { name: 'ADMIN', label: 'Administrador' },
      { name: 'RECEPTIONIST', label: 'Recepcionista' },
      { name: 'TRAINER', label: 'Entrenador' },
    ])
    console.log('✅ Base roles created')
  } else {
    console.log('ℹ️ Roles already exist')
  }

  // Seed default branch
  const existingBranches = await db.select().from(branches).limit(1)
  if (existingBranches.length === 0) {
    await db.insert(branches).values([
      {
        name: 'Sede Central',
        address: 'Av. Corrientes 1234, CABA',
        phone: '11-4567-8901',
        email: 'central@nuwegym.com',
        openingTime: '06:00',
        closingTime: '23:00',
        isActive: true,
      },
    ])
    console.log('✅ Default branch created')
  } else {
    console.log('ℹ️ Branches already exist')
  }

  console.log('🎉 Seed completed!')
  process.exit(0)
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
