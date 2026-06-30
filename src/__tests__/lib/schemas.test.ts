import { describe, it, expect } from 'vitest'
import {
  uuidField,
  branchIdField,
  requiredString,
  dateString,
  optionalDateString,
  optionalString,
  timeString,
  moneyString,
  positiveNumber,
  positiveInt,
  positiveIntMin1,
  dayOfWeek,
  paymentMethodEnum,
  memberStatusEnum,
  memberStatusValues,
} from '#/shared/lib/schemas.ts'

describe('uuidField', () => {
  it('should accept a valid UUID v4', () => {
    expect(uuidField.parse('550e8400-e29b-41d4-a716-446655440000')).toBe(
      '550e8400-e29b-41d4-a716-446655440000',
    )
  })

  it('should reject a non-UUID string', () => {
    expect(() => uuidField.parse('not-a-uuid')).toThrow()
  })

  it('should reject an empty string', () => {
    expect(() => uuidField.parse('')).toThrow()
  })

  it('should reject a short UUID', () => {
    expect(() => uuidField.parse('550e8400-e29b-41d4')).toThrow()
  })

  it('should reject undefined', () => {
    expect(() => uuidField.parse(undefined)).toThrow()
  })

  it('should reject null', () => {
    expect(() => uuidField.parse(null)).toThrow()
  })
})

describe('branchIdField', () => {
  it('should accept a valid UUID', () => {
    expect(
      branchIdField.parse('550e8400-e29b-41d4-a716-446655440000'),
    ).toBe('550e8400-e29b-41d4-a716-446655440000')
  })

  it('should accept undefined (optional)', () => {
    expect(branchIdField.parse(undefined)).toBeUndefined()
  })

  it('should reject a non-UUID string', () => {
    expect(() => branchIdField.parse('bad-uuid')).toThrow()
  })

  it('should reject null', () => {
    expect(() => branchIdField.parse(null)).toThrow()
  })
})

describe('requiredString', () => {
  it('should accept a non-empty string', () => {
    expect(requiredString.parse('John Doe')).toBe('John Doe')
  })

  it('should reject an empty string', () => {
    expect(() => requiredString.parse('')).toThrow()
  })

  it('should accept a string with only whitespace (min(1) checks length, not trim)', () => {
    expect(requiredString.parse('   ')).toBe('   ')
  })

  it('should reject undefined', () => {
    expect(() => requiredString.parse(undefined)).toThrow()
  })

  it('should reject null', () => {
    expect(() => requiredString.parse(null)).toThrow()
  })

  it('should accept a single character', () => {
    expect(requiredString.parse('a')).toBe('a')
  })
})

describe('dateString', () => {
  it('should accept an ISO date string', () => {
    expect(dateString.parse('2024-01-15')).toBe('2024-01-15')
  })

  it('should reject a full ISO datetime string (only date format)', () => {
    expect(() => dateString.parse('2024-01-15T10:30:00.000Z')).toThrow()
  })

  it('should reject a non-date string', () => {
    expect(() => dateString.parse('any-string')).toThrow()
  })

  it('should reject undefined', () => {
    expect(() => dateString.parse(undefined)).toThrow()
  })

  it('should reject null', () => {
    expect(() => dateString.parse(null)).toThrow()
  })

  it('should reject an empty string', () => {
    expect(() => dateString.parse('')).toThrow()
  })

  it('should reject an invalid date format (DD-MM-YYYY)', () => {
    expect(() => dateString.parse('15-01-2024')).toThrow()
  })

  it('should reject an invalid month (13)', () => {
    expect(() => dateString.parse('2024-13-01')).toThrow()
  })

  it('should reject an invalid day (32)', () => {
    expect(() => dateString.parse('2024-01-32')).toThrow()
  })

  it('should accept Feb 29 in a leap year (2024)', () => {
    expect(dateString.parse('2024-02-29')).toBe('2024-02-29')
  })

  it('should accept Feb 29 in a century leap year (2000)', () => {
    expect(dateString.parse('2000-02-29')).toBe('2000-02-29')
  })

  it('should reject Feb 29 in a non-leap year (2023)', () => {
    expect(() => dateString.parse('2023-02-29')).toThrow()
  })

  it('should reject Feb 29 in a century non-leap year (1900)', () => {
    expect(() => dateString.parse('1900-02-29')).toThrow()
  })

  it('should reject Feb 30 (never valid)', () => {
    expect(() => dateString.parse('2024-02-30')).toThrow()
  })

  it('should reject Feb 31 (never valid)', () => {
    expect(() => dateString.parse('2024-02-31')).toThrow()
  })

  it('should accept Apr 30 (30-day month)', () => {
    expect(dateString.parse('2024-04-30')).toBe('2024-04-30')
  })

  it('should reject Apr 31 (30-day month)', () => {
    expect(() => dateString.parse('2024-04-31')).toThrow()
  })
})

describe('optionalDateString', () => {
  it('should accept a valid ISO date', () => {
    expect(optionalDateString.parse('2024-06-15')).toBe('2024-06-15')
  })

  it('should accept undefined', () => {
    expect(optionalDateString.parse(undefined)).toBeUndefined()
  })

  it('should reject a non-date string', () => {
    expect(() => optionalDateString.parse('not-a-date')).toThrow()
  })

  it('should reject null', () => {
    expect(() => optionalDateString.parse(null)).toThrow()
  })

  it('should reject an invalid date format (DD-MM-YYYY)', () => {
    expect(() => optionalDateString.parse('15-01-2024')).toThrow()
  })

  it('should accept Feb 29 in a leap year (optional)', () => {
    expect(optionalDateString.parse('2024-02-29')).toBe('2024-02-29')
  })

  it('should reject Feb 29 in a non-leap year (optional)', () => {
    expect(() => optionalDateString.parse('2023-02-29')).toThrow()
  })
})

describe('optionalString', () => {
  it('should accept a string value', () => {
    expect(optionalString.parse('hello')).toBe('hello')
  })

  it('should accept undefined', () => {
    expect(optionalString.parse(undefined)).toBeUndefined()
  })

  it('should accept an empty string', () => {
    expect(optionalString.parse('')).toBe('')
  })

  it('should reject null', () => {
    expect(() => optionalString.parse(null)).toThrow()
  })
})

describe('timeString', () => {
  it('should accept 00:00 (midnight)', () => {
    expect(timeString.parse('00:00')).toBe('00:00')
  })

  it('should accept 23:59 (end of day)', () => {
    expect(timeString.parse('23:59')).toBe('23:59')
  })

  it('should accept 08:00 (morning)', () => {
    expect(timeString.parse('08:00')).toBe('08:00')
  })

  it('should accept 12:30 (noon)', () => {
    expect(timeString.parse('12:30')).toBe('12:30')
  })

  it('should reject a non-time string', () => {
    expect(() => timeString.parse('any-time')).toThrow()
  })

  it('should reject an invalid hour (24:00)', () => {
    expect(() => timeString.parse('24:00')).toThrow()
  })

  it('should reject an invalid hour (99:00)', () => {
    expect(() => timeString.parse('99:00')).toThrow()
  })

  it('should reject an invalid minute (08:60)', () => {
    expect(() => timeString.parse('08:60')).toThrow()
  })

  it('should reject an invalid format (8:00, missing leading zero)', () => {
    expect(() => timeString.parse('8:00')).toThrow()
  })

  it('should reject an empty string', () => {
    expect(() => timeString.parse('')).toThrow()
  })

  it('should reject undefined', () => {
    expect(() => timeString.parse(undefined)).toThrow()
  })

  it('should reject null', () => {
    expect(() => timeString.parse(null)).toThrow()
  })
})

describe('paymentMethodEnum', () => {
  it('should accept CASH', () => {
    expect(paymentMethodEnum.parse('CASH')).toBe('CASH')
  })

  it('should accept CARD', () => {
    expect(paymentMethodEnum.parse('CARD')).toBe('CARD')
  })

  it('should accept TRANSFER', () => {
    expect(paymentMethodEnum.parse('TRANSFER')).toBe('TRANSFER')
  })

  it('should accept QR', () => {
    expect(paymentMethodEnum.parse('QR')).toBe('QR')
  })

  it('should reject an invalid payment method', () => {
    expect(() => paymentMethodEnum.parse('CRYPTO')).toThrow()
  })

  it('should reject lowercase', () => {
    expect(() => paymentMethodEnum.parse('cash')).toThrow()
  })

  it('should reject undefined', () => {
    expect(() => paymentMethodEnum.parse(undefined)).toThrow()
  })

  it('should have exactly 4 values', () => {
    expect(paymentMethodEnum.options).toEqual([
      'CASH',
      'CARD',
      'TRANSFER',
      'QR',
    ])
  })
})

describe('memberStatusEnum', () => {
  it('should accept ACTIVE', () => {
    expect(memberStatusEnum.parse('ACTIVE')).toBe('ACTIVE')
  })

  it('should accept INACTIVE', () => {
    expect(memberStatusEnum.parse('INACTIVE')).toBe('INACTIVE')
  })

  it('should accept SUSPENDED', () => {
    expect(memberStatusEnum.parse('SUSPENDED')).toBe('SUSPENDED')
  })

  it('should accept CANCELED', () => {
    expect(memberStatusEnum.parse('CANCELED')).toBe('CANCELED')
  })

  it('should reject an unknown status', () => {
    expect(() => memberStatusEnum.parse('EXPIRED')).toThrow()
  })

  it('should reject lowercase', () => {
    expect(() => memberStatusEnum.parse('active')).toThrow()
  })

  it('should reject undefined', () => {
    expect(() => memberStatusEnum.parse(undefined)).toThrow()
  })
})

describe('moneyString', () => {
  it('should accept an integer amount', () => {
    expect(moneyString.parse('30000')).toBe('30000')
  })

  it('should accept a decimal amount', () => {
    expect(moneyString.parse('15000.00')).toBe('15000.00')
  })

  it('should accept a small amount', () => {
    expect(moneyString.parse('0.50')).toBe('0.50')
  })

  it('should reject negative amount', () => {
    expect(() => moneyString.parse('-100')).toThrow()
  })

  it('should reject a non-numeric string', () => {
    expect(() => moneyString.parse('abc')).toThrow()
  })

  it('should reject empty string', () => {
    expect(() => moneyString.parse('')).toThrow()
  })

  it('should reject undefined', () => {
    expect(() => moneyString.parse(undefined)).toThrow()
  })
})

describe('positiveNumber', () => {
  it('should accept zero', () => {
    expect(positiveNumber.parse(0)).toBe(0)
  })

  it('should accept a positive number', () => {
    expect(positiveNumber.parse(10)).toBe(10)
  })

  it('should accept a decimal', () => {
    expect(positiveNumber.parse(5.5)).toBe(5.5)
  })

  it('should reject a negative number', () => {
    expect(() => positiveNumber.parse(-1)).toThrow()
  })
})

describe('positiveInt', () => {
  it('should accept zero', () => {
    expect(positiveInt.parse(0)).toBe(0)
  })

  it('should accept a positive integer', () => {
    expect(positiveInt.parse(5)).toBe(5)
  })

  it('should reject a decimal', () => {
    expect(() => positiveInt.parse(5.5)).toThrow()
  })

  it('should reject a negative integer', () => {
    expect(() => positiveInt.parse(-1)).toThrow()
  })
})

describe('positiveIntMin1', () => {
  it('should accept 1', () => {
    expect(positiveIntMin1.parse(1)).toBe(1)
  })

  it('should accept a larger integer', () => {
    expect(positiveIntMin1.parse(30)).toBe(30)
  })

  it('should reject 0', () => {
    expect(() => positiveIntMin1.parse(0)).toThrow()
  })

  it('should reject a negative integer', () => {
    expect(() => positiveIntMin1.parse(-1)).toThrow()
  })

  it('should reject a decimal', () => {
    expect(() => positiveIntMin1.parse(1.5)).toThrow()
  })
})

describe('dayOfWeek', () => {
  it('should accept 0 (Sunday)', () => {
    expect(dayOfWeek.parse(0)).toBe(0)
  })

  it('should accept 6 (Saturday)', () => {
    expect(dayOfWeek.parse(6)).toBe(6)
  })

  it('should reject 7', () => {
    expect(() => dayOfWeek.parse(7)).toThrow()
  })

  it('should reject -1', () => {
    expect(() => dayOfWeek.parse(-1)).toThrow()
  })

  it('should reject a decimal', () => {
    expect(() => dayOfWeek.parse(1.5)).toThrow()
  })
})

describe('memberStatusValues', () => {
  it('should contain all 4 status values', () => {
    expect(memberStatusValues).toEqual([
      'ACTIVE',
      'INACTIVE',
      'SUSPENDED',
      'CANCELED',
    ])
  })

  it('should be readonly (as const)', () => {
    // Type-level test: memberStatusValues is `readonly ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'CANCELED']`
    expect(memberStatusValues.length).toBe(4)
  })
})


