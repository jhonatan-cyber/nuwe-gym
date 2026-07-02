# 🏋️ Nuwe Gym — Plan de Implementación

> Última actualización: 2026-07-01
> Progreso general: ~96% implementado | ~0% parcial | ~4% pendiente

---

## 📋 Índice

1. [Fase 1 — Completar módulos existentes](#fase-1--completar-módulos-existente)
2. [Fase 2 — Nutrición](#fase-2--nutrición)
3. [Fase 3 — Fidelización](#fase-3--fidelización)
4. [Fase 4 — Automatizaciones y Comunicaciones](#fase-4--automatizaciones-y-comunicaciones)
5. [Fase 5 — Recursos Humanos](#fase-5--recursos-humanos)
6. [Fase 6 — Pantallas del Gimnasio](#fase-6--pantallas-del-gimnasio)
7. [Fase 7 — Seguridad avanzada](#fase-7--seguridad-avanzada)
8. [Fase 8 — Multi-sucursal completo](#fase-8--multi-sucursal-completo)

---

## Fase 1 — Completar módulos existentes

> Prioridad: ALTA | Impacto inmediato en funcionalidad core

### 1.1 Gestión de Miembros — Completar campos

| # | Feature | Estado | Complejidad | Notas |
|---|---------|--------|-------------|-------|
| 1.1.1 | Restricciones físicas (campo persistente) | ✅ Completado | Baja | Campo `physicalRestrictions` existe en schema `members` |
| 1.1.2 | Historial médico básico | ✅ Completado | Media | Campo `medicalNotes` en `members` (sin tabla separada; cubre el caso básico) |
| 1.1.3 | Firma digital del contrato | ✅ Completado | Media | Campo `contractSignature` existe en `members` schema |
| 1.1.4 | Reconocimiento facial | 🔲 Pendiente | Alta | Requiere integración con API de reconocimiento (AWS Rekognition, FaceIO, o similar) |
| 1.1.5 | Huella digital | 🔲 Pendiente | Alta | Requiere hardware lector + SDK (DigitalPersona, ZKTeco) |
| 1.1.6 | Tarjeta RFID | 🔲 Pendiente | Alta | Requiere hardware lector + integración con check-in |

### 1.2 Membresías — Completar tipos

| # | Feature | Estado | Complejidad | Notas |
|---|---------|--------|-------------|-------|
| 1.2.1 | Pases diarios dedicados | ✅ Completado | Baja | `DAILY_PASS` agregado a `packageTypeEnum` en DB y al tipo `PackageType` |
| 1.2.2 | Invitados (lógica completa) | ✅ Completado | Media | Schema `guest_passes` + server functions CRUD + `GuestPassSection` en detail dialog + seed con `guest_passes` benefit en Plan Premium |
| 1.2.3 | Membresías familiares | ✅ Completado | Media | Schema `family_groups` + `family_members` con relaciones y descuento %. `FamilySection` en detail dialog (crear grupo + agregar/quitar miembros). Descuento automático al crear suscripción. |
| 1.2.4 | Membresías corporativas | ✅ Completado | Media | Schema `corporate_accounts` + CRUD server + UI página dedicada (`/corporate-accounts`) con detalle de empleados + reporte de facturación consolidado. Asignación de empleados al crear/editar socios. |
| 1.2.5 | Membresías por horas | ✅ Completado | Media | Ya implementado: schema + PackageForm (allowedStartTime/EndTime/dailyAccessLimit/allowedDays per-day) + check-in server valida horario. |
| 1.2.6 | Membresías por ingresos | ✅ Completado | Baja | Soportado con `dailyAccessLimit` en packages |

| Fase 1 — Completar core | 🟡 En progreso | ~95% | 1.1✅(3/6) · 1.2✅(6/6) · 1.3✅(4/5) · 1.4✅(4/4) · 1.5✅(5/5) · 1.6✅(3/3) · 1.7✅(8/8) |

### 1.3 Caja y Finanzas

| # | Feature | Estado | Complejidad | Notas |
|---|---------|--------|-------------|-------|
| 1.3.1 | Pagos parciales | ✅ Completado | Media | `recordAdditionalPayment`, `getSubscriptionBalance`, saldo pendiente en UI del detail dialog |
| 1.3.2 | Comisiones (cálculo automático) | ✅ Completado | Media | `getCommissionsReport` implementado: calcula comisión por trainer según `commissionRate` × ingresos de membresías de sus socios asignados |
| 1.3.3 | Facturación | ✅ Completado | Alta | Schema `invoices` + `invoice_sequences` con número secuencial (`F-{año}-{0001}`). CRUD server + auto-generación al crear pagos/ventas. UI página dedicada (`/invoices`) con detalle de items + datos fiscales del gym en Settings > Facturación. |
| 1.3.4 | Exportación Excel (real) | ✅ Completado | Baja | `xlsx` instalado + 4 server functions Excel + formato toggle en UI (CSV/Excel) para Socios, Ventas, Pagos e Ingresos |

| Fase 1 — Completar core | 🟡 En progreso | ~97% | 1.1✅(3/6) · 1.2✅(6/6) · 1.3✅(5/5) · 1.4✅(4/4) · 1.5✅(5/5) · 1.6✅(3/3) · 1.7✅(8/8) |
| 1.3.5 | Congelamiento de membresías | ✅ Completado | Media | Schema `membership_freezes` + server functions + página dedicada (`/membership-freezes`). Permite pausar/reanudar suscripciones |

### 1.4 Inventario

| # | Feature | Estado | Complejidad | Notas |
|---|---------|--------|-------------|-------|
| 1.4.1 | Kardex (UI) | ✅ Completado | Media | Vista de historial de movimientos por producto implementada |
| 1.4.2 | Lotes | ✅ Completado | Media | Campo `batchNumber` agregado a `inventoryMovements` (schema + migration `0015_bitter_viper.sql`). Input en purchase form + columna en KardexTable. Server function createPurchase incluye batchNumber en cada item. |
| 1.4.3 | Fechas de vencimiento | ✅ Completado | Baja | Campo `expiryDate` existe en `productStock` |
| 1.4.4 | Transferencias entre sucursales | ✅ Completado | Alta | `transferStock` server function + `StockTransferDialog` UI + botón en tarjeta de producto |

### 1.5 Entrenadores

| # | Feature | Estado | Complejidad | Notas |
|---|---------|--------|-------------|-------|
| 1.5.1 | Agenda (vista calendario) | ✅ Completado | Media | `TrainerCalendarView` con grilla semanal, slots color-coded, leyenda interactiva |
| 1.5.2 | Observaciones por cliente | ✅ Completado | Baja | Tabla `trainerObservations` + server functions + UI implementados |
| 1.5.3 | Historial de sesiones | ✅ Completado | Baja | Query de `trainerAssignments` + observaciones por trainer/cliente disponible |
| 1.5.4 | Seguimiento de progreso | ✅ Completado | Media | `member_evaluations` con medidas corporales + tests físicos + historial con tendencias |
| 1.5.5 | Evaluaciones físicas | ✅ Completado | Media | Formulario con medidas (pecho, cintura, brazos, piernas) + tests (flexiones, abdominales, dominadas, carrera, flexibilidad, plancha) + tendencias visuales |

### 1.6 Reservas / Clases

| # | Feature | Estado | Complejidad | Notas |
|---|---------|--------|-------------|-------|
| 1.6.1 | Lista de espera | ✅ Completado | Media | Schema `class_waitlist` + server functions: `getWaitlist`, `addToWaitlist`, `removeFromWaitlist`, `promoteFromWaitlist`. `cancelBooking` promueve automáticamente al primero de la lista |
| 1.6.2 | Cancelaciones con UI | ✅ Completado | Baja | Botón de cancelar booking + liberar cupo implementado |
| 1.6.3 | Recordatorios de clase | ✅ Completado | Media | Email reminders en `generateNotifications`: consulta schedules con dayOfWeek = hoy/mañana + bookings CONFIRMED. Envía email con clase, hora y sala. Usa servicio Resend existente. |

### 1.7 Dashboard y Reportes

| # | Feature | Estado | Complejidad | Notas |
|---|---------|--------|-------------|-------|
| 1.7.1 | Gender distribution (fix) | ✅ Completado | Baja | Query real implementada (ya no hardcoded a 0) |
| 1.7.2 | Clases más populares | ✅ Completado | Baja | Query de bookings por clase implementada |
| 1.7.3 | Entrenadores más solicitados | ✅ Completado | Baja | Query de assignments por trainer implementada |
| 1.7.4 | Reporte de inventario | ✅ Completado | Baja | Tabla + top productos con stock disponible |
| 1.7.5 | Reporte de caja | ✅ Completado | Baja | Resumen de sesiones de caja implementado |
| 1.7.6 | Reporte de comisiones | ✅ Completado | Media | `getCommissionsReport`: calcula comisión por trainer según `commissionRate` × ingresos de membresías de sus socios asignados en el período |
| 1.7.7 | Reporte de utilidades | ✅ Completado | Media | `getProfitabilityReport`: ingresos totales, COGS, egresos, utilidad bruta/neta y margen con gráfico diario |
| 1.7.8 | Reportes cross-branch | ✅ Completado | Media | `getCrossBranchReport`: compara sucursales activas lado a lado (socios, check-ins, membresías, POS, egresos, balance) con fila consolidada + gráfico de barras + tarjetas individuales. Nueva pestaña "Consolidado" en Reportes. |

---

## Fase 2 — Nutrición

> Prioridad: ALTA | Diferenciador clave del producto

| # | Feature | Estado | Complejidad | Notas |
|---|---------|--------|-------------|-------|
| 2.1 | Schema `nutrition_plans` | ✅ Completado | Media | Tabla `nutrition_plans` con macros, calorías, contenido libre, flag IA |
| 2.2 | Schema `weight_history` | ✅ Completado | Baja | Tabla `weight_history` con peso, altura, % grasa, masa muscular, foto, notas |
| 2.3 | Cálculo de IMC | ✅ Completado | Baja | `calcImc()` + componente `ImcBadge` con rangos bajo peso/normal/sobrepeso/obesidad |
| 2.4 | Porcentaje de grasa | ✅ Completado | Media | Campo `bodyFatPercent` en `weight_history`, input en UI |
| 2.5 | Masa muscular | ✅ Completado | Media | Campo `muscle_mass_kg` en `weight_history`, input en UI |
| 2.6 | Historial de peso + gráficos | ✅ Completado | Media | `WeightChart` con Recharts (línea de tendencia + promedio), tabla histórica |
| 2.7 | Fotografías del progreso | ✅ Completado | Media | Upload vía FileReader(base64) en dialog de nuevo registro + columna con thumbnail en tabla historial + campo `photoUrl` integrado en server function |
| 2.8 | Plan alimenticio (UI) | ✅ Completado | Alta | Editor manual + lista de planes con macros, tabs por socio, UI completa |
| 2.9 | IA: Alimentación sugerida | ✅ Completado | Alta | `generateAINutritionPlan` via Groq con objetivo, restricciones, presupuesto, IMC automático |

---

## Fase 3 — Fidelización

> Prioridad: MEDIA | Retención de clientes

| # | Feature | Estado | Complejidad | Notas |
|---|---------|--------|-------------|-------|
| 3.1 | Schema `loyalty_points` + `loyalty_tiers` | ✅ Completado | Media | Tablas creadas + migración `0016_naive_bloodstrike.sql`. Seeds: Bronce/Plata/Oro/Platino. Ver schema `src/shared/db/schema/loyalty.ts`. |
| 3.2 | Reglas de acumulación | ✅ Completado | Media | 1pt por check-in, 1pt por cada $50 en compras. Hooks en `check-ins/server.ts` y `sales/server.ts`. |
| 3.3 | Niveles (Bronce/Plata/Oro/Platino) | ✅ Completado | Media | 4 tiers con umbrales (0/100/300/1000 pts) y % de descuento. Cálculo automático al consultar puntos. Badge en UI del socio. |
| 3.4 | Sistema de referidos | ✅ Completado | Media | Campo `referralCode` + `referredBy` en members (autogenerado al crear socio). Código único por socio. Al registrarse con código de referido, el referidor recibe +10 pts cuando el referido hace su primer check-in. UI: código visible + copiar al portapapeles + input de código al crear socio. |
| 3.5 | Cupones de descuento | ✅ Completado | Media | Tabla `coupons` + `coupon_usage`. Admin CRUD desde Settings > Cupones: código, % descuento, usos máx, activo/inactivo. Validación server-side. |
| 3.6 | Canje de recompensas | ✅ Completado | Media | Dialog de canje en UI del socio: input de puntos + descripción. Validación de saldo. Descuento por nivel aplicable en ventas. |
| 3.7 | Retos mensuales | ✅ Completado | Alta | Schema `challenges` + `challenge_progress`. Engine que verifica automáticamente progreso en check-in/purchase. Seed: "Reto del Mes" (20 check-ins, +30 pts). Barra de progreso en UI del socio. |
| 3.8 | Logros / Badges | ✅ Completado | Alta | Schema `badges` + `member_badges`. Engine que otorga badges automáticamente. Seed: 6 badges (Primer Check-in, Constante, Dedicado, Primera Compra, Cliente Frecuente, Referidor). UI: lista de badges obtenidos en perfil del socio. |

---

## Fase 4 — Automatizaciones y Comunicaciones

> Prioridad: ALTA | Impacto directo en retención y UX

| # | Feature | Estado | Complejidad | Notas |
|---|---------|--------|-------------|-------|
| 4.1 | Integración WhatsApp (API) | ✅ Completado | Alta | Twilio SDK v6 integrado. Campos de configuración en Settings > Notificaciones + `sendWhatsApp()` en `src/shared/lib/twilio.ts`. Envío automático en `generateNotifications` para vencimientos, expiraciones, cumpleaños y recuperación de inactivos. |
| 4.2 | Integración Email (Resend) | ✅ Completado | Media | SDK v6. Campos `resendApiKey` + `emailFrom` en settings (UI+schema). Emails automáticos en `generateNotifications` para vencimientos próximos (≤1d) y expirados. Migración `0014_swift_pixie.sql`. Habilitar: API key en Settings > Notificaciones + cada miembro debe tener email cargado. |
| 4.3 | Integración SMS | ✅ Completado | Alta | Misma integración Twilio que WhatsApp. `sendSMS()` en `src/shared/lib/twilio.ts`. Envío automático en `generateNotifications` para vencimientos, expiraciones, cumpleaños y recuperación de inactivos. |
| 4.4 | Notificaciones Push (FCM) | ✅ Completado | Alta | Schema `push_subscriptions` + `firebase-admin` server SDK + `firebase` client SDK. Service worker (`firebase-messaging-sw.js`) para recibir notis en background. UI de suscripción en campana de notificaciones (activar/desactivar). Configuración Firebase en Settings > Notificaciones. Push automático al generar notificaciones (expiración, stock bajo, etc.). Limpieza de tokens expirados. |
| 4.5 | Recordatorio vencimiento (auto) | ✅ Completado | Media | Flag `enableAutoRenew` + `runAutoRenewalsCore` (lógica extraída) + `processAutoRenewals` (server fn con session). **Nuevo endpoint cron**: `POST /api/cron/auto-renewals` protegido con API key (`autoRenewSecretKey`). Listo para scheduler externo (Vercel Cron, cron-job.org). Separado de `generateNotifications`. |
| 4.6 | Feliz cumpleaños (auto) | ✅ Completado | Baja | Servicio email ya existente. Query de members con cumpleaños hoy + sendEmail inline en `generateNotifications`. Sin notificación in-app (solo email). Sin dedup (se envía cada vez que se ejecuta generate). |
| 4.7 | Promociones automáticas | ✅ Completado | Media | Schema `promotions` + CRUD server + `getApplicablePromotions`/`getApplicableDiscount` + UI `PromotionsManager` en Settings > Promociones. Seed en migration 0018. |
| 4.8 | Recuperación clientes inactivos | ✅ Completado | Media | Query en `generateNotifications`: members ACTIVOS sin check-in ≥30 días reciben email de recuperación. Sin dedup (se envía cada ejecución). |
| 4.9 | Cobro automático (Stripe) | ✅ Completado | Alta | Stripe SDK integrado. Schema `member_payment_methods` (tokenización de tarjetas). Server functions: setup intent, attach, list, toggle auto-pay, remove, charge. UI en detalle de socio. Config en Settings > Pagos. Auto-renewals ahora intentan cobrar tarjeta (CARD) antes de fallback a CASH. Webhook endpoint `/api/stripe/webhook`. |

---

## Fase 5 — Recursos Humanos

> Prioridad: MEDIA | Solo si el gimnasio tiene empleados propios

| # | Feature | Estado | Complejidad | Notas |
|---|---------|--------|-------------|-------|
| 5.1 | Schema `employees` | ✅ Completado | Media | Tabla `employees` con 24 columnas (code, puesto, salario, banco, contacto emergencia, etc.) + CRUD completo + migración `0022_outstanding_roland_deschain.sql` |
| 5.2 | Asistencia empleados | ✅ Completado | Media | Tabla `employee_attendance` + server functions (clockIn/Out, markAbsent, forceClockOut, report) + página `/employee-attendance` con dashboard de hoy, cards por empleado, historial 30d. Auto-detecta tardanza (>9:15) y salida temprana (<18:00). Sidebar nav + ruta protegida ADMIN/RECEPTIONIST. |
| 5.3 | Horarios / Turnos | ✅ Completado | Media | Tabla `employee_schedules` + server functions (getWeeklySchedule, setEmployeeSchedules con detección de conflictos, getScheduleConflicts cross-employee) + grilla semanal con editor modal por empleado + ruta `/employee-schedules` + sidebar nav + relaciones en relations.ts + transacción DB al guardar |
| 5.4 | Vacaciones | ✅ Completado | Media | Tabla `employee_vacations` + server functions (requestVacation con cálculo de días disponibles 15+1/año máx.30, approveRejectVacation, cancelVacation) + página `/employee-vacations` con listado + request dialog + approve/reject/cancel inline + sidebar nav |
| 5.5 | Sueldos | ✅ Completado | Alta | Tabla `payroll` con jsonb bonuses/deductions + server functions (generatePayroll con filtro de período y auto-cálculo neto, markPayrollPaid, getPayrollStats) + página `/payroll` con tabs Nóminas/Bonificaciones, generate dialog, mark as paid |
| 5.6 | Bonificaciones | ✅ Completado | Media | Tabla `employee_bonuses` + server functions CRUD + gestión integrada en página de Sueldos con dialog de creación y lista con delete inline |
| 5.7 | Comisiones (integración con trainers) | ✅ Completado | Media | Bridge employees↔trainers via userId shared. `commission-server.ts` con 4 funciones. `generatePayroll` con flag `includeCommissions` que auto-crea bonificaciones. Tab de Comisiones en página de Sueldos con selector de período, detalle por empleado-entrenador (tasa %, socios asignados, ingresos, comisión calculada). Dashboard de comisiones en panel izquierdo. |
| 5.8 | Evaluaciones de desempeño | ✅ Completado | Media | Schema `employee_performance` con rating 1-5 y 5 áreas (puntualidad, trabajo equipo, productividad, actitud, comunicación) + fortalezas/mejoras. UI con estrellas interactivas. Historial con promedio general. Server functions CRUD. |
| 5.9 | Contratos | ✅ Completado | Media | Schema `employee_contracts` con tipo (Indefinido/Plazo fijo/Temporal/Freelance/Pasantía), fechas, salario, horario, beneficios, términos. UI con badges de tipo y colores. Server functions CRUD. |
| 5.10 | Documentos | ✅ Completado | Media | Schema `employee_documents` con tipo (8 categorías), nombre, URL, tamaño. UI con badges, enlace de descarga. Server functions CRUD. |

Los 3 módulos (evaluaciones, contratos, documentos) están integrados en un detail dialog accesible desde la tabla de empleados (click en fila). Diálogo con tabs: Info / Desempeño / Contratos / Documentos.

---

## Fase 6 — Pantallas del Gimnasio

> Prioridad: BAJA | Marketing y experiencia in-situ

| 6.5 | Galería multimedia (imágenes) | ✅ Completado | Media | Schema `tv_media` (imageUrl, caption, displayOrder). CRUD desde Settings > Pantalla TV. Carrusel en TV page con auto-advance 5s, dots, caption overlay. |
| 6.6 | Ocupación | ✅ Completado | Media | Barra de ocupación con capacidad estimada de 200 personas/día |
| 6.7 | Pantalla view (kiosk mode) | ✅ Completado | Media | Ruta pública `/tv`. Full-screen con 6 secciones rotativas cada 10s. Auto-refresh 30s. Reloj en vivo. Dots de navegación interactivos. |

### Mejoras adicionales de TV

| # | Feature | Estado | Notas |
|---|---------|--------|-------|
| 6.8 | Ticker de noticias | ✅ Completado | Barra inferior con scroll infinito. Mensajes configurables desde Settings > Pantalla TV > Ticker. Tabla `tv_ticker_messages`. |
| 6.9 | Auto-hide cursor | ✅ Completado | Cursor se oculta tras 3s de inactividad, reaparece al mover el mouse. Modo kiosk pulido. |
| 6.10 | Contadores animados | ✅ Completado | `useCountUp` hook con ease-out cúbico para números de check-ins y ocupación. |
| 6.11 | Transiciones crossfade | ✅ Completado | `fadeSlideIn` con cubic-bezier entre secciones. Componentes separados por sección. |



---

## Fase 7 — Seguridad avanzada

> Prioridad: MEDIA | Protección de datos

| # | Feature | Estado | Complejidad | Notas |
|---|---------|--------|-------------|-------|
| 7.1 | 2FA (TOTP) | ✅ Completado | Media | Plugin `twoFactor` de Better Auth habilitado con TOTP. QR code real con `qrcode` (dataURL 220px). Password prompt antes de enable/disable. Login detecta `twoFactorRedirect` |
| 7.2 | Registro de dispositivos | ✅ Completado | Media | Schema `user_devices` con nombre, tipo, IP, confianza. Server functions get/toggleTrust/remove. UI `DevicesSection` en perfil del usuario |
| 7.3 | Permisos granulares | ✅ Completado | Media | `requirePermission()` server function basada en `permissions.ts` existente. Validación runtime por permiso específico |

---

## Fase 8 — Multi-sucursal completo

> Prioridad: MEDIA | Solo relevante con 2+ sucursales

| # | Feature | Estado | Complejidad | Notas |
|---|---------|--------|-------------|-------|
| 8.1 | Reportes consolidados | ✅ Completado | Media | `getCrossBranchReport` con comparativa sucursal a sucursal + fila consolidada en Reportes > Consolidado |
| 8.2 | Clientes compartidos | ✅ Completado | Alta | Junction table `member_branches` (unique memberId+branchId) + server functions `getMemberBranches`/`setMemberBranches` (transaccional) + actualización de `findMembers` para filtrar por primaryBranchId O junction table O shared members (branchId IS NULL sin memberBranches). UI `BranchesSection` en detail dialog del socio. Función `getMemberIdsForBranch` para obtener todos los miembros que pueden acceder a una sucursal. |
| 8.3 | Acceso entre sucursales | ✅ Completado | Media | `canMemberAccessBranch()` en `branch-access-server.ts`: verifica primaryBranchId + junction table + shared (null = acceso global). `validateCheckIn` ahora acepta `checkInBranchId` opcional que valida acceso antes de procesar el check-in. Nuevo status `DENIED_BRANCH`. `createCheckIn` pasa `branchId` a validateCheckIn. Miembro sin branchId y sin memberBranches puede check-in en cualquier sucursal. |

---

## 🗓️ Cronograma estimado

```
Fase 1 (Completar core)     → Semanas 1-4
Fase 2 (Nutrición)          → Semanas 5-7
Fase 3 (Fidelización)       → Semanas 7-8
Fase 4 (Automatizaciones)   → Semanas 8-10
Fase 5 (RRHH)               → Semanas 16-18
Fase 8 (Multi-sucursal)     → Semanas 19-20
Fase 7 (Seguridad)          → Semanas 14-15
Fase 6 (Pantallas)          → Semanas 21-22
```

**Estimación total: ~22 semanas (5.5 meses)**

---

## 📊 Tracking de progreso

| Fase | Estado | % | Detalle |
|------|--------|---|---------|
| **Fase 1 — Completar core** | 🟡 En progreso | ~98% | **1.1✅(3/6) · 1.2✅(6/6) · 1.3✅(5/5) · 1.4✅(4/4) · 1.5✅(5/5) · 1.6✅(3/3) · 1.7✅(8/8)** |
| Fase 2 — Nutrición | ✅ Completada | 100% | Todos los items implementados |
| Fase 3 — Fidelización | ✅ Completada | 100% | Todos los items implementados |
| Fase 4 — Automatizaciones | ✅ Completada | 100% | ✅ Email · ✅ Push · ✅ WhatsApp · ✅ SMS · ✅ Birthday · ✅ Inactivos · ✅ Promos · ✅ Cron · ✅ Cobro Stripe |
| Fase 5 — RRHH | ✅ Completada | 100% | 5.1✅ · 5.2✅ · 5.3✅ · 5.4✅ · 5.5✅ · 5.6✅ · 5.7✅ · 5.8✅ · 5.9✅ · 5.10✅ |
| **Fase 6 — Pantallas TV** | **✅ Completada** | **100%** | **6.1✅ Ranking · 6.2✅ Clases · 6.3✅ Promos · 6.4✅ Frases · 6.5✅ Galería · 6.6✅ Ocupación · 6.7✅ Kiosk mode · 6.8✅ Ticker · 6.9✅ Cursor hide · 6.10✅ Counters · 6.11✅ Transitions** |
| Fase 7 — Seguridad | ✅ Completada | 100% | 7.1✅ TOTP · 7.2✅ Dispositivos · 7.3✅ Permisos granulares |
| **Fase 8 — Multi-sucursal** | **✅ Completada** | **100%** | **8.1✅ · 8.2✅ · 8.3✅** |

| **Dashboard Analytics** | **✅ Completado** | **100%** | **Churn rate widget · Revenue vs Goals chart · Membership trends · UI polish** |

**Leyenda:** 🔲 Pendiente | 🟡 En progreso | ✅ Completado | ⏸️ Pausado

---

## 🔑 Notas de implementación

### Stack actual
- **Frontend:** React + TanStack Router/Query + Tailwind v4 + shadcn/ui
- **Backend:** TanStack Start (SSR) + Drizzle ORM
- **DB:** PostgreSQL
- **AI:** Groq API (LLM)
- **Auth:** Better Auth

### Convenciones
- Features bajo `src/features/{module}/`
- Server functions con `createServerFn`
- Schemas en `src/shared/db/schema/`
- Componentes UI en `src/shared/components/ui/`
- Migraciones con `drizzle-kit generate`

### Módulos adicionales existentes (no listados en el plan original)

| Módulo | Features | Ruta |
|--------|----------|------|
| `renewals` | Wizard de renovación con pasos, resumen, componentes | `/renewals` |
| `qr-codes` | Generación y gestión de códigos QR para members | `/qr-codes` |
| `backup` | Backup y restauración de base de datos | `/backup` |
| `audit-logs` | Registro de auditoría de acciones | `/audit-logs` |
| `analytics` | Churn risk, tendencias, predicciones asistencia, market-basket recom., reorder suggestions, consultas NL vía Groq | Server functions + endpoints UI (dashboard gráficos) |
| `check-ins` | Vista de check-ins realizados | `/check-ins` |
| `cash-register` | Gestión de caja diaria con movimientos | `/cash-register` |
| `admin/users` | Administración de usuarios del sistema | `/admin/users` |
| `membership-freezes` | Congelamiento de membresías con pausa/reanudación | `/membership-freezes` |
| `evaluations` | Evaluaciones físicas (feature separado de trainers) | `/evaluations` (ruta embebida) |
| `routine-generator` | Generación de rutinas de ejercicio por IA (Groq) | Server function + dialog UI |
| `guest-passes` | Pases de invitado vinculados a membresías | `GuestPassSection` en detail dialog |

### Dependencias nuevas probablemente necesarias
- ~~`xlsx`~~ — ✅ ya instalado (`^0.18.5`) + exportación Excel implementada
- `otpauth` — 2FA TOTP
- `firebase-admin` o `web-push` — notificaciones push
- `resend` o `nodemailer` — emails transaccionales
- `twilio` — SMS y WhatsApp
- ~~`qrcode`~~ — ✅ ya instalado (`^1.5.4`) + módulo completo de QR codes
