import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { admin } from 'better-auth/plugins'
import { db } from '#/shared/db/index.ts'
import * as schema from '#/shared/db/schema/index.ts'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 4,
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'TRAINER',
        input: false,
      },
      documentNumber: {
        type: 'string',
        required: false,
      },
      phone: {
        type: 'string',
        required: false,
      },
      address: {
        type: 'string',
        required: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const roleMap: Record<string, string> = {
            user: 'TRAINER',
            admin: 'ADMIN',
          }
          const mappedRole = roleMap[user.role as string] ?? user.role ?? 'TRAINER'
          return { data: { ...user, role: mappedRole } }
        },
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  plugins: [admin()],
})

export type Session = typeof auth.$Infer.Session
