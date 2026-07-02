import { db } from '#/shared/db/index.ts'
import { settings } from '#/shared/db/schema/settings.ts'
import twilio from 'twilio'

type SettingsRow = typeof settings.$inferSelect

function getClient(row: SettingsRow) {
  if (!row.twilioAccountSid || !row.twilioAuthToken) {
    return null
  }
  return twilio(row.twilioAccountSid, row.twilioAuthToken, { lazyLoading: true })
}

function formatWhatsAppNumber(num: string) {
  return num.startsWith('whatsapp:') ? num : `whatsapp:${num}`
}

// ── Plain text WhatsApp ──

export async function sendWhatsApp({
  to,
  body,
}: {
  to: string
  body: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const row = await db.select().from(settings).limit(1)
    const client = getClient(row[0])
    if (!client) return { success: false, error: 'Twilio no configurado' }
    const from = row[0]?.twilioWhatsAppNumber
    if (!from) return { success: false, error: 'Número de WhatsApp no configurado' }

    await client.messages.create({
      from: formatWhatsAppNumber(from),
      to: formatWhatsAppNumber(to),
      body,
    })
    return { success: true }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

// ── Template-based WhatsApp (Twilio Content API) ──

export type TemplateVariables = Record<string, string>

/**
 * Send a WhatsApp message using a Twilio Content Template.
 * If contentSid is empty or falsy, falls back to plain `body` text.
 */
export async function sendWhatsAppTemplate({
  to,
  contentSid,
  variables,
  fallbackBody,
}: {
  to: string
  contentSid: string
  variables: TemplateVariables
  fallbackBody: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    // If no SID configured, fall back to plain text
    if (!contentSid) {
      return sendWhatsApp({ to, body: fallbackBody })
    }

    const row = await db.select().from(settings).limit(1)
    const client = getClient(row[0])
    if (!client) return { success: false, error: 'Twilio no configurado' }
    const from = row[0]?.twilioWhatsAppNumber
    if (!from) return { success: false, error: 'Número de WhatsApp no configurado' }

    await client.messages.create({
      from: formatWhatsAppNumber(from),
      to: formatWhatsAppNumber(to),
      contentSid,
      contentVariables: JSON.stringify(variables),
    })
    return { success: true }
  } catch (err) {
    // If template fails (e.g., expired SID, unapproved), fall back to plain text
    try {
      return await sendWhatsApp({ to, body: fallbackBody })
    } catch {
      return { success: false, error: String(err) }
    }
  }
}

// ── Predefined template variable builders ──

export function templateVars_expiration(
  memberName: string,
  daysUntilExpiry: number,
  endDate: string,
  gymName: string,
): TemplateVariables {
  return {
    '1': memberName,
    '2': String(daysUntilExpiry),
    '3': endDate,
    '4': gymName,
  }
}

export function templateVars_expired(
  memberName: string,
  daysOverdue: number,
  gymName: string,
): TemplateVariables {
  return {
    '1': memberName,
    '2': String(daysOverdue),
    '3': gymName,
  }
}

export function templateVars_birthday(
  memberName: string,
  gymName: string,
): TemplateVariables {
  return {
    '1': memberName,
    '2': gymName,
  }
}

export function templateVars_inactive(
  memberName: string,
  daysInactive: number,
  gymName: string,
): TemplateVariables {
  return {
    '1': memberName,
    '2': String(daysInactive),
    '3': gymName,
  }
}

export function templateVars_classReminder(
  memberName: string,
  className: string,
  startTime: string,
  room: string,
  gymName: string,
): TemplateVariables {
  return {
    '1': memberName,
    '2': className,
    '3': startTime,
    '4': room,
    '5': gymName,
  }
}

// ── Plain text SMS (unchanged) ──

export async function sendSMS({
  to,
  body,
}: {
  to: string
  body: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const row = await db.select().from(settings).limit(1)
    const accountSid = row[0]?.twilioAccountSid
    const authToken = row[0]?.twilioAuthToken
    const from = row[0]?.twilioSmsNumber

    if (!accountSid || !authToken) {
      return { success: false, error: 'Twilio no configurado' }
    }
    if (!from) {
      return { success: false, error: 'Número SMS no configurado' }
    }

    const client = twilio(accountSid, authToken, { lazyLoading: true })

    await client.messages.create({
      from,
      to,
      body,
    })

    return { success: true }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}
