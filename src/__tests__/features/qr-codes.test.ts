import { describe, it, expect, beforeAll } from 'vitest'
import { db } from '#/shared/db/index.ts'
import { members } from '#/shared/db/schema/members.ts'
import { checkIns } from '#/shared/db/schema/check-ins.ts'
import { eq, isNotNull, isNull } from 'drizzle-orm'
import { createMember, createTestUser, TEST_USER_ID, cleanDatabase } from '../factories.ts'

beforeAll(async () => { await cleanDatabase() })

describe('QR Codes', () => {
  it('should update member with qrCode and find by it', async () => {
    const m = await createMember()
    const qr = 'uuid-' + crypto.randomUUID()
    await db.update(members).set({ qrCode: qr }).where(eq(members.id, m.id))

    const found = await db.query.members.findFirst({ where: eq(members.qrCode, qr) })
    expect(found).toBeDefined()
    expect(found!.qrCode).toBe(qr)
  })

  it('should find members with QR code', async () => {
    const m1 = await createMember()
    await db.update(members).set({ qrCode: 'qr-abc' }).where(eq(members.id, m1.id))
    await createMember()

    const withQr = await db.select().from(members).where(isNotNull(members.qrCode))
    expect(withQr.length).toBeGreaterThanOrEqual(1)
  })

  it('should find members without QR code', async () => {
    await createMember()

    const withoutQr = await db.select().from(members).where(isNull(members.qrCode))
    expect(withoutQr.length).toBeGreaterThanOrEqual(1)
  })

  it('should process a QR check-in', async () => {
    const m = await createMember()
    await db.update(members).set({ qrCode: 'qr-checkin' }).where(eq(members.id, m.id))

    const found = await db.query.members.findFirst({ where: eq(members.qrCode, 'qr-checkin') })

    await createTestUser()
    await db.insert(checkIns).values({
      memberId: found!.id,
      registeredByUserId: TEST_USER_ID,
      resultStatus: 'ALLOWED',
    })

    const ci = await db.query.checkIns.findFirst({
      where: eq(checkIns.memberId, found!.id),
      orderBy: (fields, { desc }) => [desc(fields.checkedInAt)],
    })
    expect(ci).toBeDefined()
    expect(ci!.resultStatus).toBe('ALLOWED')
  })

  it('should search member by document number', async () => {
    const m = await createMember()
    await db.update(members).set({ documentNumber: 'DOC-999' }).where(eq(members.id, m.id))

    const found = await db.query.members.findFirst({ where: eq(members.documentNumber, 'DOC-999') })
    expect(found).toBeDefined()
    expect(found!.documentNumber).toBe('DOC-999')
  })
})
