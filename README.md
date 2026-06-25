# NuWe Gym Manager

Sistema de gestión integral para gimnasios. Administración de miembros, membresías,
ventas POS, compras a proveedores, inventario, caja, check-ins, clases, congelamientos
y más — todo en una sola app.

## Stack

| Capa           | Tecnología                                                                        |
| -------------- | --------------------------------------------------------------------------------- |
| **Framework**  | [TanStack Start](https://tanstack.com/start) (SSR + Server Functions)             |
| **Router**     | [TanStack Router](https://tanstack.com/router) (file-based)                       |
| **UI**         | [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) |
| **Auth**       | [Better Auth](https://www.better-auth.com) (admin plugin)                         |
| **DB**         | PostgreSQL + [Drizzle ORM](https://orm.drizzle.team)                              |
| **Validation** | [Zod](https://zod.dev)                                                            |
| **Tests**      | [Vitest](https://vitest.dev/)                                                     |
| **E2E Types**  | [T3 Env](https://env.t3.gg)                                                       |

## Requisitos

- Node.js 20+
- PostgreSQL 16+

## Instalación

```bash
git clone <repo>
cd nuwe-gym
bun install
```

### Entorno

Copiar `.env.example` a `.env.local` y configurar:

```env
DATABASE_URL=postgres://user:pass@localhost:5432/nuwe-gym
BETTER_AUTH_SECRET=<generar con: npx -y @better-auth/cli secret>
BETTER_AUTH_URL=http://localhost:3000
```

### Base de datos

```bash
# Push del schema a la DB
npx drizzle-kit push

# Seed (crea admin por defecto)
npx tsx src/shared/db/seed.ts
```

## Desarrollo

```bash
bun run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

**Admin por defecto:** `admin@gym.local` / `Admin123*`

## Testing

El proyecto usa **Vitest** con una base de datos PostgreSQL dedicada.

```bash
# Configurar DB de test
# Asegurate de tener PostgreSQL corriendo y configurar .env.test

# Correr todos los tests
bun run test

# En modo watch
bun run test:watch

# Archivo específico
npx vitest run src/__tests__/features/core-business.test.ts
```

> ⚠️ Los tests usan `fileParallelism: false` para evitar race conditions.
> Cada archivo limpia la DB con `cleanDatabase()` al iniciar (`beforeAll`).

### Tests incluidos

| Archivo               | Tests   | Qué cubre                                       |
| --------------------- | ------- | ----------------------------------------------- |
| `core-business`       | 17      | CRUD miembros, suscripciones, pagos, check-ins  |
| `operations`          | 18      | POS, productos, inventario, caja                |
| `scheduling`          | 9       | Clases, horarios, reservas                      |
| `membership-freezes`  | 5       | Congelamientos de membresías                    |
| `suppliers-purchases` | 7       | Proveedores y compras                           |
| `users`               | 4       | Creación y gestión de usuarios staff            |
| `business-rules`      | 11      | Reglas de negocio, constraints, FKs             |
| +16 más               | 96      | Dashboard, reportes, export, QR, settings, etc. |
| **Total**             | **170** |                                                 |

### Base de datos de test

Los tests se conectan a PostgreSQL via `DATABASE_URL`. El schema se sincroniza con:

```bash
npx drizzle-kit push
```

## Estructura del proyecto

```
src/
├── __tests__/            # Tests (Vitest)
│   ├── factories.ts      # Factories + cleanDatabase
│   ├── features/         # Tests por feature
│   ├── components/       # Tests de componentes
│   └── lib/              # Tests de utilidades
├── features/             # Vertical Slices
│   ├── members/          # Miembros
│   ├── subscriptions/    # Suscripciones
│   ├── sales/            # POS / Ventas
│   ├── purchases/        # Compras
│   ├── classes/          # Clases
│   ├── inventory/        # Inventario
│   ├── cash-register/    # Caja (apertura/cierre)
│   ├── membership-freezes/ # Congelamientos
│   ├── users/            # Staff (admin)
│   ├── suppliers/        # Proveedores
│   └── ...               # Reports, dashboard, etc.
├── shared/
│   ├── db/               # Schema Drizzle + seed
│   └── lib/              # Auth, permisos, audit, utilidades
├── routes/               # TanStack Router (file-based)
└── components/           # Componentes compartidos (shadcn/ui)
```

## Scripts

| Comando                  | Descripción             |
| ------------------------ | ----------------------- |
| `bun run dev`            | Dev server              |
| `bun run build`          | Build producción        |
| `bun run test`           | Tests                   |
| `bun run lint`           | ESLint                  |
| `bun run format`         | Prettier                |
| `bun run check`          | Lint + format check     |
| `npx drizzle-kit push`   | Push schema a DB        |
| `npx drizzle-kit studio` | Drizzle Studio (GUI DB) |

## Licencia

Uso interno.
