import type { getFamilyGroups, getFamilyGroupById, getFamilyGroupByMember } from './server.ts'

export type FamilyGroup = Awaited<ReturnType<typeof getFamilyGroups>>[number]

export type FamilyGroupDetail = Awaited<ReturnType<typeof getFamilyGroupById>>

export type FamilyGroupByMember = Awaited<ReturnType<typeof getFamilyGroupByMember>>
