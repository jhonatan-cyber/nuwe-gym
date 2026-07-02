import { createServerFn } from '@tanstack/react-start'
import { db } from '#/shared/db/index.ts'
import { members } from '#/shared/db/schema/members.ts'
import { checkIns } from '#/shared/db/schema/check-ins.ts'
import { classSchedules, classBookings } from '#/shared/db/schema/classes.ts'
import { promotions } from '#/shared/db/schema/promotions.ts'
import { tvMedia, tvTickerMessages } from '#/shared/db/schema/tv-media.ts'
import { settings } from '#/shared/db/schema/settings.ts'
import { count, eq, desc, and, gte, sql, inArray, lte, asc } from 'drizzle-orm'

// ── Motivational phrases ──────────────────────────────────────────

const MOTIVATIONAL_PHRASES = [
  'El único mal entrenamiento es el que no hiciste.',
  'No se trata de tener tiempo, se trata de hacer tiempo.',
  'El dolor que sientes hoy será la fuerza que tendrás mañana.',
  'Tu único límite es el que te pongas a vos mismo.',
  'No cuentes los días, hacé que los días cuenten.',
  'El éxito no es casualidad, es disciplina.',
  'Sudor + Sacrificio = Éxito.',
  'Si querés resultados diferentes, no hagas siempre lo mismo.',
  'La disciplina siempre vence a la motivación.',
  'El cuerpo logra todo lo que la mente cree.',
  'No pares cuando estés cansado, pará cuando hayas terminado.',
  'El gym no espera a nadie. Vos tampoco.',
  'El cambio no ocurre de un día para el otro, pero ocurre.',
  'Esforzate hoy para ser la mejor versión de vos mañana.',
  'Cada gota de sudor es un paso más cerca de tu meta.',
  'El único lugar donde el éxito viene antes que el trabajo es en el diccionario.',
  'No te compares con nadie. Competí contra vos mismo.',
  'Un paso a la vez. Un día a la vez.',
  'La mejor inversión que podés hacer es en vos mismo.',
  'No bajes los brazos. Literalmente. Seguí entrenando.',
]

// ── Data ──────────────────────────────────────────────────────────

export const getTvData = createServerFn({ method: 'GET' }).handler(
  async () => {
    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const todayEnd = new Date(todayStart.getTime() + 86400000)
    const todayDOW = today.getDay()

    // ── Attendance ranking (top 10 this month) ──
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    const rankingData = await db
      .select({
        memberId: checkIns.memberId,
        count: count(),
      })
      .from(checkIns)
      .where(
        and(
          gte(checkIns.checkedInAt, monthStart),
          eq(checkIns.resultStatus, 'ALLOWED'),
        ),
      )
      .groupBy(checkIns.memberId)
      .orderBy(desc(count()))
      .limit(10)

    const memberIds = rankingData.map((r) => r.memberId)
    let ranking: { fullName: string; photoUrl: string | null; checkIns: number }[] = []
    if (memberIds.length > 0) {
      const memberMap = new Map(
        (await db
          .select({ id: members.id, fullName: members.fullName, photoUrl: members.photoUrl })
          .from(members)
          .where(inArray(members.id, memberIds)))
          .map((m) => [m.id, m]),
      )
      ranking = rankingData.map((r) => ({
        fullName: memberMap.get(r.memberId)?.fullName ?? 'Desconocido',
        photoUrl: memberMap.get(r.memberId)?.photoUrl ?? null,
        checkIns: Number(r.count),
      }))
    }

    // ── Today's check-in count (occupancy) ──
    const [todayCount] = await db
      .select({ count: count() })
      .from(checkIns)
      .where(
        and(
          gte(checkIns.checkedInAt, todayStart),
          lte(checkIns.checkedInAt, todayEnd),
          eq(checkIns.resultStatus, 'ALLOWED'),
        ),
      )
    const todayCheckIns = Number(todayCount?.count ?? 0)

    // ── Currently checked in (last 2 hours) ──
    const twoHoursAgo = new Date(today.getTime() - 2 * 60 * 60 * 1000)
    const [currentCount] = await db
      .select({ count: count() })
      .from(checkIns)
      .where(
        and(
          gte(checkIns.checkedInAt, twoHoursAgo),
          lte(checkIns.checkedInAt, todayEnd),
          eq(checkIns.resultStatus, 'ALLOWED'),
        ),
      )
    const currentlyInGym = Number(currentCount?.count ?? 0)

    // ── Upcoming classes today ──
    const schedules = await db.query.classSchedules.findMany({
      where: and(
        eq(classSchedules.dayOfWeek, todayDOW),
        eq(classSchedules.isActive, true),
      ),
      with: {
        class: true,
        bookings: {
          where: eq(classBookings.status, 'CONFIRMED'),
        },
      },
      orderBy: [classSchedules.startTime],
    })

    const upcomingClasses = schedules.map((s) => ({
      className: s.class.name,
      color: s.class.color,
      startTime: s.startTime,
      endTime: s.endTime,
      room: s.room ?? 'Salón principal',
      capacity: s.class.capacity,
      bookedCount: s.bookings.length,
      availableSpots: s.class.capacity - s.bookings.length,
    }))

    // ── Active promotions ──
    const activePromos = await db
      .select()
      .from(promotions)
      .where(
        and(
          eq(promotions.isActive, true),
          sql`(${promotions.startDate} IS NULL OR ${promotions.startDate} <= ${today})`,
          sql`(${promotions.endDate} IS NULL OR ${promotions.endDate} >= ${today})`,
        ),
      )
      .orderBy(desc(promotions.createdAt))
      .limit(10)

    // ── TV Media (gallery images) ──
    const mediaItems = await db
      .select()
      .from(tvMedia)
      .where(eq(tvMedia.isActive, true))
      .orderBy(asc(tvMedia.displayOrder))

    // ── Ticker messages ──
    const tickerMessages = await db
      .select()
      .from(tvTickerMessages)
      .where(eq(tvTickerMessages.isActive, true))
      .orderBy(asc(tvTickerMessages.displayOrder))

    // ── Gym settings for QR (gymName) ──
    const gymSettings = await db.select().from(settings).limit(1)
    const gymName = gymSettings[0]?.gymName ?? 'Trainix Gym'

    // ── Random motivational phrase ──
    const phraseIndex = Math.floor(Math.random() * MOTIVATIONAL_PHRASES.length)
    const motivationalPhrase = MOTIVATIONAL_PHRASES[phraseIndex]

    return {
      ranking,
      todayCheckIns,
      currentlyInGym,
      upcomingClasses,
      activePromotions: activePromos,
      mediaItems,
      tickerMessages: tickerMessages.map((m) => m.message),
      motivationalPhrase,
      gymName,
      updatedAt: new Date().toISOString(),
    }
  },
)
