# GymManager POS — Roadmap de Features Pendientes

> Generado: 2026-05-20 | Estado: ✅ Fase 1 ✓ | Fase 2 ✓ | Fase 3 ✓ — COMPLETADO

---

## Fase 1 — Alta Prioridad (Core del negocio) ✓ COMPLETADA

### 1.1 Reportes ✅ COMPLETADO
- [x] **Reporte financiero mensual** — ingresos membresías + POS, egresos, balance, gráfico barras
- [x] **Reporte de asistencia** — check-ins por día, gráfico de línea, total y promedio
- [x] **Reporte de ventas** — ventas por producto, top 5, gráfico de torta
- [x] **Reporte de socios** — activos, inactivos, nuevos, bajas, gráfico de torta
- [x] **Date range picker** — presets Hoy/Semana/Mes/Año + personalizado
- [x] **Exportar a CSV** — desde el mismo reporte (datos tabulares)
- [x] **Exportar a PDF** — botón con print CSS optimizado
- [x] **Exportar a Excel/CSV** — datos tabulares desde cada reporte

### 1.2 Configuración ✅ COMPLETADO
- [x] **Settings del gimnasio** — nombre, dirección, teléfono, email
- [x] **Configuración de impuestos** — tasa de IVA/impuestos
- [x] **Configuración de moneda** — símbolo, código, decimales
- [x] **Configuración de notificaciones** — días vencimiento, stock mínimo, auto-renew
- [x] **Tabbed UI** — General / Facturación / Notificaciones / Horarios
- [x] **Logo del gimnasio** — upload con preview y base64
- [x] **Horarios** — apertura/cierre + toggles por día

### 1.3 Renovaciones ✅ COMPLETADO
- [x] **Workflow de renovación** — flujo guiado con diálogo paso a paso
- [x] **Próximos a vencer** — tabla con filtro de días, acción rápida
- [x] **Vencidas** — tabla con días de atraso, acción rápida
- [x] **Diálogo de renovación** — selector de plan, método de pago, monto, notas
- [x] **Transacción completa** — crea suscripción + pago + movimiento de caja
- [x] **Renovación automática** — server function processAutoRenewals
- [x] **Historial por socio** — detail dialog con membresías + pagos
- [x] **Alertas de vencimiento** — card en dashboard con count y link

### 1.4 Exportar datos ✅ COMPLETADO
- [x] **Exportar socios** — CSV con filtro por estado (ACTIVO/INACTIVO/TODOS)
- [x] **Exportar ventas** — CSV con filtro por período
- [x] **Exportar pagos** — CSV con filtro por período
- [x] **Exportar check-ins** — CSV con filtro por período
- [x] **UI con cards** — cada exportación con su propia card y estado loading

---

## Fase 2 — Media Prioridad (Operaciones) ✓ COMPLETADA

### 2.1 Clases y Horarios ✅
- [x] **Tabla `classes`** — schema con name, description, color, capacity
- [x] **Tabla `class_schedules`** — dayOfWeek, startTime, endTime, room
- [x] **Tabla `class_bookings`** — booking con status (CONFIRMED, CANCELLED, ATTENDED)
- [x] **CRUD de clases** — crear, editar, eliminar con colores
- [x] **Calendario semanal** — grilla Lunes a Domingo 06-22hs con bloques coloreados
- [x] **Reservas** — socios reservan con verificación de cupo
- [x] **Lista de asistencia** — marcar ATTENDED desde reservas

### 2.2 Entrenadores ✅
- [x] **Tabla `trainer_profiles`** — userId, specialty, bio, commissionRate, isActive
- [x] **Tabla `trainer_assignments`** — asignación socio → trainer
- [x] **Tabla `trainer_availability`** — disponibilidad semanal por trainer
- [x] **Asignación de socios** — CRUD de asignaciones
- [x] **Vista Trainer** — "Mis Socios" para rol TRAINER
- [x] **Vista Admin** — tabs Entrenadores + Asignaciones con CRUD completo

### 2.3 Notificaciones ✅
- [x] **Schema `notifications`** — type enum + tabla con referenceId, isRead
- [x] **Sistema in-app** — cards por tipo con iconos y colores
- [x] **Campana en header** — badge con count + dropdown últimas 5
- [x] **Generación automática** — vencimientos + stock bajo
- [x] **Marcar leídas** — individual o todas
- [x] **Página dedicada** — lista completa con estados

### 2.4 Congelar membresía ✅
- [x] **Tabla `membership_freezes`** — subscriptionId, memberId, fechas, reason, resumedAt
- [x] **Congelar suscripción** — dialog con fecha y motivo
- [x] **Recálculo de fecha** — endDate se extiende por días congelados
- [x] **Reanudación anticipada** — resume con ajuste de fechas
- [x] **Historial por socio** — tabla de congelamientos pasados
- [x] **Validaciones** — sin overlaps, solo ACTIVE

### 2.5 Audit Logs ✅
- [x] **Tabla `audit_logs`** — action enum + entity enum + jsonb details
- [x] **Utilidad `createAuditLog()`** — fire-and-forget, try/catch
- [x] **Vista de logs** — tabla paginada con filtros (acción, entidad, usuario, fechas)
- [x] **Stats cards** — totales hoy/semana/mes
- [x] **Detail dialog** — ver JSON de detalles
- [x] **ADMIN only** — acceso exclusivo

---

## Fase 3 — Baja Prioridad (Nice to have) ✓ COMPLETADA

### 3.1 Códigos QR / Barcode ✅
- [x] **Generar QR por socio** — token UUID + QR code con librería qrcode
- [x] **Escáner en check-in** — ruta pública /qr-checkin con input de token
- [x] **Imprimir credenciales** — diálogo con print CSS para tarjeta del socio
- [x] **Gestión de QR** — página con search, generar, listar estados

### 3.2 Fotos de socios ✅
- [x] **Upload de foto** — FileReader → base64 → DB
- [x] **Preview en edición** — avatar con preview antes de guardar
- [x] **Foto en lista** — thumbnail en tabla de socios
- [x] **Foto en check-in** — mostrar foto del socio al buscar

### 3.3 Multi-sucursal ✅
- [x] **Tabla `branches`** — sucursales con datos de contacto y horarios
- [x] **Tabla `user_branches`** — asignación usuario → sucursal
- [x] **`branchId` en tablas clave** — members, products, sales, checkIns, cashRegister
- [x] **Selector en header** — dropdown persistente con localStorage
- [x] **CRUD de sucursales** — ADMIN only

### 3.4 Backup / Restore ✅
- [x] **Exportar DB** — JSON con todas las tablas, paginado (1000/batch)
- [x] **Importar DB** — validación + preview + transacción con orden de dependencias
- [x] **Estadísticas** — counts por tabla + tamaño estimado
- [x] **Auto-backup config** — toggle + frecuencia (diario/semanal/mensual)
- [x] **UI completa** — 3 secciones (Export, Import, Auto)

---

## Estimación de esfuerzo

| Fase | Features | Complejidad | Estimación |
|------|----------|-------------|------------|
| 1 | 4 features | Media | 2-3 semanas |
| 2 | 5 features | Alta | 4-5 semanas |
| 3 | 4 features | Media-Alta | 3-4 semanas |

---

## Dependencias

```
Fase 1 (Reportes, Config, Renovaciones, Export)
  ↓
Fase 2 (Clases, Trainers, Notificaciones, Freezes, Audit)
  ↓
Fase 3 (QR, Fotos, Multi-sucursal, Backup)
```

**Fase 1 es bloqueante para Fase 2** — las notificaciones necesitan configuración, las clases necesitan settings.
**Fase 2 es bloqueante para Fase 3** — QR necesita socios con fotos, multi-sucursal necesita audit logs.

---

## Criterios de aceptación por feature

Cada feature debe incluir:
1. Schema de base de datos (Drizzle ORM)
2. Server functions (createServerFn con requireRole)
3. Page component con CRUD completo
4. Route wrapper en src/routes/_authed/
5. Nav item en sidebar con permisos
6. Validación de formularios (zod)
7. Estados: loading, error, empty
8. Búsqueda y filtros donde aplique
9. Paginación donde aplique
10. Responsive design
