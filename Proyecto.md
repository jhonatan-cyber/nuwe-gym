Actúa como un arquitecto de software y desarrollador full-stack senior.

Quiero que construyas un MVP funcional, ordenado y escalable de un sistema web moderno de administración para gimnasios, incluyendo un módulo POS para compra/venta de suplementos, inventario y caja.

Debes trabajar directamente en el repositorio actual. Si el proyecto está vacío, crea toda la base desde cero. Si ya existe código, primero analiza la estructura actual y adapta la implementación sin romper convenciones existentes.

==================================================
1. OBJETIVO GENERAL DEL SISTEMA
==================================================

Construir una aplicación full-stack llamada provisionalmente:

"GymManager POS"

El sistema debe permitir a un gimnasio:

1. Administrar socios/clientes.
2. Crear y gestionar planes de membresía.
3. Registrar suscripciones activas, vencidas o canceladas.
4. Registrar pagos de membresías.
5. Controlar el ingreso/check-in de socios.
6. Gestionar productos de tienda, especialmente suplementos.
7. Registrar compras a proveedores.
8. Vender productos mediante un POS moderno.
9. Controlar inventario con movimientos trazables.
10. Gestionar apertura y cierre de caja.
11. Mostrar un dashboard administrativo con métricas clave.

==================================================
2. STACK TECNOLÓGICO OBLIGATORIO
==================================================

Usar estrictamente:

- TanStack Start
- React
- TypeScript
- PostgreSQL
- Drizzle ORM
- Zod para validaciones
- Tailwind CSS
- shadcn/ui o componentes UI equivalentes limpios y reutilizables
- TanStack Table para tablas complejas
- TanStack Query cuando corresponda
- Sistema de autenticación completo
- Server functions / acciones del servidor propias del framework

Evitar:
- Express separado salvo que sea absolutamente necesario.
- ORM diferente de Drizzle.
- SQL manual disperso innecesariamente.
- Código monolítico en un solo archivo.
- Componentes gigantes sin separación de responsabilidades.

==================================================
3. PRINCIPIOS DE ARQUITECTURA
==================================================

La aplicación debe tener una arquitectura limpia y modular.

Separar claramente:

- UI / páginas
- Componentes reutilizables
- Validadores
- Servicios o lógica de dominio
- Acceso a datos
- Esquemas de base de datos
- Autorización y autenticación
- Utilidades compartidas

Proponer una estructura similar a:

src/
  routes/
  components/
    ui/
    layout/
    forms/
    tables/
  db/
    schema/
    migrations/
    index.ts
  features/
    auth/
    dashboard/
    members/
    membership-plans/
    subscriptions/
    membership-payments/
    check-ins/
    products/
    categories/
    suppliers/
    purchases/
    sales/
    inventory/
    cash-register/
  lib/
    auth/
    validators/
    permissions/
    formatters/
    utils/
  server/
    actions/
    services/

Puedes ajustar la estructura si TanStack Start recomienda una organización más adecuada, pero debe mantenerse modular y fácil de escalar.

==================================================
4. ROLES Y AUTORIZACIÓN
==================================================

Implementar roles básicos:

1. ADMIN
2. RECEPTIONIST
3. TRAINER

Permisos recomendados:

ADMIN:
- Acceso total.
- CRUD completo de usuarios internos.
- CRUD de planes, socios, productos, categorías, proveedores.
- Acceso a reportes.
- Acceso a caja, compras, ventas e inventario.

RECEPTIONIST:
- Registrar socios.
- Registrar pagos de membresías.
- Registrar check-in.
- Operar POS.
- Abrir/cerrar caja si se autoriza.
- No administrar usuarios ni configuración crítica.

TRAINER:
- Consultar socios.
- Ver información básica de membresías.
- No registrar ventas ni pagos.
- No acceder a caja ni reportes financieros.

Implementar guards o middleware de autorización por rol.

==================================================
5. MÓDULO DE AUTENTICACIÓN
==================================================

Crear autenticación completa con:

- Login por email y contraseña.
- Hash seguro de contraseñas.
- Sesión persistente.
- Protección de rutas privadas.
- Redirección al login si no está autenticado.
- Logout.
- Seed inicial con usuario admin.

Usuario inicial sugerido:
- email: admin@gym.local
- password: Admin123*
- role: ADMIN

IMPORTANTE:
La contraseña debe almacenarse hasheada, jamás en texto plano.

==================================================
6. MÓDULO DE SOCIOS
==================================================

Entidad: members

Campos:
- id
- fullName
- documentNumber
- phone
- email
- birthDate nullable
- address nullable
- emergencyContactName nullable
- emergencyContactPhone nullable
- photoUrl nullable
- status: ACTIVE | INACTIVE | SUSPENDED
- createdAt
- updatedAt

Funcionalidades:
- Listar socios con paginación, búsqueda y filtros.
- Crear socio.
- Editar socio.
- Ver detalle de socio.
- Suspender/reactivar socio.
- Mostrar la membresía actual si existe.
- Mostrar historial de pagos.
- Mostrar historial de asistencias.
- Mostrar ventas asociadas si compró productos.

Validaciones:
- Nombre requerido.
- Teléfono requerido o configurable.
- Email válido si se proporciona.
- Documento único si se proporciona.

==================================================
7. MÓDULO DE PLANES DE MEMBRESÍA
==================================================

Entidad: membership_plans

Campos:
- id
- name
- description nullable
- durationDays
- price
- isActive
- createdAt
- updatedAt

Ejemplos:
- Mensual - 30 días
- Trimestral - 90 días
- Semestral - 180 días
- Anual - 365 días

Funcionalidades:
- CRUD completo.
- Activar/desactivar planes.
- Listado con búsqueda.
- Evitar eliminar planes con historial relacionado; usar desactivación lógica.

Validaciones:
- Nombre obligatorio.
- Duración mayor a 0.
- Precio mayor o igual a 0.

==================================================
8. MÓDULO DE SUSCRIPCIONES / MEMBRESÍAS
==================================================

Entidad: subscriptions

Campos:
- id
- memberId
- planId
- startDate
- endDate
- status: ACTIVE | EXPIRED | CANCELED
- notes nullable
- createdAt
- updatedAt

Reglas:
- Al crear una suscripción, calcular endDate en función de durationDays del plan.
- Puede haber historial de suscripciones, pero solo una suscripción activa por socio.
- Si una suscripción vence por fecha, debe mostrarse como vencida en consultas.
- Permitir renovación de membresía.
- La renovación puede iniciar desde:
  - hoy si la anterior ya venció
  - el día siguiente a la fecha de fin si aún está activa
- Registrar correctamente el pago asociado.

Funcionalidades:
- Asignar plan a socio.
- Renovar membresía.
- Cancelar membresía.
- Ver historial.
- Filtro por activas, vencidas y canceladas.
- Alertar membresías que vencerán en los próximos 7 días.

==================================================
9. MÓDULO DE PAGOS DE MEMBRESÍA
==================================================

Entidad: membership_payments

Campos:
- id
- memberId
- subscriptionId
- amount
- paymentMethod: CASH | QR | TRANSFER | CARD
- paymentDate
- notes nullable
- cashSessionId nullable
- createdByUserId
- createdAt

Funcionalidades:
- Registrar pago al crear o renovar membresía.
- Ver historial de pagos por socio.
- Reporte por rango de fechas.
- Registrar movimiento de caja cuando el pago corresponda a una caja abierta.
- Mostrar total recaudado por membresías.

Validaciones:
- Monto mayor o igual a 0.
- Método de pago obligatorio.

==================================================
10. MÓDULO DE CHECK-IN / CONTROL DE ACCESO
==================================================

Entidad: check_ins

Campos:
- id
- memberId
- checkedInAt
- registeredByUserId
- resultStatus: ALLOWED | DENIED_EXPIRED | DENIED_INACTIVE | DENIED_SUSPENDED
- notes nullable

Funcionalidades:
- Buscar socio por nombre, documento o teléfono.
- Registrar ingreso.
- Antes de permitir el ingreso:
  - verificar socio activo
  - verificar que tenga membresía activa
- Mostrar visualmente si puede ingresar o no.
- Guardar check-in permitido o denegado.
- Historial diario y por socio.
- Dashboard con asistencias del día.

==================================================
11. MÓDULO DE CATEGORÍAS DE PRODUCTOS
==================================================

Entidad: product_categories

Campos:
- id
- name
- description nullable
- isActive
- createdAt
- updatedAt

Funcionalidades:
- CRUD completo.
- Activar/desactivar.
- Evitar duplicados por nombre.

Ejemplos:
- Proteínas
- Creatinas
- Vitaminas
- Bebidas
- Snacks fitness
- Accesorios

==================================================
12. MÓDULO DE PRODUCTOS
==================================================

Entidad: products

Campos:
- id
- sku
- barcode nullable
- name
- description nullable
- categoryId
- purchasePrice
- salePrice
- stockCurrent
- stockMinimum
- imageUrl nullable
- isActive
- createdAt
- updatedAt

Funcionalidades:
- CRUD completo.
- Búsqueda por nombre, SKU o código de barras.
- Filtro por categoría.
- Alertas de stock bajo.
- No permitir stock negativo por venta.
- Mostrar margen estimado:
  salePrice - purchasePrice
- Mostrar ganancia porcentual opcional.

Validaciones:
- SKU único.
- Nombre obligatorio.
- Precio de compra y venta >= 0.
- Stock mínimo >= 0.

==================================================
13. MÓDULO DE PROVEEDORES
==================================================

Entidad: suppliers

Campos:
- id
- name
- phone nullable
- email nullable
- address nullable
- notes nullable
- isActive
- createdAt
- updatedAt

Funcionalidades:
- CRUD completo.
- Búsqueda por nombre.
- Activar/desactivar proveedor.

==================================================
14. MÓDULO DE COMPRAS A PROVEEDORES
==================================================

Entidad: purchases

Campos:
- id
- supplierId
- purchaseNumber
- subtotal
- total
- notes nullable
- purchasedAt
- createdByUserId
- createdAt

Entidad: purchase_items

Campos:
- id
- purchaseId
- productId
- quantity
- unitCost
- subtotal

Reglas:
- Una compra puede contener muchos productos.
- Al registrar compra:
  - incrementar stock de cada producto
  - crear movimientos de inventario tipo PURCHASE
- Calcular subtotal y total automáticamente.
- El costo de compra usado en la compra puede actualizar el purchasePrice actual del producto, o dejarse como decisión explícita documentada.

Funcionalidades:
- Crear compra.
- Ver historial de compras.
- Ver detalle.
- Filtrar por proveedor y fechas.

==================================================
15. MÓDULO POS DE VENTAS
==================================================

Entidad: sales

Campos:
- id
- saleNumber
- memberId nullable
- customerName nullable
- userId
- subtotal
- discount
- total
- paymentMethod: CASH | QR | TRANSFER | CARD | MIXED opcional
- status: COMPLETED | CANCELED
- soldAt
- cashSessionId nullable
- createdAt

Entidad: sale_items

Campos:
- id
- saleId
- productId
- quantity
- unitPrice
- subtotal

Funcionalidades POS:
- Interfaz rápida y moderna.
- Buscar producto por nombre, SKU o código de barras.
- Agregar al carrito.
- Aumentar/disminuir cantidad.
- Eliminar productos del carrito.
- Calcular subtotal automáticamente.
- Aplicar descuento general.
- Calcular total.
- Seleccionar método de pago.
- Asociar venta a socio, opcional.
- Registrar venta.
- Descontar stock.
- Crear movimientos de inventario tipo SALE.
- Crear movimiento de caja si existe caja abierta.
- Mostrar comprobante o vista resumen luego de la venta.

Reglas críticas:
- No vender si no hay stock suficiente.
- Validar la venta completa en servidor.
- La actualización de stock debe ser transaccional.
- La creación de la venta, detalle, movimientos de inventario y caja debe ser consistente y atómica en la medida de lo posible.

==================================================
16. MÓDULO DE INVENTARIO
==================================================

Entidad: inventory_movements

Campos:
- id
- productId
- movementType: PURCHASE | SALE | MANUAL_ADJUSTMENT | RETURN | LOSS
- quantity
- previousStock
- newStock
- referenceType nullable
- referenceId nullable
- notes nullable
- createdByUserId
- createdAt

Funcionalidades:
- Registrar movimientos automáticos desde compras y ventas.
- Permitir ajuste manual de stock:
  - aumentar
  - disminuir
  - dejar cantidad exacta
- Guardar motivo del ajuste.
- Historial de movimientos por producto.
- Filtros por tipo de movimiento y fechas.

==================================================
17. MÓDULO DE CAJA
==================================================

Entidad: cash_register_sessions

Campos:
- id
- openedByUserId
- closedByUserId nullable
- openingAmount
- expectedClosingAmount nullable
- actualClosingAmount nullable
- difference nullable
- openedAt
- closedAt nullable
- status: OPEN | CLOSED
- notes nullable

Entidad: cash_movements

Campos:
- id
- cashSessionId
- movementType: INCOME | EXPENSE
- sourceType: MEMBERSHIP_PAYMENT | SALE | MANUAL | OTHER
- sourceId nullable
- amount
- paymentMethod: CASH | QR | TRANSFER | CARD
- description nullable
- createdAt

Reglas:
- Solo puede existir una caja abierta por sucursal o de manera global para el MVP.
- Registrar apertura de caja con monto inicial.
- Registrar automáticamente en caja:
  - pagos de membresía
  - ventas POS
- Permitir egresos manuales.
- Al cerrar caja:
  - calcular monto esperado
  - registrar monto real
  - calcular diferencia
- Mostrar resumen por método de pago.

Funcionalidades:
- Abrir caja.
- Ver caja actual.
- Registrar egreso.
- Cerrar caja.
- Historial de cajas.
- Reporte de movimientos de caja.

==================================================
18. DASHBOARD ADMINISTRATIVO
==================================================

Crear dashboard con tarjetas e indicadores.

Indicadores mínimos:

Gimnasio:
- Total de socios.
- Socios activos.
- Membresías activas.
- Membresías vencidas.
- Membresías por vencer en 7 días.
- Check-ins del día.

Finanzas:
- Ingresos por membresías del mes.
- Ingresos por ventas POS del mes.
- Ventas del día.
- Estado de caja: abierta/cerrada.

Inventario:
- Productos con stock bajo.
- Producto más vendido del período.
- Total de productos activos.

Opcional si queda tiempo:
- Gráficos simples por mes o rango.

==================================================
19. BASE DE DATOS Y RELACIONES
==================================================

Crear los schemas Drizzle de todas las tablas descritas.

Relaciones mínimas:
- users -> roles
- subscriptions -> members
- subscriptions -> membership_plans
- membership_payments -> members
- membership_payments -> subscriptions
- check_ins -> members
- check_ins -> users
- products -> product_categories
- purchases -> suppliers
- purchase_items -> purchases
- purchase_items -> products
- sales -> users
- sales -> members nullable
- sale_items -> sales
- sale_items -> products
- inventory_movements -> products
- inventory_movements -> users
- cash_register_sessions -> users
- cash_movements -> cash_register_sessions

Implementar:
- Migraciones.
- Seeds mínimos:
  - roles
  - usuario admin
  - algunos planes
  - algunas categorías de productos opcionales

==================================================
20. REGLAS DE NEGOCIO IMPORTANTES
==================================================

1. No debe haber venta POS con stock insuficiente.
2. No debe haber dos membresías activas simultáneas para el mismo socio.
3. Un pago de membresía debe vincularse a una suscripción.
4. Las ventas y compras deben modificar stock y generar movimiento de inventario.
5. Los ingresos relacionados a ventas y pagos deben generar movimiento de caja cuando haya caja abierta.
6. El cierre de caja debe calcular diferencias.
7. No eliminar físicamente datos con historial crítico; preferir desactivación lógica o restricciones.
8. Toda validación de negocio crítica debe existir en servidor, no solo en frontend.

==================================================
21. UI / UX
==================================================

Diseñar una interfaz limpia, moderna y responsive.

Elementos esperados:
- Sidebar de navegación.
- Header superior con usuario.
- Layout protegido.
- Tablas con:
  - búsqueda
  - filtros
  - acciones
  - estados visuales
- Formularios con validación clara.
- Badges de estado:
  - activo
  - vencido
  - suspendido
  - caja abierta/cerrada
- POS con diseño rápido de caja:
  - buscador de productos
  - panel de productos o autocomplete
  - carrito visible
  - resumen de cobro
  - botón de finalizar venta
- Mensajes toast para éxito y error.

==================================================
22. RUTAS PRINCIPALES
==================================================

Crear rutas similares a:

/login
/dashboard

/members
/members/new
/members/:id
/members/:id/edit

/membership-plans
/subscriptions
/membership-payments
/check-ins

/products
/product-categories
/suppliers
/purchases
/purchases/new

/pos
/sales

/inventory
/inventory/adjustments

/cash-register
/cash-register/history

/admin/users

==================================================
23. API / SERVER FUNCTIONS
==================================================

Implementar acciones/funciones de servidor para:

- Auth
- Members CRUD
- Plans CRUD
- Subscriptions CRUD/renew
- Membership payments create/list
- Check-ins create/list
- Categories CRUD
- Products CRUD
- Suppliers CRUD
- Purchases create/list/detail
- Sales create/list/detail
- Inventory movements list/adjust
- Cash register open/close/current/history
- Dashboard metrics

Cada server function debe:
- Validar input con Zod.
- Verificar permisos.
- Manejar errores de forma clara.
- Retornar tipos consistentes.

==================================================
24. TRANSACCIONES
==================================================

Usar transacciones de base de datos en operaciones críticas:

- Crear venta POS:
  - crear venta
  - crear items
  - reducir stock
  - crear movimientos de inventario
  - crear movimiento de caja

- Crear compra:
  - crear compra
  - crear items
  - aumentar stock
  - crear movimientos de inventario

- Renovar membresía con pago:
  - crear o actualizar suscripción según regla
  - registrar pago
  - registrar movimiento de caja

==================================================
25. CALIDAD DE CÓDIGO
==================================================

Exijo:
- TypeScript estricto.
- Componentes reutilizables.
- Lógica de negocio fuera de componentes.
- Nombres claros.
- Manejo explícito de estados loading, empty y error.
- Evitar duplicación.
- Utilidades de formateo para dinero y fechas.
- Código fácil de mantener.

==================================================
26. TESTS Y VERIFICACIÓN
==================================================

Agregar al menos:

- Tests básicos de reglas críticas si el entorno lo permite.
- Validación de build.
- Validación de tipos.
- Lint si está configurado.

Al finalizar debes ejecutar:
- instalación de dependencias
- migraciones
- seed
- typecheck
- build
- tests disponibles

Si algún comando falla, corrígelo.

==================================================
27. ENTREGABLES ESPERADOS
==================================================

Al terminar quiero:

1. Proyecto funcional.
2. Estructura de carpetas limpia.
3. Base de datos modelada con Drizzle.
4. Migraciones listas.
5. Seed inicial.
6. Login funcionando.
7. CRUDs principales implementados.
8. POS funcional.
9. Inventario funcional.
10. Caja funcional.
11. Dashboard funcional.
12. README completo con:
   - descripción del sistema
   - stack usado
   - variables de entorno
   - instalación
   - comandos
   - migraciones
   - seed
   - usuario admin inicial
   - módulos disponibles
   - decisiones técnicas

==================================================
28. VARIABLES DE ENTORNO
==================================================

Preparar un archivo .env.example con algo como:

DATABASE_URL=
AUTH_SECRET=
APP_URL=

Si el sistema de auth requiere variables adicionales, documentarlas.

==================================================
29. FORMA DE TRABAJO ESPERADA
==================================================

Quiero que trabajes de esta forma:

1. Analiza primero el repositorio actual.
2. Resume brevemente el plan técnico antes de modificar archivos.
3. Implementa por módulos, priorizando:
   - base del proyecto
   - auth
   - modelos de datos
   - gimnasio
   - POS
   - inventario
   - caja
   - dashboard
4. Ejecuta validaciones durante el proceso.
5. Corrige errores de build, typing o migraciones.
6. Al final entrega:
   - resumen de lo implementado
   - archivos clave creados/modificados
   - cómo ejecutar el proyecto
   - credenciales iniciales
   - tareas pendientes si quedó algo fuera

==================================================
30. CRITERIOS DE ACEPTACIÓN DEL MVP
==================================================

El MVP se considera aceptado si:

- Puedo iniciar sesión como admin.
- Puedo registrar un socio.
- Puedo crear un plan.
- Puedo asignar y renovar una membresía.
- Puedo registrar un pago.
- Puedo registrar el ingreso de un socio y ver si está habilitado.
- Puedo crear categorías y productos.
- Puedo registrar una compra a proveedor y ver aumento del stock.
- Puedo abrir caja.
- Puedo hacer una venta en el POS.
- El stock disminuye.
- La caja recibe el movimiento correspondiente.
- Puedo cerrar caja con cálculo de diferencia.
- El dashboard muestra indicadores reales desde la base de datos.
- El proyecto compila y levanta sin errores.                                                                    Empieza por la Fase 1:
- Inicialización del proyecto
- Configuración de PostgreSQL y Drizzle
- Autenticación
- Roles
- Layout base
- Dashboard vacío protegido

No avances al resto hasta dejar esta fase compilando correctamente.                      Implementa la Fase 2:
- Socios
- Planes de membresía
- Suscripciones
- Pagos de membresía
- Check-in
Con CRUDs completos, validaciones y relaciones de base de datos.                    Implementa la Fase 3:
- Categorías
- Productos
- Proveedores
- Compras
- Movimientos de inventario                         Implementa la Fase 4:
- POS de ventas
- Carrito
- Registro transaccional de venta
- Descuento de stock
- Integración con caja                              Implementa la Fase 5:
- Apertura y cierre de caja
- Movimientos de caja
- Reportes diarios
- Dashboard con métricas reales
- README final completo