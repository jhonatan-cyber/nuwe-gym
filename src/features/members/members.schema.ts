import { z } from 'zod'
import { branchIdField, memberStatusEnum, optionalDateString, optionalString, requiredString, uuidField } from '#/shared/lib/schemas.ts'

export const getMembersSchema = z.object({
  search: optionalString,
  branchId: branchIdField,
})

export const createMemberSchema = z.object({
  fullName: requiredString,
  documentNumber: requiredString,
  email: optionalString,
  phone: optionalString,
  birthDate: optionalDateString,
  gender: optionalString,
  emergencyContactName: optionalString,
  emergencyContactPhone: optionalString,
  address: optionalString,
  branchId: branchIdField,
  physicalRestrictions: optionalString,
  medicalNotes: optionalString,
  contractSignature: optionalString,
  referredBy: optionalString, // referral code of the referring member
  corporateAccountId: optionalString,
})

export type CreateMemberData = z.infer<typeof createMemberSchema>

export const toggleMemberStatusSchema = z.object({
  memberId: uuidField,
  status: z.enum(['ACTIVE', 'INACTIVE']),
})

export type ToggleMemberStatusData = z.infer<typeof toggleMemberStatusSchema>

export const deleteMemberSchema = z.object({
  memberId: uuidField,
})

export const updateMemberSchema = createMemberSchema.extend({
  id: uuidField,
  status: memberStatusEnum,
})

export type UpdateMemberData = z.infer<typeof updateMemberSchema>

export const uploadPhotoSchema = z.object({
  memberId: uuidField,
  photoBase64: z.string(),
})
