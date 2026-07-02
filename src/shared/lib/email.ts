import { Resend } from 'resend'
import { db } from '#/shared/db/index.ts'
import { settings } from '#/shared/db/schema/settings.ts'

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string | string[]
  subject: string
  html: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const row = await db.select().from(settings).limit(1)
    const apiKey = row[0]?.resendApiKey
    if (!apiKey) return { success: false, error: 'Resend API key no configurada' }

    const from = row[0]?.emailFrom || 'notificaciones@gimnasio.com'
    const resend = new Resend(apiKey)

    const { error } = await resend.emails.send({ from, to, subject, html })
    if (error) return { success: false, error: error.message }

    return { success: true }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

export function expirationEmailHtml({
  memberName,
  endDate,
  daysUntilExpiry,
}: {
  memberName: string
  endDate: string
  daysUntilExpiry: number
}): string {
  return `
    <h2>Vencimiento de Membresía</h2>
    <p>Hola <strong>${memberName}</strong>,</p>
    <p>Tu membresía vence el <strong>${new Date(endDate).toLocaleDateString('es-AR')}</strong> (${daysUntilExpiry} día${daysUntilExpiry !== 1 ? 's' : ''}).</p>
    <p>Acercate a recepción para renovarla.</p>
    <hr>
    <p style="color:#666;font-size:12px;">Gimnasio</p>
  `
}

export function classReminderEmailHtml({
  memberName,
  className,
  startTime,
  room,
}: {
  memberName: string
  className: string
  startTime: string
  room?: string | null
}): string {
  return `
    <h2>Recordatorio de Clase</h2>
    <p>Hola <strong>${memberName}</strong>,</p>
    <p>Tenés una clase de <strong>${className}</strong> hoy a las <strong>${startTime}</strong>${room ? ` en <strong>${room}</strong>` : ''}.</p>
    <p>¡Te esperamos!</p>
    <hr>
    <p style="color:#666;font-size:12px;">Gimnasio</p>
  `
}

export function inactiveEmailHtml({
  memberName,
  daysInactive,
}: {
  memberName: string
  daysInactive: number
}): string {
  return `
    <h2>Te extrañamos 💪</h2>
    <p>Hola <strong>${memberName}</strong>,</p>
    <p>Hace ${daysInactive} días que no venís al gimnasio. ¡Te estamos esperando!</p>
    <p>Recordá que tu membresía sigue activa. Pasate cuando quieras.</p>
    <hr>
    <p style="color:#666;font-size:12px;">Gimnasio</p>
  `
}

export function birthdayEmailHtml({
  memberName,
}: {
  memberName: string
}): string {
  return `
    <h2>🎂 ¡Feliz cumpleaños!</h2>
    <p>Hola <strong>${memberName}</strong>,</p>
    <p>Todo el equipo del gimnasio te desea un feliz cumpleaños. ¡Que tengas un día increíble!</p>
    <p>Veni a celebrar con nosotros y disfrutá de tu día 🎉</p>
    <hr>
    <p style="color:#666;font-size:12px;">Gimnasio</p>
  `
}

export function expiredEmailHtml({
  memberName,
  daysOverdue,
}: {
  memberName: string
  daysOverdue: number
}): string {
  return `
    <h2>Membresía Expirada</h2>
    <p>Hola <strong>${memberName}</strong>,</p>
    <p>Tu membresía expiró hace ${daysOverdue} día${daysOverdue !== 1 ? 's' : ''}. ¡Renová hoy para no perder el acceso!</p>
    <hr>
    <p style="color:#666;font-size:12px;">Gimnasio</p>
  `
}
