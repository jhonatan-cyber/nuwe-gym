import { config } from 'dotenv'

import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import { sql, eq } from 'drizzle-orm'
import { users } from './schema/auth.ts'
import { branches, userBranches } from './schema/branches.ts'
import { roles } from './schema/roles.ts'
import { permissions, rolePermissions } from './schema/permissions.ts'
import { departments } from './schema/departments.ts'
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
import { employees } from './schema/employees.ts'
import { employeeContracts } from './schema/employee-contracts.ts'
import { employeeSchedules } from './schema/employee-schedules.ts'
import { employeeAttendance } from './schema/employee-attendance.ts'
import { employeeBonuses } from './schema/employee-bonuses.ts'
import { employeeVacations } from './schema/employee-vacations.ts'
import { employeeDocuments } from './schema/employee-documents.ts'
import { employeePerformance } from './schema/employee-performance.ts'

config({ path: ['.env'] })

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

  // 2. Permissions
  const allPermissions = [
    { name: 'members:read', label: 'Ver miembros', module: 'members' },
    { name: 'members:write', label: 'Crear/editar miembros', module: 'members' },
    { name: 'plans:read', label: 'Ver planes', module: 'plans' },
    { name: 'plans:write', label: 'Crear/editar planes', module: 'plans' },
    { name: 'subscriptions:read', label: 'Ver suscripciones', module: 'subscriptions' },
    { name: 'subscriptions:write', label: 'Crear/editar suscripciones', module: 'subscriptions' },
    { name: 'payments:read', label: 'Ver pagos', module: 'payments' },
    { name: 'payments:write', label: 'Registrar pagos', module: 'payments' },
    { name: 'checkins:read', label: 'Ver check-ins', module: 'checkins' },
    { name: 'checkins:write', label: 'Registrar check-ins', module: 'checkins' },
    { name: 'classes:read', label: 'Ver clases', module: 'classes' },
    { name: 'classes:write', label: 'Crear/editar clases', module: 'classes' },
    { name: 'products:read', label: 'Ver productos', module: 'products' },
    { name: 'products:write', label: 'Crear/editar productos', module: 'products' },
    { name: 'categories:read', label: 'Ver categorías', module: 'categories' },
    { name: 'categories:write', label: 'Crear/editar categorías', module: 'categories' },
    { name: 'suppliers:read', label: 'Ver proveedores', module: 'suppliers' },
    { name: 'suppliers:write', label: 'Crear/editar proveedores', module: 'suppliers' },
    { name: 'purchases:read', label: 'Ver compras', module: 'purchases' },
    { name: 'purchases:write', label: 'Registrar compras', module: 'purchases' },
    { name: 'sales:read', label: 'Ver ventas', module: 'sales' },
    { name: 'sales:write', label: 'Registrar ventas', module: 'sales' },
    { name: 'pos:use', label: 'Usar POS', module: 'pos' },
    { name: 'inventory:read', label: 'Ver inventario', module: 'inventory' },
    { name: 'inventory:write', label: 'Editar inventario', module: 'inventory' },
    { name: 'cash:read', label: 'Ver caja', module: 'cash' },
    { name: 'cash:write', label: 'Operar caja', module: 'cash' },
    { name: 'dashboard:read', label: 'Ver dashboard', module: 'dashboard' },
    { name: 'users:read', label: 'Ver usuarios', module: 'users' },
    { name: 'users:write', label: 'Crear/editar usuarios', module: 'users' },
    { name: 'reports:read', label: 'Ver reportes', module: 'reports' },
    { name: 'settings:read', label: 'Ver configuración', module: 'settings' },
    { name: 'settings:write', label: 'Editar configuración', module: 'settings' },
    { name: 'renewals:read', label: 'Ver renovaciones', module: 'renewals' },
    { name: 'renewals:write', label: 'Gestionar renovaciones', module: 'renewals' },
    { name: 'export:read', label: 'Exportar datos', module: 'export' },
    { name: 'trainers:read', label: 'Ver entrenadores', module: 'trainers' },
    { name: 'trainers:write', label: 'Crear/editar entrenadores', module: 'trainers' },
    { name: 'notifications:read', label: 'Ver notificaciones', module: 'notifications' },
    { name: 'notifications:write', label: 'Enviar notificaciones', module: 'notifications' },
    { name: 'membership-freezes:read', label: 'Ver congelamientos', module: 'membership-freezes' },
    { name: 'membership-freezes:write', label: 'Gestionar congelamientos', module: 'membership-freezes' },
    { name: 'audit:read', label: 'Ver auditoría', module: 'audit' },
    { name: 'audit:export', label: 'Exportar auditoría', module: 'audit' },
    { name: 'branches:read', label: 'Ver sucursales', module: 'branches' },
    { name: 'branches:write', label: 'Crear/editar sucursales', module: 'branches' },
    { name: 'backup:read', label: 'Ver backups', module: 'backup' },
    { name: 'backup:write', label: 'Crear backups', module: 'backup' },
    { name: 'nutrition:read', label: 'Ver nutrición', module: 'nutrition' },
    { name: 'nutrition:write', label: 'Crear/editar planes nutricionales', module: 'nutrition' },
    { name: 'guest-passes:read', label: 'Ver pases de cortesía', module: 'guest-passes' },
    { name: 'guest-passes:write', label: 'Crear pases de cortesía', module: 'guest-passes' },
    { name: 'employees:read', label: 'Ver empleados', module: 'employees' },
    { name: 'employees:write', label: 'Crear/editar empleados', module: 'employees' },
  ]
  await db.insert(permissions).values(allPermissions)
  console.log(`✅ ${allPermissions.length} permisos creados`)

  // 3. Role ↔ Permissions
  const rolePerms = [
    // ADMIN gets everything
    ...allPermissions.map((p) => ({ roleName: 'ADMIN' as const, permissionName: p.name })),
    // RECEPTIONIST
    ...([
      'members:read', 'members:write', 'plans:read', 'subscriptions:read', 'subscriptions:write',
      'payments:read', 'payments:write', 'checkins:read', 'checkins:write',
      'classes:read', 'classes:write', 'products:read', 'sales:read', 'sales:write',
      'pos:use', 'cash:read', 'cash:write', 'dashboard:read', 'reports:read',
      'settings:read', 'renewals:read', 'renewals:write', 'notifications:read',
      'trainers:read', 'membership-freezes:read', 'membership-freezes:write',
      'guest-passes:read', 'guest-passes:write',
    ] as const).map((name) => ({ roleName: 'RECEPTIONIST' as const, permissionName: name })),
    // TRAINER
    ...([
      'members:read', 'plans:read', 'subscriptions:read', 'classes:read',
      'checkins:read', 'dashboard:read', 'notifications:read', 'trainers:read',
      'nutrition:read', 'nutrition:write',
    ] as const).map((name) => ({ roleName: 'TRAINER' as const, permissionName: name })),
  ]
  await db.insert(rolePermissions).values(rolePerms)
  console.log('✅ Role ↔ Permissions asignados')

  // 4. Departments
  const [deptEntrenamiento, deptRecepcion, deptAdmin, deptNutricion] = await db.insert(departments).values([
    { name: 'Entrenamiento', description: 'Personal de entrenamiento y coaching' },
    { name: 'Recepción', description: 'Atención al cliente y administración general' },
    { name: 'Administración', description: 'Dirección y gestión del gym' },
    { name: 'Nutrición', description: 'Planes alimentarios y asesoría nutricional' },
  ]).returning()
  console.log('✅ 4 departamentos creados')

  // 5. Branches
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

  // ─── Employees ────────────────────────────────────────────────
  console.log('\n👔 Creando empleados...')

  const employeeData = [
    { userId: 'jhonatanancasi@gmail.com', name: 'Jhonatan Ancasi', doc: '10571705', position: 'Gerente General', roleId: 'ADMIN' as const, deptId: deptAdmin.id, phone: '11-1234-5678', email: 'jhonatanancasi@gmail.com', salary: '250000' },
    { userId: 'recepcion1@nuwegym.com', name: 'María López', doc: '38123456', position: 'Recepcionista', roleId: 'RECEPTIONIST' as const, deptId: deptRecepcion.id, phone: '11-2345-6789', email: 'recepcion1@nuwegym.com', salary: '85000' },
    { userId: 'recepcion2@nuwegym.com', name: 'Lucía Fernández', doc: '40987654', position: 'Recepcionista', roleId: 'RECEPTIONIST' as const, deptId: deptRecepcion.id, phone: '11-3456-7890', email: 'recepcion2@nuwegym.com', salary: '85000' },
    { userId: 'trainer1@nuwegym.com', name: 'Carlos García', doc: '35678901', position: 'Entrenador Principal', roleId: 'TRAINER' as const, deptId: deptEntrenamiento.id, phone: '11-4567-8901', email: 'trainer1@nuwegym.com', salary: '120000' },
    { userId: 'trainer2@nuwegym.com', name: 'Ana Martínez', doc: '37890123', position: 'Entrenadora', roleId: 'TRAINER' as const, deptId: deptEntrenamiento.id, phone: '11-5678-9012', email: 'trainer2@nuwegym.com', salary: '100000' },
    { userId: 'trainer3@nuwegym.com', name: 'Diego Rodríguez', doc: '39012345', position: 'Entrenador', roleId: 'TRAINER' as const, deptId: deptEntrenamiento.id, phone: '11-6789-0123', email: 'trainer3@nuwegym.com', salary: '100000' },
    { userId: null, name: 'Roberto Sánchez', doc: '27123456', position: 'Seguridad', roleId: null, deptId: deptAdmin.id, phone: '11-7890-1234', email: 'seguridad@nuwegym.com', salary: '70000' },
    { userId: null, name: 'Laura Torres', doc: '28234567', position: 'Personal de Limpieza', roleId: null, deptId: deptAdmin.id, phone: '11-8901-2345', email: 'limpieza@nuwegym.com', salary: '65000' },
    { userId: null, name: 'Pablo Ramírez', doc: '29345678', position: 'Contador', roleId: 'ADMIN' as const, deptId: deptAdmin.id, phone: '11-9012-3456', email: 'contador@nuwegym.com', salary: '130000' },
    { userId: null, name: 'Carmen Vargas', doc: '30456789', position: 'Asistente de Gerencia', roleId: null, deptId: deptAdmin.id, phone: '11-0123-4567', email: 'asistencia@nuwegym.com', salary: '90000' },
    { userId: null, name: 'Facundo Herrera', doc: '31234567', position: 'Entrenador de Boxeo', roleId: 'TRAINER' as const, deptId: deptEntrenamiento.id, phone: '11-1234-9988', email: 'boxeo@nuwegym.com', salary: '95000' },
    { userId: null, name: 'Estela Domínguez', doc: '32345678', position: 'Nutricionista', roleId: 'TRAINER' as const, deptId: deptNutricion.id, phone: '11-1234-9977', email: 'nutricion@nuwegym.com', salary: '110000' },
    { userId: null, name: 'Javier Peralta', doc: '33456789', position: 'Encargado de Mantenimiento', roleId: null, deptId: deptAdmin.id, phone: '11-1234-9966', email: 'mantenimiento@nuwegym.com', salary: '60000' },
  ]

  const employeeIds: string[] = []

  for (let i = 0; i < employeeData.length; i++) {
    const e = employeeData[i]
    const hireDate = new Date(now)
    hireDate.setFullYear(hireDate.getFullYear() - Math.floor(Math.random() * 3) - 1)
    const branch = i % 2

    const [emp] = await db.insert(employees).values({
      userId: e.userId ? userIds[e.userId] : null,
      branchId: branchIds[branch],
      employeeCode: `EMP-${String(i + 1).padStart(3, '0')}`,
      fullName: e.name,
      email: e.email,
      phone: e.phone,
      documentNumber: e.doc,
      position: e.position,
      roleId: e.roleId,
      departmentId: e.deptId,
      status: 'ACTIVE',
      hireDate,
      baseSalary: e.salary,
      paymentFrequency: 'MONTHLY',
      bankName: ['Banco Nación', 'Galicia', 'Santander', 'BBVA'][branch],
      bankAccountNumber: `000-${String(Math.floor(Math.random() * 99999999)).padStart(8, '0')}`,
      emergencyContactName: ['Sra. García', 'Sr. Pérez', 'Sra. Martínez'][Math.floor(Math.random() * 3)],
      emergencyContactPhone: `11-${String(Math.floor(Math.random() * 9000000) + 1000000)}`,
      emergencyContactRelation: 'Familiar',
    }).returning()
    employeeIds.push(emp.id)
  }
  console.log(`✅ ${employeeData.length} empleados creados`)

  // ─── Employee Contracts ──────────────────────────────────────
  console.log('\n📄 Creando contratos...')
  for (let i = 0; i < employeeIds.length; i++) {
    const today = new Date()
    const start = new Date(today)
    start.setFullYear(start.getFullYear() - Math.floor(Math.random() * 3) - 1)
    const end = new Date(start)
    end.setFullYear(end.getFullYear() + 2)

    await db.insert(employeeContracts).values({
      employeeId: employeeIds[i],
      contractType: i < 7 ? 'INDEFINITE' : 'TEMPORARY',
      startDate: start,
      endDate: i < 7 ? null : end,
      position: employeeData[i].position,
      salary: employeeData[i].salary,
      workingHours: 'Lun-Vie 09:00-18:00',
      benefits: i < 3 ? 'OSDE 310, Obra Social' : 'Obra Social',
      terms: 'Contrato estándar según convenio colectivo',
      isActive: true,
      signedByEmployee: true,
      signedByEmployer: true,
    })
  }
  console.log(`✅ ${employeeIds.length} contratos creados`)

  // ─── Employee Schedules ──────────────────────────────────────
  console.log('\n📅 Creando horarios...')
  for (let i = 0; i < employeeIds.length; i++) {
    const isReception = employeeData[i].position.includes('Recepcion')
    for (let day = 1; day <= 6; day++) {
      await db.insert(employeeSchedules).values({
        employeeId: employeeIds[i],
        dayOfWeek: day,
        startTime: isReception ? '07:00' : '09:00',
        endTime: isReception ? '15:00' : '18:00',
        scheduleType: day <= 5 ? 'REGULAR' : 'WEEKEND',
      })
    }
  }
  console.log(`✅ Horarios creados para ${employeeIds.length} empleados`)

  // ─── Employee Attendance ──────────────────────────────────────
  console.log('\n⏰ Creando asistencias...')
  let attendanceCount = 0
  for (const eid of employeeIds) {
    for (let dayOffset = 14; dayOffset >= 0 && attendanceCount < 80; dayOffset--) {
      const d = new Date(now)
      d.setDate(d.getDate() - dayOffset)
      if (d.getDay() === 0) continue // skip sundays

      const rand = Math.random()
      if (rand < 0.7) {
        await db.insert(employeeAttendance).values({
          employeeId: eid, date: d,
          clockIn: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 9, 0),
          clockOut: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 18, 0),
          status: 'PRESENT',
        })
      } else if (rand < 0.85) {
        await db.insert(employeeAttendance).values({
          employeeId: eid, date: d,
          clockIn: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 9, Math.floor(Math.random() * 30) + 5),
          clockOut: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 18, 0),
          status: 'LATE',
        })
      } else {
        await db.insert(employeeAttendance).values({
          employeeId: eid, date: d,
          clockIn: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 9, 0),
          status: 'ABSENT',
          notes: 'Ausente sin justificar',
        })
      }
      attendanceCount++
    }
  }
  console.log(`✅ ${attendanceCount} registros de asistencia`)

  // ─── Employee Bonuses ──────────────────────────────────────────
  console.log('\n💰 Creando bonificaciones...')
  const bonusReasons = [
    { type: 'PERFORMANCE', reason: 'Superación de metas mensuales' },
    { type: 'PUNCTUALITY', reason: 'Puntualidad perfecta del mes' },
    { type: 'EXTRA_HOUR', reason: 'Horas extra durante semana de inventario' },
    { type: 'HOLIDAY', reason: 'Trabajo en feriado nacional' },
    { type: 'OTHER', reason: 'Desempeño destacado en atención al cliente' },
  ]
  let bonusCount = 0
  for (let i = 0; i < employeeIds.length; i += 2) {
    const b = bonusReasons[bonusCount % bonusReasons.length]
    const bonusDate = new Date(now)
    bonusDate.setMonth(bonusDate.getMonth() - Math.floor(Math.random() * 3))
    await db.insert(employeeBonuses).values({
      employeeId: employeeIds[i],
      amount: String((Math.floor(Math.random() * 5) + 1) * 1000),
      reason: b.reason,
      type: b.type,
      date: bonusDate,
      status: bonusCount < 3 ? 'APPROVED' : 'PENDING',
    })
    bonusCount++
  }
  console.log(`✅ ${bonusCount} bonificaciones creadas`)

  // ─── Employee Vacations ──────────────────────────────────────
  console.log('\n🏖️ Creando solicitudes de vacaciones...')
  const vacStatuses = ['APPROVED', 'PENDING', 'APPROVED', 'REJECTED']
  let vacationCount = 0
  for (let i = 0; i < employeeIds.length; i += 3) {
    const startDate = new Date(2026, (vacationCount * 2) % 12, 1)
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 7 + (vacationCount % 3) * 7)
    const st = vacStatuses[vacationCount % vacStatuses.length]

    await db.insert(employeeVacations).values({
      employeeId: employeeIds[i],
      startDate, endDate,
      daysCount: Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
      year: 2026,
      reason: 'Vacaciones anuales solicitadas',
      status: st,
      approvedBy: st !== 'PENDING' ? adminId : null,
      approvedAt: st !== 'PENDING' ? new Date() : null,
    })
    vacationCount++
  }
  console.log(`✅ ${vacationCount} solicitudes de vacaciones`)

  // ─── Employee Performance ──────────────────────────────────────
  console.log('\n⭐ Creando evaluaciones de desempeño...')
  const perfComments = [
    { strengths: 'Excelente atención al cliente y resolución de conflictos', improvements: '' },
    { strengths: 'Trabajo en equipo y proactividad', improvements: 'Mejorar puntualidad en llegadas' },
    { strengths: 'Alta productividad y compromiso', improvements: '' },
    { strengths: 'Responsabilidad y cumplimiento de horarios', improvements: 'Profundizar conocimientos técnicos' },
  ]
  let perfCount = 0
  for (let i = 1; i < employeeIds.length; i += 2) {
    const pc = perfComments[perfCount % perfComments.length]
    const evalDate = new Date(now)
    evalDate.setMonth(evalDate.getMonth() - Math.floor(Math.random() * 3))
    await db.insert(employeePerformance).values({
      employeeId: employeeIds[i],
      evaluatedById: adminId,
      evaluationDate: evalDate,
      rating: Math.floor(Math.random() * 2) + 3,
      punctuality: Math.floor(Math.random() * 2) + 3,
      teamwork: Math.floor(Math.random() * 2) + 4,
      productivity: Math.floor(Math.random() * 2) + 3,
      attitude: Math.floor(Math.random() * 2) + 4,
      communication: Math.floor(Math.random() * 2) + 3,
      strengths: pc.strengths,
      improvements: pc.improvements,
      comments: 'Evaluación trimestral de desempeño',
      recommendation: 'Continuar con el desarrollo profesional',
    })
    perfCount++
  }
  console.log(`✅ ${perfCount} evaluaciones de desempeño`)

  // ─── Employee Documents ──────────────────────────────────────
  console.log('\n📁 Creando documentos...')
  const docEntries = [
    { type: 'DNI', name: 'Copia de DNI' },
    { type: 'CONTRACT', name: 'Contrato firmado' },
    { type: 'CERTIFICATE', name: 'Certificado de estudios' },
    { type: 'STUDIES', name: 'Título universitario' },
  ]
  let docCount = 0
  for (let i = 0; i < Math.min(employeeIds.length, 6); i++) {
    const de = docEntries[i % docEntries.length]
    await db.insert(employeeDocuments).values({
      employeeId: employeeIds[i],
      name: de.name,
      type: de.type,
      description: `Documento de ${employeeData[i].name}`,
      fileName: `${de.type.toLowerCase()}_${employeeData[i].doc}.pdf`,
      fileSize: `${Math.floor(Math.random() * 500) + 100}KB`,
      uploadedById: adminId,
    })
    docCount++
  }
  console.log(`✅ ${docCount} documentos cargados`)

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
