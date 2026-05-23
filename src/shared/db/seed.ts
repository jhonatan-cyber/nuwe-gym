import { config } from 'dotenv'
import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import { eq } from 'drizzle-orm'
import { users, accounts } from './schema/auth.ts'
import { membershipPlans } from './schema/membership-plans.ts'
import { productCategories } from './schema/product-categories.ts'
import { settings } from './schema/settings.ts'
import { hashPassword } from '@better-auth/utils/password'

config({ path: ['.env.local', '.env'] })

async function seed() {
  const { Pool } = pg
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! })
  const db = drizzle(pool)

  console.log('🌱 Seeding database...')

  const existingAdmin = await db
    .select()
    .from(users)
    .where(eq(users.email, 'admin@gym.local'))
    .limit(1)

  const passwordHash = await hashPassword('Admin123*')

  if (existingAdmin.length > 0) {
    const admin = existingAdmin[0]
    // Update existing admin + account instead of delete+reinsert (preserves FK refs)
    await db.update(users).set({
      name: 'Administrador',
      emailVerified: true,
      role: 'ADMIN',
      updatedAt: new Date(),
    }).where(eq(users.id, admin.id))

    const existingAccount = await db.select().from(accounts).where(eq(accounts.userId, admin.id)).limit(1)
    if (existingAccount.length > 0) {
      await db.update(accounts).set({ password: passwordHash, updatedAt: new Date() }).where(eq(accounts.userId, admin.id))
    } else {
      await db.insert(accounts).values({
        id: crypto.randomUUID(),
        accountId: admin.id,
        providerId: 'credential',
        userId: admin.id,
        password: passwordHash,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }

    console.log('✅ Admin user updated: admin@gym.local / Admin123*')
  } else {
    const adminId = crypto.randomUUID()

  await db.insert(users).values({
    id: adminId,
    name: 'Administrador',
    email: 'admin@gym.local',
    emailVerified: true,
    role: 'ADMIN',
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  await db.insert(accounts).values({
    id: crypto.randomUUID(),
    accountId: adminId,
    providerId: 'credential',
    userId: adminId,
    password: passwordHash,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

    console.log('✅ Admin user created: admin@gym.local / Admin123*')
  }

  // Seed membership plans
  const existingPlans = await db.select().from(membershipPlans).limit(1)
  if (existingPlans.length === 0) {
    await db.insert(membershipPlans).values([
      {
        name: 'Mensual',
        description: 'Acceso completo por 30 días',
        durationDays: 30,
        price: '15000.00',
      },
      {
        name: 'Trimestral',
        description: 'Acceso completo por 90 días',
        durationDays: 90,
        price: '38000.00',
      },
      {
        name: 'Semestral',
        description: 'Acceso completo por 180 días',
        durationDays: 180,
        price: '68000.00',
      },
      {
        name: 'Anual',
        description: 'Acceso completo por 365 días',
        durationDays: 365,
        price: '120000.00',
      },
    ])
    console.log('✅ Membership plans created')
  } else {
    console.log('ℹ️ Membership plans already exist')
  }

  // Seed product categories
  const existingCategories = await db.select().from(productCategories).limit(1)
  if (existingCategories.length === 0) {
    await db.insert(productCategories).values([
      { name: 'Proteínas', description: 'Suplementos proteicos' },
      { name: 'Creatinas', description: 'Suplementos de creatina' },
      { name: 'Vitaminas', description: 'Vitaminas y minerales' },
      { name: 'Bebidas', description: 'Bebidas deportivas e hidratación' },
      { name: 'Snacks Fitness', description: 'Barritas y snacks saludables' },
      { name: 'Accesorios', description: 'Accesorios deportivos' },
    ])
    console.log('✅ Product categories created')
  } else {
    console.log('ℹ️ Product categories already exist')
  }

  // Seed default settings
  const existingSettings = await db.select().from(settings).limit(1)
  if (existingSettings.length === 0) {
    await db.insert(settings).values({
      gymName: 'Mi Gimnasio',
      gymAddress: '',
      gymPhone: '',
      gymEmail: '',
      logoBase64: '',
      taxRate: '0.00',
      currencySymbol: '$',
      currencyCode: 'ARS',
      decimalPlaces: 2,
      lowStockThreshold: 5,
      membershipReminderDays: 7,
      checkInWindowMinutes: 60,
      enableAutoRenew: false,
      openingTime: '08:00',
      closingTime: '22:00',
      mondayOpen: true,
      tuesdayOpen: true,
      wednesdayOpen: true,
      thursdayOpen: true,
      fridayOpen: true,
      saturdayOpen: false,
      sundayOpen: false,
    })
    console.log('✅ Default settings created')
  } else {
    console.log('ℹ️ Settings already exist')
  }

  console.log('🎉 Seed completed!')
  process.exit(0)
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
