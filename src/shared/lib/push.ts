// ponytail: lazy init — web-push is server-only, guards against client bundle leakage
let _webPush: typeof import('web-push') | null = null

async function getWebPush() {
  if (!_webPush) {
    _webPush = await import('web-push')
    _webPush.setVapidDetails(
      'mailto:admin@nuwegym.com',
      process.env.VITE_VAPID_PUBLIC_KEY ?? '',
      process.env.VAPID_PRIVATE_KEY ?? '',
    )
  }
  return _webPush
}

export interface PushPayload {
  title: string
  body: string
  data?: Record<string, string>
}

export async function sendPushToToken(
  subscriptionJson: string,
  payload: PushPayload,
): Promise<{ success: boolean; error?: string }> {
  try {
    const wp = await getWebPush()
    const subscription = JSON.parse(subscriptionJson) as { endpoint: string; keys: { auth: string; p256dh: string } }
    await wp.sendNotification(subscription, JSON.stringify(payload), {
      TTL: 86400, // 24 hours
    })
    return { success: true }
  } catch (err: any) {
    if (err.statusCode === 410 || err.statusCode === 404) {
      // ponytail: subscription expired/unregistered; caller removes invalid tokens
      return { success: false, error: 'SUBSCRIPTION_EXPIRED' }
    }
    return { success: false, error: String(err) }
  }
}

export async function sendPushToMultipleTokens(
  subscriptionJsons: string[],
  payload: PushPayload,
): Promise<{
  successCount: number
  failedCount: number
  invalidTokens: string[]
}> {
  if (subscriptionJsons.length === 0) {
    return { successCount: 0, failedCount: 0, invalidTokens: [] }
  }

  const invalidTokens: string[] = []
  let successCount = 0
  let failedCount = 0

  for (const subJson of subscriptionJsons) {
    const result = await sendPushToToken(subJson, payload)
    if (result.success) {
      successCount++
    } else {
      failedCount++
      if (result.error === 'SUBSCRIPTION_EXPIRED') {
        invalidTokens.push(subJson)
      }
    }
  }

  return { successCount, failedCount, invalidTokens }
}
