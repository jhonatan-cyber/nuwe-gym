import { config } from 'dotenv'

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
import { checkIns } from './schema/check-ins.ts'
import { loyaltyTiers } from './schema/loyalty.ts'

config({ path: ['.env.local', '.env'] })

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
    { name: 'Plan Premium', price: '25000', days: 30, color: '#667eea', img: IMAGES.premium, renewal: 'AUTO' as const, grace: 5, freezes: 2, freezeDays: 14, start: '06:00', end: '23:00', dailyLimit: 2, items: ['Todo lo del plan básico', 'Clases grupales', 'Entrenador personal 2x/mes', 'Acceso zona premium'], benefits: ['scheduled_access', 'parking', 'freeze', 'classes', 'personal_trainer', 'guest_passes'] },
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

  // 6. Members + loyalty tiers
  await db.insert(loyaltyTiers).values([
    { name: 'Bronce', minPoints: 0, color: '#cd7f32', discountPercent: 0, sortOrder: 0 },
    { name: 'Plata', minPoints: 100, color: '#94a3b8', discountPercent: 3, sortOrder: 1 },
    { name: 'Oro', minPoints: 300, color: '#f59e0b', discountPercent: 5, sortOrder: 2 },
    { name: 'Platino', minPoints: 1000, color: '#6366f1', discountPercent: 10, sortOrder: 3 },
  ])

  console.log('\n👥 Creando socios...')
  const firstNames = ['Pedro','Sofía','Martín','Camila','Lucas','Valentina','Mateo','Isabella','Santiago','Mía','Benjamín','Emilia','Thiago','Catalina','Joaquín','Abril','Felipe','Julieta','Nicolás','Renata','Sebastián','Victoria','Tomás','Martina','Samuel']
  const lastNames = ['Gómez','Díaz','Ruiz','Herrera','Morales','Torres','Silva','Castro','Romero','Vargas','López','Fernández','García','Martínez','Rodríguez','Pérez','Giménez','Álvarez','Moreno','Muñoz','Rojas','Ortiz','Ramos','Medina','Acosta']
  const memberIds: string[] = []
  const memberBranches: number[] = []
  const now = new Date()

  for (let i = 0; i < firstNames.length; i++) {
    const name = `${firstNames[i]} ${lastNames[i]}`
    const doc = String(42000000 + i)
    const branch = i % 2
    memberBranches.push(branch)
    const [mem] = await db.insert(members).values({
      fullName: name, documentNumber: doc,
      phone: `11-${String(7000000 + i).padStart(7, '0')}`,
      email: `${firstNames[i].toLowerCase()}.${lastNames[i].toLowerCase()}@email.com`,
      gender: i % 2 === 0 ? 'MALE' : 'FEMALE',
      branchId: branchIds[branch], status: 'ACTIVE',
    }).returning()
    memberIds.push(mem.id)

    // Subscription with package-appropriate duration
    const pkgIdx = i % pkgIds.length
    const pkg = pkgsData[pkgIdx]
    const start = new Date(now)
    start.setDate(start.getDate() - Math.floor(Math.random() * 15) - 5)
    const end = new Date(start)
    end.setDate(end.getDate() + pkg.days)

    // First 20 members active, last 5 expired/canceled
    const subStatus = i < 20 ? 'ACTIVE' : i < 23 ? 'EXPIRED' : 'CANCELED'
    const [sub] = await db.insert(subscriptions).values({
      memberId: mem.id, packageId: pkgIds[pkgIdx],
      startDate: start, endDate: end, status: subStatus,
    }).returning()

    await db.insert(membershipPayments).values({
      memberId: mem.id, subscriptionId: sub.id,
      amount: pkg.price,
      paymentMethod: (['CASH', 'CARD', 'TRANSFER', 'QR'] as const)[i % 4],
      paymentDate: start, createdByUserId: userIds['jhonatanancasi@gmail.com'],
    })
  }
  console.log(`✅ ${firstNames.length} socios + suscripciones + pagos`)

  // 7. Check-ins
  console.log('\n📋 Creando check-ins...')
  const adminId = userIds['jhonatanancasi@gmail.com']
  let checkInCount = 0
  for (let i = 0; i < memberIds.length; i++) {
    if (i >= 20) continue // skip expired/canceled
    const daysBack = Math.floor(Math.random() * 14) + 1 // 1–14 days ago
    const visits = Math.floor(Math.random() * 6) + 2    // 2–7 check-ins each
    for (let v = 0; v < visits; v++) {
      const d = new Date(now)
      d.setDate(d.getDate() - daysBack + v * 2)
      if (d > now) continue
      await db.insert(checkIns).values({
        memberId: memberIds[i], registeredByUserId: adminId,
        checkedInAt: d, resultStatus: 'ALLOWED',
        branchId: branchIds[memberBranches[i]],
      })
      checkInCount++
    }
  }
  console.log(`✅ ${checkInCount} check-ins creados (${memberIds.filter((_, i) => i < 20).length} socios activos)`)
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
