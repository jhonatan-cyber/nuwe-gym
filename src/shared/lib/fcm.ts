import { db } from '#/shared/db/index.ts'
import { settings } from '#/shared/db/schema/settings.ts'

let admin: any = null

async function getAdmin() {
  if (admin) return admin

  const row = await db.select().from(settings).limit(1)
  const serviceAccountJson = row[0]?.firebaseServiceAccount

  if (!serviceAccountJson) {
    throw new Error('Firebase service account no configurado en Settings')
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountJson)
    const firebaseAdmin = await import('firebase-admin')

    if (!firebaseAdmin.apps.length) {
      firebaseAdmin.initializeApp({
        credential: firebaseAdmin.credential.cert(serviceAccount),
      })
    }

    admin = firebaseAdmin
    return admin
  } catch (err) {
    throw new Error(
      `Error al inicializar Firebase Admin: ${err instanceof Error ? err.message : String(err)}`,
    )
  }
}

export interface PushNotificationPayload {
  title: string
  body: string
  data?: Record<string, string>
}

/**
 * Send a push notification to a single device token
 */
export async function sendPushToToken(
  token: string,
  payload: PushNotificationPayload,
): Promise<{ success: boolean; error?: string }> {
  try {
    const fb = await getAdmin()
    const message = {
      token,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data,
      webpush: {
        fcmOptions: {
          link: payload.data?.url || '/notifications',
        },
      },
    }

    await fb.messaging().send(message)
    return { success: true }
  } catch (err: any) {
    // Token is no longer valid (unregistered device)
    if (err?.code === 'messaging/registration-token-not-registered') {
      return { success: false, error: 'TOKEN_EXPIRED' }
    }
    return { success: false, error: String(err) }
  }
}

/**
 * Send a push notification to multiple device tokens
 * Automatically handles token expiration and returns invalid tokens
 */
export async function sendPushToMultipleTokens(
  tokens: string[],
  payload: PushNotificationPayload,
): Promise<{
  successCount: number
  failedCount: number
  invalidTokens: string[]
}> {
  if (tokens.length === 0) {
    return { successCount: 0, failedCount: 0, invalidTokens: [] }
  }

  try {
    const fb = await getAdmin()
    const message = {
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data,
      webpush: {
        fcmOptions: {
          link: payload.data?.url || '/notifications',
        },
      },
    }

    const response = await fb.messaging().sendEachForMulticast({
      tokens,
      ...message,
    })

    const invalidTokens: string[] = []
    response.responses.forEach((resp: any, idx: number) => {
      if (!resp.success) {
        const errCode = resp.error?.code
        if (
          errCode === 'messaging/registration-token-not-registered' ||
          errCode === 'messaging/invalid-registration-token'
        ) {
          invalidTokens.push(tokens[idx])
        }
      }
    })

    return {
      successCount: response.successCount,
      failedCount: response.failureCount,
      invalidTokens,
    }
  } catch (err) {
    console.error('[FCM] Error sending multicast:', err)
    return {
      successCount: 0,
      failedCount: tokens.length,
      invalidTokens: [],
    }
  }
}
