import { describe, it, expect } from 'vitest'
import { generateReferralCode } from '#/features/loyalty/server.ts'

describe('generateReferralCode', () => {
  it('generates a code from full name and id', () => {
    const code = generateReferralCode('Juan Perez', 'abc123def456')
    expect(code).toBe('juanpere-abc123')
  })

  it('handles accented characters by stripping them', () => {
    const code = generateReferralCode('María José López', 'id12345xyz')
    expect(code).toBe('mariajos-id1234')
  })

  it('handles special characters in name', () => {
    const code = generateReferralCode('John "The Beast" Smith!!', 'user789')
    // "john \"the beast\" smith!!" → lowercase → same
    // → replace non-alnum → "johnthebeastsmith"
    // → slice(0,8) → "johntheb"
    // id slice(0,6) → "user78"
    expect(code).toBe('johntheb-user78')
  })

  it('handles hyphens and spaces in name', () => {
    const code = generateReferralCode('Ana-María García-Ruiz', 'abc001def')
    expect(code).toBe('anamaria-abc001')
  })

  it('truncates name part to 8 characters', () => {
    const code = generateReferralCode('VeryLongNameHere', 'abc123')
    expect(code).toBe('verylong-abc123')
  })

  it('truncates id part to 6 characters', () => {
    const code = generateReferralCode('Short', 'very-long-id-string')
    // name: "short" → slice(0,8) → "short"
    // id: "ve" (well, depends on slice)
    // id slice(0,6) → "very-l"
    expect(code).toBe('short-very-l')
  })

  it('handles empty name gracefully', () => {
    const code = generateReferralCode('', 'id123456')
    expect(code).toBe('-id1234')
  })

  it('handles name with only special characters', () => {
    const code = generateReferralCode('!!! @@@ ###', 'abc123')
    // → toLowerCase → "!!! @@@ ###"
    // → replace non-alnum → ""
    // → slice(0,8) → ""
    expect(code).toBe('-abc123')
  })

  it('handles single-character name', () => {
    const code = generateReferralCode('A', 'abcdef123456')
    expect(code).toBe('a-abcdef')
  })

  it('produces consistent output for same inputs', () => {
    const code1 = generateReferralCode('Test User', 'same-id-here')
    const code2 = generateReferralCode('Test User', 'same-id-here')
    expect(code1).toBe(code2)
  })

  it('preserves digits in name', () => {
    const code = generateReferralCode('User1234', 'id999')
    expect(code).toBe('user1234-id999')
  })
})
