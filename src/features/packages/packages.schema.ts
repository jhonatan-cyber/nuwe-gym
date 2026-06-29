import { z } from 'zod'

export const packageItemSchema = z.object({
  description: z.string().min(1),
  sortOrder: z.number().optional(),
})

export const allowedDaySchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
})

const renewalTypeSchema = z.enum(['MANUAL', 'AUTO']).default('MANUAL')

export const createPackageSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  imageBase64: z.string().optional(),
  price: z.string(),
  durationDays: z.number().min(1),
  type: z.enum(['PACKAGE', 'PROMOTION', 'SPECIAL']).default('PACKAGE'),
  renewalType: renewalTypeSchema,
  graceDays: z.number().min(0).default(0),
  maxFreezes: z.number().min(0).default(0),
  maxFreezeDays: z.number().min(0).default(0),
  allowedStartTime: z.string().optional(),
  allowedEndTime: z.string().optional(),
  dailyAccessLimit: z.number().min(0).optional(),
  color: z.string().optional(),
  items: z.array(packageItemSchema).default([]),
  allowedDays: z.array(allowedDaySchema).default([]),
})

export const updatePackageSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  imageBase64: z.string().optional(),
  price: z.string(),
  durationDays: z.number().min(1),
  type: z.enum(['PACKAGE', 'PROMOTION', 'SPECIAL']),
  renewalType: renewalTypeSchema,
  graceDays: z.number().min(0).default(0),
  maxFreezes: z.number().min(0).default(0),
  maxFreezeDays: z.number().min(0).default(0),
  allowedStartTime: z.string().optional(),
  allowedEndTime: z.string().optional(),
  dailyAccessLimit: z.number().min(0).optional(),
  color: z.string().optional(),
  isActive: z.boolean(),
  items: z.array(packageItemSchema).default([]),
  allowedDays: z.array(allowedDaySchema).default([]),
})

export const deletePackageSchema = z.object({
  id: z.string().uuid(),
})

export type CreatePackageInput = z.infer<typeof createPackageSchema>
export type UpdatePackageInput = z.infer<typeof updatePackageSchema>
