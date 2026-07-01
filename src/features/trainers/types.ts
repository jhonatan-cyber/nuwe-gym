import type { getTrainers } from '#/features/trainers/server.ts'

export type TrainerWithDetails = Awaited<ReturnType<typeof getTrainers>>[number]

export type ViewMode = 'trainers' | 'my-members' | 'create' | 'edit' | 'calendar'

export interface AvailabilitySlot {
  id: string
  dayOfWeek: number
  startTime: string
  endTime: string
}

export interface TrainerCalendarEntry {
  id: string
  name: string
  specialty: string | null
  availability: AvailabilitySlot[]
  memberCount: number
}
