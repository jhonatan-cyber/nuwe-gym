# 🏋️ Nuwe Gym — Plan de Implementación

> Última actualización: 2026-07-01
> Progreso general: ~58% implementado | ~4% parcial | ~38% pendiente

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
| 1.2.2 | Invitados (lógica completa) | 🔲 Pendiente | Media | Tabla `guest_passes`, validación en check-in, límites por paquete |
| 1.2.3 | Membresías familiares | 🔲 Pendiente | Media | Tabla `family_groups`, relación padre/hijo, pricing grupal |
| 1.2.4 | Membresías corporativas | 🔲 Pendiente | Media | Tabla `corporate_accounts`, empresa con empleados, facturación centralizada |
| 1.2.5 | Membresías por horas | 🟡 Parcial | Media | Backend implementado (`allowedStartTime/EndTime` + `dailyAccessLimit`); sin UI dedicada |
| 1.2.6 | Membresías por ingresos | ✅ Completado | Baja | Soportado con `dailyAccessLimit` en packages |

### 1.3 Caja y Finanzas

| # | Feature | Estado | Complejidad | Notas |
|---|---------|--------|-------------|-------|
| 1.3.1 | Pagos parciales | ✅ Completado | Media | `recordAdditionalPayment`, `getSubscriptionBalance`, saldo pendiente en UI del detail dialog |
| 1.3.2 | Comisiones (cálculo automático) | ✅ Completado | Media | `getCommissionsReport` implementado: calcula comisión por trainer según `commissionRate` × ingresos de membresías de sus socios asignados |
| 1.3.3 | Facturación | 🔲 Pendiente | Alta | Generación de facturas con número secuencial, datos fiscales, contribuyente |
| 1.3.4 | Exportación Excel (real) | 🔲 Pendiente | Baja | Actualmente solo CSV; implementar con `xlsx` o `exceljs` |

### 1.4 Inventario

| # | Feature | Estado | Complejidad | Notas |
|---|---------|--------|-------------|-------|
| 1.4.1 | Kardex (UI) | ✅ Completado | Media | Vista de historial de movimientos por producto implementada |
| 1.4.2 | Lotes | 🔲 Pendiente | Media | `batchNumber` no existe en `inventoryMovements`; pendiente |
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
| 1.6.3 | Recordatorios de clase | 🔲 Pendiente | Media | Sin sistema de notificaciones externas |

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
| 1.7.8 | Reportes cross-branch | 🔲 Pendiente | Media | Filtro consolidado de todas las sucursales no implementado |

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
| 2.7 | Fotografías del progreso | 🟡 Parcial | Media | Campo `photo_url` en schema `weight_history`; sin UI de upload aún |
| 2.8 | Plan alimenticio (UI) | ✅ Completado | Alta | Editor manual + lista de planes con macros, tabs por socio, UI completa |
| 2.9 | IA: Alimentación sugerida | ✅ Completado | Alta | `generateAINutritionPlan` via Groq con objetivo, restricciones, presupuesto, IMC automático |

---

## Fase 3 — Fidelización

> Prioridad: MEDIA | Retención de clientes

| # | Feature | Estado | Complejidad | Notas |
|---|---------|--------|-------------|-------|
| 3.1 | Schema `loyalty_points` | 🔲 Pendiente | Media | No existe |
| 3.2 | Reglas de acumulación | 🔲 Pendiente | Media | No implementado |
| 3.3 | Niveles (Bronce/Plata/Oro/Platino) | 🔲 Pendiente | Media | No existe tabla `loyalty_tiers` |
| 3.4 | Sistema de referidos | 🔲 Pendiente | Media | No implementado |
| 3.5 | Cupones de descuento | 🔲 Pendiente | Media | No existe tabla `coupons` |
| 3.6 | Canje de recompensas | 🔲 Pendiente | Media | No implementado |
| 3.7 | Retos mensuales | 🔲 Pendiente | Alta | No implementado |
| 3.8 | Logros / Badges | 🔲 Pendiente | Alta | No implementado |

---

## Fase 4 — Automatizaciones y Comunicaciones

> Prioridad: ALTA | Impacto directo en retención y UX

| # | Feature | Estado | Complejidad | Notas |
|---|---------|--------|-------------|-------|
| 4.1 | Integración WhatsApp (API) | 🔲 Pendiente | Alta | No implementado |
| 4.2 | Integración Email (SMTP/Resend) | 🔲 Pendiente | Media | No implementado |
| 4.3 | Integración SMS | 🔲 Pendiente | Alta | No implementado |
| 4.4 | Notificaciones Push | 🟡 Parcial | Alta | Notificaciones in-app implementadas; sin FCM / Web Push externo |
| 4.5 | Recordatorio vencimiento (auto) | 🟡 Parcial | Media | Flag de auto-renovación en settings existe; sin cron job real |
| 4.6 | Feliz cumpleaños (auto) | 🔲 Pendiente | Baja | No implementado |
| 4.7 | Promociones automáticas | 🔲 Pendiente | Media | No implementado |
| 4.8 | Recuperación clientes inactivos | 🔲 Pendiente | Media | No implementado |
| 4.9 | Cobro automático | 🔲 Pendiente | Alta | No implementado |

---

## Fase 5 — Recursos Humanos

> Prioridad: MEDIA | Solo si el gimnasio tiene empleados propios

| # | Feature | Estado | Complejidad | Notas |
|---|---------|--------|-------------|-------|
| 5.1 | Schema `employees` | 🔲 Pendiente | Media | No existe |
| 5.2 | Asistencia empleados | 🔲 Pendiente | Media | No implementado |
| 5.3 | Horarios / Turnos | 🔲 Pendiente | Media | No existe tabla `schedules` de empleados |
| 5.4 | Vacaciones | 🔲 Pendiente | Media | No implementado |
| 5.5 | Sueldos | 🔲 Pendiente | Alta | No implementado |
| 5.6 | Bonificaciones | 🔲 Pendiente | Media | No implementado |
| 5.7 | Comisiones (integración con trainers) | 🔲 Pendiente | Media | Depende de 1.3.2 |

---

## Fase 6 — Pantallas del Gimnasio

> Prioridad: BAJA | Marketing y experiencia in-situ

| # | Feature | Estado | Complejidad | Notas |
|---|---------|--------|-------------|-------|
| 6.1 | Ranking de asistencia | 🔲 Pendiente | Baja | No implementado |
| 6.2 | Próximas clases | 🔲 Pendiente | Baja | Query de `classSchedules` no expuesta en vista pública |
| 6.3 | Promociones activas | 🔲 Pendiente | Baja | No implementado |
| 6.4 | Frases motivacionales | 🔲 Pendiente | Baja | No implementado |
| 6.5 | Galería de videos | 🔲 Pendiente | Media | No implementado |
| 6.6 | Estado de ocupación | 🔲 Pendiente | Baja | No implementado |
| 6.7 | Pantalla view (kiosk mode) | 🔲 Pendiente | Media | No existe ruta pública de kiosk |

---

## Fase 7 — Seguridad avanzada

> Prioridad: MEDIA | Protección de datos

| # | Feature | Estado | Complejidad | Notas |
|---|---------|--------|-------------|-------|
| 7.1 | 2FA (TOTP) | 🔲 Pendiente | Media | No implementado |
| 7.2 | Registro de dispositivos | 🔲 Pendiente | Media | No existe tabla `user_devices` |
| 7.3 | Permisos granulares | 🔲 Pendiente | Media | `permissions.ts` existe pero sin granularidad por acción |

---

## Fase 8 — Multi-sucursal completo

> Prioridad: MEDIA | Solo relevante con 2+ sucursales

| # | Feature | Estado | Complejidad | Notas |
|---|---------|--------|-------------|-------|
| 8.1 | Reportes consolidados | 🔲 Pendiente | Media | Sin filtro `ALL` branches en reportes |
| 8.2 | Clientes compartidos | 🔲 Pendiente | Alta | `branchId` es obligatorio en members actualmente |
| 8.3 | Acceso entre sucursales | 🔲 Pendiente | Media | Check-in solo válido en branch de registro |

---

## 🗓️ Cronograma estimado

```
Fase 1 (Completar core)     → Semanas 1-4
Fase 2 (Nutrición)          → Semanas 5-7
Fase 4 (Automatizaciones)   → Semanas 8-10
Fase 3 (Fidelización)       → Semanas 11-13
Fase 7 (Seguridad)          → Semanas 14-15
Fase 5 (RRHH)               → Semanas 16-18
Fase 8 (Multi-sucursal)     → Semanas 19-20
Fase 6 (Pantallas)          → Semanas 21-22
```

**Estimación total: ~22 semanas (5.5 meses)**

---

## 📊 Tracking de progreso

| Fase | Estado | % | Detalle |
|------|--------|---|---------|
| Fase 1 — Completar core | 🟡 En progreso | ~78% | 1.1✅(3/6) · 1.2✅(3/6) · 1.3✅(2/4) · 1.4✅(3/4) · 1.5✅(5/5) · 1.6✅(2/3) · 1.7✅(7/8) |
| Fase 2 — Nutrición | 🟡 En progreso | ~90% | ✅ schema, IMC, % grasa, masa muscular, gráficos, plan alimenticio UI, IA Groq. 🟡 upload fotos |
| Fase 3 — Fidelización | 🔲 Pendiente | 0% | — |
| Fase 4 — Automatizaciones | 🟡 En progreso | ~15% | Notificaciones in-app + flag auto-renovación |
| Fase 5 — RRHH | 🔲 Pendiente | 0% | — |
| Fase 6 — Pantallas | 🔲 Pendiente | 0% | — |
| Fase 7 — Seguridad | 🔲 Pendiente | 0% | — |
| Fase 8 — Multi-sucursal | 🔲 Pendiente | 0% | — |

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
| `analytics` | Churn, tendencias, predicciones, market-basket analysis | Server functions (sin UI) |
| `check-ins` | Vista de check-ins realizados | `/check-ins` |
| `cash-register` | Gestión de caja diaria con movimientos | `/cash-register` |
| `admin/users` | Administración de usuarios del sistema | `/admin/users` |

### Dependencias nuevas probablemente necesarias
- `xlsx` o `exceljs` — exportación Excel
- `otpauth` — 2FA TOTP
- `firebase-admin` o `web-push` — notificaciones push
- `resend` o `nodemailer` — emails transaccionales
- `twilio` — SMS y WhatsApp
- `qrcode` — generación de QR codes (si no existe)
