import { createFileRoute } from '@tanstack/react-router'
import { db } from '#/shared/db/index.ts'
import { settings } from '#/shared/db/schema/settings.ts'
import { users } from '#/shared/db/schema/auth.ts'
import { runAutoRenewalsCore } from '#/features/renewals/server.ts'
import { createAuditLog } from '#/shared/lib/audit.ts'
import { eq } from 'drizzle-orm'

export const Route = createFileRoute('/api/cron/auto-renewals')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          // ── Validate API key ──
          const apiKey =
            request.headers.get('x-api-key') ??
            new URL(request.url).searchParams.get('api_key')
          if (!apiKey) {
            return new Response(
              JSON.stringify({ error: 'API key requerida. Enviar en header x-api-key o query param api_key' }),
              { status: 401, headers: { 'Content-Type': 'application/json' } },
            )
          }

          const settingsRows = await db.select().from(settings).limit(1)
          if (!settingsRows[0] || settingsRows[0].autoRenewSecretKey !== apiKey) {
            return new Response(
              JSON.stringify({ error: 'API key inválida' }),
              { status: 401, headers: { 'Content-Type': 'application/json' } },
            )
          }

          // ── Find first admin user for audit context ──
          const adminUser = await db.query.users.findFirst({
            where: eq(users.role, 'ADMIN'),
          })

          const systemUserId = adminUser?.id ?? 'SYSTEM'
          const result = await runAutoRenewalsCore(systemUserId)

          // ── Audit log ──
          createAuditLog({
            userId: systemUserId,
            userName: adminUser?.name ?? 'SYSTEM',
            userRole: 'ADMIN',
            action: 'RENEW',
            entityType: 'SUBSCRIPTION',
            description: `[CRON] Procesó renovaciones automáticas: ${result.renewed} suscripciones renovadas`,
          })

          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Error interno'
          return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          })
        }
      },
    },
  },
})
