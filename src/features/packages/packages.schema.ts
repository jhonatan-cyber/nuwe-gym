import { z } from 'zod'
import { dayOfWeek, moneyString, optionalString, positiveInt, positiveIntMin1, requiredString, timeString, uuidField } from '#/shared/lib/schemas.ts'

export const packageItemSchema = z.object({
  description: requiredString,
  sortOrder: z.number().optional(),
})

export const allowedDaySchema = z.object({
  dayOfWeek: dayOfWeek,
  startTime: timeString.optional(),
  endTime: timeString.optional(),
})

const renewalTypeSchema = z.enum(['MANUAL', 'AUTO']).default('MANUAL')

export const benefitSchema = z.object({
  benefitKey: requiredString,
  enabled: z.boolean(),
})

export const createPackageSchema = z.object({
  name: requiredString,
  description: optionalString,
  imageBase64: optionalString,
  price: moneyString,
  durationDays: positiveIntMin1,
  type: z.enum(['PACKAGE', 'PROMOTION', 'SPECIAL']).default('PACKAGE'),
  renewalType: renewalTypeSchema,
  graceDays: positiveInt.default(0),
  maxFreezes: positiveInt.default(0),
  maxFreezeDays: positiveInt.default(0),
  allowedStartTime: timeString.optional(),
  allowedEndTime: timeString.optional(),
  dailyAccessLimit: positiveInt.optional(),
  color: optionalString,
  items: z.array(packageItemSchema).default([]),
  allowedDays: z.array(allowedDaySchema).default([]),
  benefits: z.array(benefitSchema).default([]),
})

export const updatePackageSchema = z.object({
  id: uuidField,
  name: requiredString,
  description: optionalString,
  imageBase64: optionalString,
  price: moneyString,
  durationDays: positiveIntMin1,
  type: z.enum(['PACKAGE', 'PROMOTION', 'SPECIAL']),
  renewalType: renewalTypeSchema,
  graceDays: positiveInt.default(0),
  maxFreezes: positiveInt.default(0),
  maxFreezeDays: positiveInt.default(0),
  allowedStartTime: timeString.optional(),
  allowedEndTime: timeString.optional(),
  dailyAccessLimit: positiveInt.optional(),
  color: optionalString,
  isActive: z.boolean(),
  items: z.array(packageItemSchema).default([]),
  allowedDays: z.array(allowedDaySchema).default([]),
  benefits: z.array(benefitSchema).default([]),
})

export const deletePackageSchema = z.object({
  id: uuidField,
})

export type CreatePackageInput = z.infer<typeof createPackageSchema>
export type UpdatePackageInput = z.infer<typeof updatePackageSchema>
