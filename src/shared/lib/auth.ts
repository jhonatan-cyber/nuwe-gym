import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { admin, twoFactor } from 'better-auth/plugins'
import { createAccessControl } from 'better-auth/plugins/access'
import { db } from '#/shared/db/index.ts'
import * as schema from '#/shared/db/schema/index.ts'
import { sendEmail } from '#/shared/lib/email.ts'

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
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: 'Restablecé tu contraseña — Trainix',
        html: `
          <h2>Restablecé tu contraseña</h2>
          <p>Hola <strong>${user.name || 'usuario'}</strong>,</p>
          <p>Hiciste una solicitud para restablecer tu contraseña.</p>
          <p>Hacé clic en el siguiente enlace para crear una nueva:</p>
          <a href="${url}" style="display:inline-block;padding:12px 24px;background:#000;color:#fff;text-decoration:none;border-radius:8px;margin:16px 0;">Restablecer contraseña</a>
          <p style="color:#666;font-size:12px;">Si no solicitaste esto, ignorá este mensaje.</p>
          <hr>
          <p style="color:#666;font-size:12px;">Trainix</p>
        `,
      })
    },
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
        async sendOTP({ user, otp }) {
          // For TOTP we don't need email OTP; TOTP uses authenticator apps
          console.log(`[2FA] OTP for ${user.email}: ${otp}`)
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
