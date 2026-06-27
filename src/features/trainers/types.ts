import type { getTrainers } from '#/features/trainers/server.ts'

export type TrainerWithDetails = Awaited<ReturnType<typeof getTrainers>>[number]

export type ViewMode = 'trainers' | 'my-members' | 'create' | 'edit'
