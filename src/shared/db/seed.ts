import { config } from 'dotenv'
import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import { packages } from './schema/packages.ts'
import { productCategories } from './schema/product-categories.ts'
import { settings } from './schema/settings.ts'
import { roles } from './schema/roles.ts'

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

  // Seed packages
  const existingPackages = await db.select().from(packages).limit(1)
  if (existingPackages.length === 0) {
    await db.insert(packages).values([
      {
        name: 'Mensual',
        description: 'Acceso completo por 30 días',
        durationDays: 30,
        price: '15000.00',
        type: 'PACKAGE',
        isActive: true,
      },
      {
        name: 'Trimestral',
        description: 'Acceso completo por 90 días',
        durationDays: 90,
        price: '38000.00',
        type: 'PACKAGE',
        isActive: true,
      },
      {
        name: 'Semestral',
        description: 'Acceso completo por 180 días',
        durationDays: 180,
        price: '68000.00',
        type: 'PACKAGE',
        isActive: true,
      },
      {
        name: 'Anual',
        description: 'Acceso completo por 365 días',
        durationDays: 365,
        price: '120000.00',
        type: 'PACKAGE',
        isActive: true,
      },
    ])
    console.log('✅ Packages created')
  } else {
    console.log('ℹ️ Packages already exist')
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
