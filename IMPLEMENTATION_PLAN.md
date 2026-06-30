# 🏋️ Nuwe Gym — Plan de Implementación

> Última actualización: 2026-06-30
> Progreso general: ~44% implementado | ~14% parcial | ~42% pendiente

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

| # | Feature | Complejidad | Notas |
|---|---------|-------------|-------|
| 1.1.1 | Restricciones físicas (campo persistente) | Baja | Agregar campo `physicalRestrictions` a `members` schema |
| 1.1.2 | Historial médico básico | Media | Nuevo schema `member_medical_history` con condiciones, medicamentos, alergias |
| 1.1.3 | Firma digital del contrato | Media | Campo `contractSignature` (base64 o URL) + componente de firma en wizard de alta |
| 1.1.4 | Reconocimiento facial | Alta | Requiere integración con API de reconocimiento (AWS Rekognition, FaceIO, o similar) |
| 1.1.5 | Huella digital | Alta | Requiere hardware lector + SDK (DigitalPersona, ZKTeco) |
| 1.1.6 | Tarjeta RFID | Alta | Requiere hardware lector + integración con check-in |

### 1.2 Membresías — Completar tipos

| # | Feature | Complejidad | Notas |
|---|---------|-------------|-------|
| 1.2.1 | Pases diarios dedicados | Baja | Agregar tipo `DAILY_PASS` en `packageTypeEnum` o flag en paquetes |
| 1.2.2 | Invitados (lógica completa) | Media | Tabla `guest_passes`, validación en check-in, límites por paquete |
| 1.2.3 | Membresías familiares | Media | Tabla `family_groups`, relación padre/hijo, pricing grupal |
| 1.2.4 | Membresías corporativas | Media | Tabla `corporate_accounts`, empresa con empleados, facturación centralizada |
| 1.2.5 | Membresías por horas | Media | Extender lógica de `allowedStartTime/EndTime` + `dailyAccessLimit` con UI dedicada |
| 1.2.6 | Membresías por ingresos | Baja | Paquetes con acceso ilimitado basado en cantidad de ingresos (ya soportado parcialmente) |

### 1.3 Caja y Finanzas

| # | Feature | Complejidad | Notas |
|---|---------|-------------|-------|
| 1.3.1 | Pagos parciales | Media | Campo `amountPaid` en `membershipPayments`, lógica de saldo pendiente |
| 1.3.2 | Comisiones (cálculo automático) | Media | Calcular comisión de trainers según `commissionRate` sobre ventas/membresías asignadas |
| 1.3.3 | Facturación | Alta | Generación de facturas con número secuencial, datos fiscales, contribuyente |
| 1.3.4 | Exportación Excel (real) | Baja | Usar librería `xlsx` o `exceljs` en vez de CSV |

### 1.4 Inventario

| # | Feature | Complejidad | Notas |
|---|---------|-------------|-------|
| 1.4.1 | Kardex (UI) | Media | Vista historial completa por producto con filtros de fecha/tipo |
| 1.4.2 | Lotes | Media | Campo `batchNumber` + `expiryDate` en `inventoryMovements` o nueva tabla |
| 1.4.3 | Fechas de vencimiento | Baja | Campo `expiryDate` en `productStock`, alertas de vencimiento |
| 1.4.4 | Transferencias entre sucursales | Alta | Movimiento tipo `TRANSFER`, debito/credito entre branches |

### 1.5 Entrenadores

| # | Feature | Complejidad | Notas |
|---|---------|-------------|-------|
| 1.5.1 | Agenda (vista calendario) | Media | Componente calendario mostrando sesiones de trainer |
| 1.5.2 | Observaciones por cliente | Baja | Tabla `trainer_observations` (trainerId, memberId, text, date) |
| 1.5.3 | Historial de sesiones | Baja | Query de `trainerAssignments` + observaciones por trainer/cliente |
| 1.5.4 | Seguimiento de progreso | Media | Tabla `member_progress` (peso, medidas, fotos) con gráficos |
| 1.5.5 | Evaluaciones físicas | Media | Template de evaluación con medición de fuerza, resistencia, flexibilidad |

### 1.6 Reservas / Clases

| # | Feature | Complejidad | Notas |
|---|---------|-------------|-------|
| 1.6.1 | Lista de espera | Media | Cuando `capacity` se alcanza, cola de espera con notificación |
| 1.6.2 | Cancelaciones con UI | Baja | Botón de cancelar booking + liberar cupo |
| 1.6.3 | Recordatorios de clase | Media | Notificación push/email antes de la clase reservada |

### 1.7 Dashboard y Reportes

| # | Feature | Complejidad | Notas |
|---|---------|-------------|-------|
| 1.7.1 | Gender distribution (fix) | Baja | Query real de conteo por género (hardcoded a 0) |
| 1.7.2 | Clases más populares | Baja | Query de bookings por clase |
| 1.7.3 | Entrenadores más solicitados | Baja | Query de assignments por trainer |
| 1.7.4 | Reporte de inventario | Baja | Tabla + gráfico de productos con stock |
| 1.7.5 | Reporte de caja | Baja | Resumen de sesiones de caja |
| 1.7.6 | Reporte de comisiones | Media | Calculadora de comisiones por trainer |
| 1.7.7 | Reporte de utilidades | Media | Ingresos - Egresos por período |
| 1.7.8 | Reportes cross-branch | Media | Filtro consolidado de todas las sucursales |

---

## Fase 2 — Nutrición

> Prioridad: ALTA | Diferenciador clave del producto

| # | Feature | Complejidad | Notas |
|---|---------|-------------|-------|
| 2.1 | Schema `nutrition_plans` | Media | member_id, comidas/día, alimentos, calorías, macros |
| 2.2 | Schema `weight_history` | Baja | member_id, peso, grasa corporal, masa muscular, fecha, foto |
| 2.3 | Cálculo de IMC | Baja | Fórmula simple: peso / (altura^2), mostrar en UI |
| 2.4 | Porcentaje de grasa | Media | Requiere input de medidas o fórmula estimada (US Navy, Jackson-Pollock) |
| 2.5 | Masa muscular | Media | Estimación por fórmula o integración con báscula body composition |
| 2.6 | Historial de peso + gráficos | Media | Tabla + componente gráfico con tendencia |
| 2.7 | Fotografías del progreso | Media | Campo `progressPhotos` (array de URLs/base64) en weight_history |
| 2.8 | Plan alimenticio (UI) | Alta | Editor de planes con comidas, porciones, timing |
| 2.9 | IA: Alimentación sugerida | Alta | Prompt Groq para generar planes según objetivos, restricciones, presupuesto |

---

## Fase 3 — Fidelización

> Prioridad: MEDIA | Retención de clientes

| # | Feature | Complejidad | Notas |
|---|---------|-------------|-------|
| 3.1 | Schema `loyalty_points` | Media | member_id, puntos acumulados, historial de transacciones |
| 3.2 | Reglas de acumulación | Media | Config: puntos por peso gastado, por check-in, por referido |
| 3.3 | Niveles (Bronce/Plata/Oro/Platino) | Media | Tabla `loyalty_tiers` con umbrales, ventajas por nivel |
| 3.4 | Sistema de referidos | Media | Código único por socio, registro de referido, bonificación |
| 3.5 | Cupones de descuento | Media | Tabla `coupons` (código, tipo %, monto, vencimiento, uso máximo) |
| 3.6 | Canje de recompensas | Media | Catálogo de reprecias, canje con puntos |
| 3.7 | Retos mensuales | Alta | Definición de retos (ej: "asistí 15 veces este mes"), progreso, completion |
| 3.8 | Logros / Badges | Alta | Sistema de insignias desbloqueables con UI de galería |

---

## Fase 4 — Automatizaciones y Comunicaciones

> Prioridad: ALTA | Impacto directo en retención y UX

| # | Feature | Complejidad | Notas |
|---|---------|-------------|-------|
| 4.1 | Integración WhatsApp (API) | Alta | Twilio WhatsApp API o similar, templates de mensajes |
| 4.2 | Integración Email (SMTP/Resend) | Media | Resend o Nodemailer para transaccionales |
| 4.3 | Integración SMS | Alta | Twilio SMS o similar |
| 4.4 | Notificaciones Push | Alta | Firebase Cloud Messaging o Web Push API |
| 4.5 | Recordatorio vencimiento (auto) | Media | Cron job que busca suscripciones por vencer y envía notificación |
| 4.6 | Feliz cumpleaños (auto) | Baja | Cron diario que busca birthdays y envía saludo |
| 4.7 | Promociones automáticas | Media | Reglas: si socio inactivo X días → enviar promo |
| 4.8 | Recuperación clientes inactivos | Media | Cron semanal + IA genera mensaje + envío automático |
| 4.9 | Cobro automático | Alta | Lógica de renew automático + cargo a método de pago guardado |

---

## Fase 5 — Recursos Humanos

> Prioridad: MEDIA | Solo si el gimnasio tiene empleados propios

| # | Feature | Complejidad | Notas |
|---|---------|-------------|-------|
| 5.1 | Schema `employees` | Media | Extender `users` o nueva tabla con datos laborales |
| 5.2 | Asistencia empleados | Media | Check-in/out de empleados con horario asignado |
| 5.3 | Horarios / Turnos | Media | Tabla `schedules` con rotación semanal |
| 5.4 | Vacaciones | Media | Tabla `time_off` con balance, aprobación |
| 5.5 | Sueldos | Alta | Tabla `payroll` con cálculo mensual |
| 5.6 | Bonificaciones | Media | Reglas de bonos por desempeño |
| 5.7 | Comisiones (integración con trainers) | Media | Vincular con cálculo de comisiones de Fase 1.3.2 |

---

## Fase 6 — Pantallas del Gimnasio

> Prioridad: BAJA | Marketing y experiencia in-situ

| # | Feature | Complejidad | Notas |
|---|---------|-------------|-------|
| 6.1 | Ranking de asistencia | Baja | Query top socios por check-ins del mes |
| 6.2 | Próximas clases | Baja | Query de `classSchedules` próximas |
| 6.3 | Promociones activas | Baja | Paquetes tipo PROMOTION vigentes |
| 6.4 | Frases motivacionales | Baja | Lista estática o API de frases, rotación automática |
| 6.5 | Galería de videos | Media | Upload de videos, playlist, reproducción en bucle |
| 6.6 | Estado de ocupación | Baja | Conteo de check-ins hoy vs capacidad total del gym |
| 6.7 | Pantalla view (kiosk mode) | Media | Ruta pública sin auth, auto-refresh, optimizada para TV |

---

## Fase 7 — Seguridad avanzada

> Prioridad: MEDIA | Protección de datos

| # | Feature | Complejidad | Notas |
|---|---------|-------------|-------|
| 7.1 | 2FA (TOTP) | Media | Integrar `otpauth` library, QR para Google Authenticator |
| 7.2 | Registro de dispositivos | Media | Tabla `user_devices` con fingerprint del browser, último login |
| 7.3 | Permisos granulares | Media | Expandir `permissions.ts` a nivel de acción por módulo |

---

## Fase 8 — Multi-sucursal completo

> Prioridad: MEDIA | Solo relevante con 2+ sucursales

| # | Feature | Complejidad | Notas |
|---|---------|-------------|-------|
| 8.1 | Reportes consolidados | Media | Queries con filtro `ALL` branches, breakdown por sucursal |
| 8.2 | Clientes compartidos | Alta | Members sin `branchId` obligatorio, acceso desde cualquier branch |
| 8.3 | Acceso entre sucursales | Media | Check-in en branch diferente al de registro |

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

| Fase | Estado | % |
|------|--------|---|
| Fase 1 — Completar core | 🔲 Pendiente | 0% |
| Fase 2 — Nutrición | 🔲 Pendiente | 0% |
| Fase 3 — Fidelización | 🔲 Pendiente | 0% |
| Fase 4 — Automatizaciones | 🔲 Pendiente | 0% |
| Fase 5 — RRHH | 🔲 Pendiente | 0% |
| Fase 6 — Pantallas | 🔲 Pendiente | 0% |
| Fase 7 — Seguridad | 🔲 Pendiente | 0% |
| Fase 8 — Multi-sucursal | 🔲 Pendiente | 0% |

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

### Dependencias nuevas probablemente necesarias
- `xlsx` o `exceljs` — exportación Excel
- `otpauth` — 2FA TOTP
- `firebase-admin` o `web-push` — notificaciones push
- `resend` o `nodemailer` — emails transaccionales
- `twilio` — SMS y WhatsApp
- `qrcode` — generación de QR codes (si no existe)
