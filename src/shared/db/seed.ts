import { config } from 'dotenv'
config({ path: ['.env.local', '.env'] })

import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import { sql, eq } from 'drizzle-orm'
import { users } from './schema/auth.ts'
import { branches, userBranches } from './schema/branches.ts'
import { roles } from './schema/roles.ts'
import { packages, packageItems, packageAllowedDays, packageBenefits } from './schema/packages.ts'
import { members } from './schema/members.ts'
import { subscriptions } from './schema/subscriptions.ts'
import { membershipPayments } from './schema/membership-payments.ts'
import { trainerProfiles, trainerAssignments, trainerAvailability } from './schema/trainers.ts'
import { productCategories } from './schema/product-categories.ts'
import { products } from './schema/products.ts'
import { productStock } from './schema/product-stock.ts'

const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_URL! })
const db = drizzle(pool)

// ─── SVG helpers ───────────────────────────────────────────────
function svgDataUri(svg: string): string {
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}

function gymImage(gradient: string, icon: string, label: string): string {
  return svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${gradient.split(',')[0]};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${gradient.split(',')[1]};stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="800" height="500" fill="url(#bg)" rx="0"/>
  <text x="400" y="220" font-family="Arial,sans-serif" font-size="80" text-anchor="middle" fill="rgba(255,255,255,0.9)">${icon}</text>
  <text x="400" y="300" font-family="Arial,sans-serif" font-size="32" font-weight="bold" text-anchor="middle" fill="rgba(255,255,255,0.95)">${label}</text>
  <text x="400" y="340" font-family="Arial,sans-serif" font-size="16" text-anchor="middle" fill="rgba(255,255,255,0.6)">NUWE GYM</text>
</svg>`)
}

const IMAGES = {
  basico: gymImage('#1a1a2e,#16213e', '💪', 'Básico'),
  premium: gymImage('#667eea,#764ba2', '⭐', 'Premium'),
  estudiantes: gymImage('#11998e,#38ef7d', '🎓', 'Estudiantes'),
  verano: gymImage('#f093fb,#f5576c', '☀️', 'Verano 2025'),
  elite: gymImage('#0c0c0c,#434343', '🏆', 'Élite'),
}

// ─── Clean ─────────────────────────────────────────────────────
async function clean() {
  console.log('🧹 Limpiando base de datos...')
  const tables = (
    await db.execute(sql`
      SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename != '__drizzle_migrations';
    `)
  ).rows.map((r) => r.tablename as string)

  for (const t of tables) {
    await db.execute(sql.raw(`TRUNCATE TABLE "${t}" RESTART IDENTITY CASCADE`))
  }
  console.log(`  ✅ ${tables.length} tablas limpiadas`)
}

// ─── Seed ──────────────────────────────────────────────────────
async function seed() {
  console.log('🌱 Seeding database...\n')

  // 1. Roles
  await db.insert(roles).values([
    { name: 'ADMIN', label: 'Administrador' },
    { name: 'RECEPTIONIST', label: 'Recepcionista' },
    { name: 'TRAINER', label: 'Entrenador' },
  ])
  console.log('✅ Roles creados')

  // 2. Branches
  const [b1] = await db.insert(branches).values({
    name: 'Sede Central',
    address: 'Av. Corrientes 1234, CABA',
    phone: '11-4567-8901',
    email: 'central@nuwegym.com',
    openingTime: '06:00',
    closingTime: '23:00',
    isActive: true,
  }).returning()

  const [b2] = await db.insert(branches).values({
    name: 'Sede Norte',
    address: 'Av. Cabildo 5678, Belgrano',
    phone: '11-5678-9012',
    email: 'norte@nuwegym.com',
    openingTime: '07:00',
    closingTime: '22:00',
    isActive: true,
  }).returning()
  const branchIds = [b1.id, b2.id]
  console.log('✅ 2 sucursales creadas')

  // 3. Users (admin + staff)
  const { auth } = await import('../lib/auth.ts')
  const header = new Headers()
  const userIds: Record<string, string> = {}

  const staffData = [
    { email: 'jhonatanancasi@gmail.com', name: 'Jhonatan Ancasi', doc: '10571705', role: 'ADMIN', phone: '11-1234-5678' },
    { email: 'recepcion1@nuwegym.com', name: 'María López', doc: '38123456', role: 'RECEPTIONIST', phone: '11-2345-6789' },
    { email: 'recepcion2@nuwegym.com', name: 'Lucía Fernández', doc: '40987654', role: 'RECEPTIONIST', phone: '11-3456-7890' },
    { email: 'trainer1@nuwegym.com', name: 'Carlos García', doc: '35678901', role: 'TRAINER', phone: '11-4567-8901' },
    { email: 'trainer2@nuwegym.com', name: 'Ana Martínez', doc: '37890123', role: 'TRAINER', phone: '11-5678-9012' },
    { email: 'trainer3@nuwegym.com', name: 'Diego Rodríguez', doc: '39012345', role: 'TRAINER', phone: '11-6789-0123' },
  ]

  for (const s of staffData) {
    const result = await auth.api.signUpEmail({
      headers: header,
      body: { email: s.email, password: s.doc, name: s.name },
    })
    await db.update(users).set({
      role: s.role,
      emailVerified: true,
      documentNumber: s.doc,
      phone: s.phone,
    }).where(eq(users.id, result.user.id))
    userIds[s.email] = result.user.id
  }
  console.log(`✅ ${staffData.length} usuarios creados`)

  // Assign branches
  for (const uid of Object.values(userIds)) {
    await db.insert(userBranches).values([
      { userId: uid, branchId: branchIds[0], isDefault: true },
      { userId: uid, branchId: branchIds[1], isDefault: false },
    ])
  }
  console.log('✅ Branches asignadas a todos los usuarios')

  // 4. Packages
  console.log('\n📦 Creando paquetes...')
  const pkgsData = [
    { name: 'Plan Básico', price: '15000', days: 30, color: '#1a1a2e', img: IMAGES.basico, renewal: 'MANUAL' as const, grace: 3, freezes: 1, freezeDays: 7, start: '06:00', end: '22:00', dailyLimit: 1, items: ['Acceso a sala de musculación', 'Acceso a sala de cardio', 'Estacionamiento incluido'], benefits: ['scheduled_access', 'parking', 'freeze'] },
    { name: 'Plan Premium', price: '25000', days: 30, color: '#667eea', img: IMAGES.premium, renewal: 'AUTO' as const, grace: 5, freezes: 2, freezeDays: 14, start: '06:00', end: '23:00', dailyLimit: 2, items: ['Todo lo del plan básico', 'Clases grupales', 'Entrenador personal 2x/mes', 'Acceso zona premium'], benefits: ['scheduled_access', 'parking', 'freeze', 'classes', 'personal_trainer'] },
    { name: 'Plan Estudiantes', price: '10000', days: 30, color: '#11998e', img: IMAGES.estudiantes, renewal: 'MANUAL' as const, grace: 2, freezes: 1, freezeDays: 5, start: '08:00', end: '22:00', dailyLimit: 1, items: ['Acceso completo al gimnasio', 'Descuento especial'], benefits: ['scheduled_access', 'discount'] },
    { name: 'Verano 2025', price: '35000', days: 60, color: '#f093fb', img: IMAGES.verano, renewal: 'MANUAL' as const, grace: 7, freezes: 3, freezeDays: 10, start: '06:00', end: '23:00', dailyLimit: 3, items: ['Acceso ilimitado', 'Todas las clases', 'Pileta climatizada'], benefits: ['unlimited_access', 'classes', 'pool'] },
    { name: 'Plan Élite', price: '40000', days: 30, color: '#0c0c0c', img: IMAGES.elite, renewal: 'AUTO' as const, grace: 10, freezes: 5, freezeDays: 20, start: '00:00', end: '23:59', dailyLimit: 5, items: ['Acceso 24/7', 'Entrenador personal ilimitado', 'Todas las clases', 'Suplementación incluida'], benefits: ['unlimited_access', 'personal_trainer', 'classes', 'supplements'] },
  ]

  const pkgIds: string[] = []
  for (const p of pkgsData) {
    const [pkg] = await db.insert(packages).values({
      name: p.name, description: `Descripción de ${p.name}`, imageBase64: p.img,
      price: p.price, durationDays: p.days, type: 'PACKAGE', renewalType: p.renewal,
      graceDays: p.grace, maxFreezes: p.freezes, maxFreezeDays: p.freezeDays,
      allowedStartTime: p.start, allowedEndTime: p.end, dailyAccessLimit: p.dailyLimit,
      color: p.color, isActive: true,
    }).returning()
    pkgIds.push(pkg.id)

    await db.insert(packageItems).values(p.items.map((desc, i) => ({ packageId: pkg.id, description: desc, sortOrder: i })))
    for (let day = 1; day <= 6; day++) {
      await db.insert(packageAllowedDays).values({ packageId: pkg.id, dayOfWeek: day, startTime: p.start, endTime: p.end })
    }
    await db.insert(packageBenefits).values(p.benefits.map((b) => ({ packageId: pkg.id, benefitKey: b, enabled: true })))
  }
  console.log(`✅ ${pkgsData.length} paquetes creados`)

  // 5. Product categories & products
  console.log('\n🛒 Creando productos...')
  const [catBebidas] = await db.insert(productCategories).values({ name: 'Bebidas', description: 'Bebidas e isotónicos', isActive: true }).returning()
  const [catSuplementos] = await db.insert(productCategories).values({ name: 'Suplementos', description: 'Proteínas y creatinas', isActive: true }).returning()
  const [catAccesorios] = await db.insert(productCategories).values({ name: 'Accesorios', description: 'Guantes, rodilleras, etc.', isActive: true }).returning()
  const [catMerchandising] = await db.insert(productCategories).values({ name: 'Merchandising', description: 'Remeras y gorras NUWE', isActive: true }).returning()

  const prodsData = [
    { sku: 'BEB-001', name: 'Agua mineral 500ml', cat: catBebidas.id, purchase: '80', sale: '150' },
    { sku: 'BEB-002', name: 'Gatorade 500ml', cat: catBebidas.id, purchase: '150', sale: '300' },
    { sku: 'BEB-003', name: 'Agua saborizada 500ml', cat: catBebidas.id, purchase: '100', sale: '200' },
    { sku: 'SUP-001', name: 'Whey Protein 1kg', cat: catSuplementos.id, purchase: '8000', sale: '12000' },
    { sku: 'SUP-002', name: 'Creatina 500g', cat: catSuplementos.id, purchase: '5000', sale: '8000' },
    { sku: 'SUP-003', name: 'BCAA 300g', cat: catSuplementos.id, purchase: '4000', sale: '6500' },
    { sku: 'ACC-001', name: 'Guantes de gimnasio', cat: catAccesorios.id, purchase: '1500', sale: '3500' },
    { sku: 'ACC-002', name: 'Rodillera deportiva', cat: catAccesorios.id, purchase: '2000', sale: '4500' },
    { sku: 'MER-001', name: 'Remera NUWE Negro', cat: catMerchandising.id, purchase: '2500', sale: '5000' },
    { sku: 'MER-002', name: 'Gorra NUWE', cat: catMerchandising.id, purchase: '1500', sale: '3500' },
  ]

  const prodIds: string[] = []
  for (const p of prodsData) {
    const [prod] = await db.insert(products).values({
      sku: p.sku, name: p.name, categoryId: p.cat,
      purchasePrice: p.purchase, salePrice: p.sale, isActive: true,
    }).returning()
    prodIds.push(prod.id)
  }

  for (const pid of prodIds) {
    for (const bid of branchIds) {
      await db.insert(productStock).values({
        productId: pid, branchId: bid,
        stockCurrent: Math.floor(Math.random() * 50) + 10, stockMinimum: 5,
      })
    }
  }
  console.log(`✅ 4 categorías, ${prodsData.length} productos, stock por sucursal`)

  // 6. Members
  console.log('\n👥 Creando socios...')
  const membersData = [
    { name: 'Pedro Gómez', doc: '42111222', phone: '11-7777-1111', email: 'pedro@email.com', gender: 'MALE', branch: 0 },
    { name: 'Sofía Díaz', doc: '43222333', phone: '11-7777-2222', email: 'sofia@email.com', gender: 'FEMALE', branch: 0 },
    { name: 'Martín Ruiz', doc: '44333444', phone: '11-7777-3333', email: 'martin@email.com', gender: 'MALE', branch: 1 },
    { name: 'Camila Herrera', doc: '45444555', phone: '11-7777-4444', email: 'camila@email.com', gender: 'FEMALE', branch: 0 },
    { name: 'Lucas Morales', doc: '46555666', phone: '11-7777-5555', email: 'lucas@email.com', gender: 'MALE', branch: 1 },
    { name: 'Valentina Torres', doc: '47666777', phone: '11-7777-6666', email: 'valentina@email.com', gender: 'FEMALE', branch: 0 },
    { name: 'Mateo Silva', doc: '48777888', phone: '11-7777-7777', email: 'mateo@email.com', gender: 'MALE', branch: 1 },
    { name: 'Isabella Castro', doc: '49888999', phone: '11-7777-8888', email: 'isabella@email.com', gender: 'FEMALE', branch: 0 },
    { name: 'Santiago Romero', doc: '50999000', phone: '11-7777-9999', email: 'santiago@email.com', gender: 'MALE', branch: 1 },
    { name: 'Mía Vargas', doc: '51000111', phone: '11-7777-0000', email: 'mia@email.com', gender: 'FEMALE', branch: 0 },
  ]

  const memberIds: string[] = []
  const now = new Date()
  for (let i = 0; i < membersData.length; i++) {
    const m = membersData[i]
    const [mem] = await db.insert(members).values({
      fullName: m.name, documentNumber: m.doc, phone: m.phone, email: m.email,
      gender: m.gender, branchId: branchIds[m.branch], status: 'ACTIVE',
    }).returning()
    memberIds.push(mem.id)

    // Subscription
    const pkgId = pkgIds[i % pkgIds.length]
    const start = new Date(now)
    start.setDate(start.getDate() - Math.floor(Math.random() * 20))
    const end = new Date(start)
    end.setDate(end.getDate() + 30)

    const [sub] = await db.insert(subscriptions).values({
      memberId: mem.id, packageId: pkgId, startDate: start, endDate: end,
      status: i < 8 ? 'ACTIVE' : 'EXPIRED',
    }).returning()

    // Payment
    await db.insert(membershipPayments).values({
      memberId: mem.id, subscriptionId: sub.id,
      amount: pkgsData[i % pkgsData.length].price,
      paymentMethod: (['CASH', 'CARD', 'TRANSFER', 'QR'] as const)[i % 4],
      paymentDate: start, createdByUserId: userIds['jhonatanancasi@gmail.com'],
    })
  }
  console.log(`✅ ${membersData.length} socios + suscripciones + pagos`)

  // 7. Trainers
  console.log('\n🏋️ Creando trainers...')
  const trainerUserIds = ['trainer1@nuwegym.com', 'trainer2@nuwegym.com', 'trainer3@nuwegym.com']
  const specialties = ['Fuerza y Condicionamiento', 'CrossFit', 'Yoga y Pilates']
  const trainerIds: string[] = []

  for (let i = 0; i < trainerUserIds.length; i++) {
    const [tp] = await db.insert(trainerProfiles).values({
      userId: userIds[trainerUserIds[i]],
      branchId: branchIds[i % branchIds.length],
      specialty: specialties[i],
      bio: `Entrenador especializado en ${specialties[i]}`,
      commissionRate: '15.00', isActive: true,
    }).returning()
    trainerIds.push(tp.id)

    for (let day = 1; day <= 5; day++) {
      await db.insert(trainerAvailability).values({ trainerId: tp.id, dayOfWeek: day, startTime: '08:00', endTime: '17:00' })
    }
  }

  for (let i = 0; i < Math.min(memberIds.length, trainerIds.length * 2); i++) {
    await db.insert(trainerAssignments).values({
      trainerId: trainerIds[i % trainerIds.length], memberId: memberIds[i], isActive: true,
    })
  }
  console.log(`✅ ${trainerIds.length} trainers + disponibilidad + asignaciones`)

  console.log('\n🎉 Seed completado!')
  console.log('\n📋 Credenciales:')
  console.log('   Admin:     jhonatanancasi@gmail.com / 10571705')
  console.log('   Recepción: recepcion1@nuwegym.com / 38123456')
  console.log('   Recepción: recepcion2@nuwegym.com / 40987654')
  console.log('   Trainer:   trainer1@nuwegym.com / 35678901')
  console.log('   Trainer:   trainer2@nuwegym.com / 37890123')
  console.log('   Trainer:   trainer3@nuwegym.com / 39012345')

  await pool.end()
  process.exit(0)
}

// ─── Main ──────────────────────────────────────────────────────
async function main() {
  const arg = process.argv[2]

  if (arg === '--clean') {
    await clean()
    await seed()
  } else {
    // Check if DB has data, if so warn
    const existing = await db.select().from(users).limit(1)
    if (existing.length > 0) {
      console.log('⚠️  Ya hay usuarios en la base.')
      console.log('   Usá `bun run db:seed -- --clean` para limpiar y re-seedear.\n')
      await pool.end()
      process.exit(0)
    }
    await seed()
  }
}

main().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
