import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { admin, twoFactor } from 'better-auth/plugins'
import { createAccessControl } from 'better-auth/plugins/access'
import { db } from '#/shared/db/index.ts'
import * as schema from '#/shared/db/schema/index.ts'

const ac = createAccessControl({
  user: [
    'create',
    'list',
    'set-role',
    'ban',
    'impersonate',
    'delete',
    'set-password',
    'get',
    'update',
  ],
  session: ['list', 'revoke', 'delete'],
})

const adminAc = ac.newRole({
  user: [
    'create',
    'list',
    'set-role',
    'ban',
    'impersonate',
    'delete',
    'set-password',
    'get',
    'update',
  ],
  session: ['list', 'revoke', 'delete'],
})

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
          const mappedRole = roleMap[user.role as string] ?? user.role
          return { data: { ...user, role: mappedRole } }
        },
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  plugins: [
    twoFactor({
      otpOptions: {
        async sendOTP({ email, otp }) {
          // For TOTP we don't need email OTP; TOTP uses authenticator apps
          console.log(`[2FA] OTP for ${email}: ${otp}`)
        },
      },
    }),
    admin({
      adminRoles: ['ADMIN'],
      roles: {
        ADMIN: adminAc,
      },
    }),
  ],
})

export type Session = typeof auth.$Infer.Session
