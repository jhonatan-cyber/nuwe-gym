import { describe, it, expect, vi, beforeEach } from 'vitest'

import { executeNaturalQuery } from '#/features/analytics/query.ts'

// Mock DB so all execute() calls return controlled data without a real connection
const mockQueryOne = vi.fn()
vi.mock('#/shared/db/index.ts', () => ({
  db: {
    execute: (sql: any) => {
      const text = typeof sql === 'object'
        ? (sql?.queryChunks?.[0]?.value?.[0] ?? '')
        : String(sql ?? '')
      const rows = mockQueryOne(text)
      return Promise.resolve({ rows })
    },
  },
}))

// Mock Groq so fallback tests don't hit the real API
vi.mock('#/shared/lib/ai.ts', () => ({
  getGroq: () => ({
    chat: {
      completions: {
        create: vi.fn().mockRejectedValue(new Error('No API key in test')),
      },
    },
  }),
  GROQ_MODEL: 'test-model',
}))

beforeEach(() => {
  mockQueryOne.mockReset()
  // Default: all COUNT queries return 5
  mockQueryOne.mockReturnValue([{ c: 5 }])
  // top_product query returns a row
  mockQueryOne.mockImplementation((text: string) => {
    if (text.includes('SUM(si.quantity)')) {
      return [{ name: 'Whey Protein', total: 42 }]
    }
    if (text.includes('SUM(total::numeric)')) {
      return [{ total: 15000 }]
    }
    if (text.includes('EXISTS')) {
      return [{ c: 3 }]
    }
    return [{ c: 5 }]
  })
})

describe('Natural Query – total_members', () => {
  it('matches "cuantos socios hay"', async () => {
    const r = await executeNaturalQuery('cuantos socios hay')
    expect(r.intent).toBe('total_members')
    expect(r.answer).toContain('5')
  })

  it('matches "cuantos miembros hay"', async () => {
    const r = await executeNaturalQuery('cuantos miembros hay')
    expect(r.intent).toBe('total_members')
  })

  it('matches "cuantas miembras hay"', async () => {
    const r = await executeNaturalQuery('cuantas miembras hay')
    expect(r.intent).toBe('total_members')
  })

  it('matches "Cuantos socios nuevos hay"', async () => {
    const r = await executeNaturalQuery('Cuantos socios nuevos hay')
    expect(r.intent).toBe('total_members')
  })

  it('matches "total de socios"', async () => {
    const r = await executeNaturalQuery('total de socios')
    expect(r.intent).toBe('total_members')
  })

  it('matches "TOTAL SOCIOS" (case insensitive)', async () => {
    const r = await executeNaturalQuery('TOTAL SOCIOS')
    expect(r.intent).toBe('total_members')
  })
})

describe('Natural Query – active_members', () => {
  it('matches "socios activos"', async () => {
    const r = await executeNaturalQuery('socios activos')
    expect(r.intent).toBe('active_members')
  })

  it('matches "socios con membresia activa"', async () => {
    const r = await executeNaturalQuery('socios con membresia activa')
    expect(r.intent).toBe('active_members')
  })

  it('matches "socios con membresia vigente"', async () => {
    const r = await executeNaturalQuery('socios con membresia vigente')
    expect(r.intent).toBe('active_members')
  })
})

describe('Natural Query – checkins_today', () => {
  it('matches "checkins hoy"', async () => {
    const r = await executeNaturalQuery('checkins hoy')
    expect(r.intent).toBe('checkins_today')
  })

  it('matches "check-ins de hoy"', async () => {
    const r = await executeNaturalQuery('check-ins de hoy')
    expect(r.intent).toBe('checkins_today')
  })

  it('matches "check in del dia"', async () => {
    const r = await executeNaturalQuery('check in del dia')
    expect(r.intent).toBe('checkins_today')
  })

  it('matches "cuantos checkins hubo hoy"', async () => {
    const r = await executeNaturalQuery('cuantos checkins hubo hoy')
    expect(r.intent).toBe('checkins_today')
  })

  it('matches "asistencia de hoy"', async () => {
    const r = await executeNaturalQuery('asistencia de hoy')
    expect(r.intent).toBe('checkins_today')
  })

  it('matches "cuanta gente entro hoy"', async () => {
    const r = await executeNaturalQuery('cuanta gente entro hoy')
    expect(r.intent).toBe('checkins_today')
  })
})

describe('Natural Query – top_product', () => {
  it('matches "producto mas vendido"', async () => {
    const r = await executeNaturalQuery('producto mas vendido')
    expect(r.intent).toBe('top_product')
    expect(r.answer).toContain('Whey Protein')
  })

  it('matches "cual es el producto que mas se vende"', async () => {
    const r = await executeNaturalQuery('cual es el producto que mas se vende')
    expect(r.intent).toBe('top_product')
  })

  it('matches "que es lo que mas se vende"', async () => {
    const r = await executeNaturalQuery('que es lo que mas se vende')
    expect(r.intent).toBe('top_product')
  })
})

describe('Natural Query – sales_today', () => {
  it('matches "ingresos de hoy"', async () => {
    const r = await executeNaturalQuery('ingresos de hoy')
    expect(r.intent).toBe('sales_today')
  })

  it('matches "cuanto se vendio hoy"', async () => {
    const r = await executeNaturalQuery('cuanto se vendio hoy')
    expect(r.intent).toBe('sales_today')
  })

  it('matches "ventas de hoy"', async () => {
    const r = await executeNaturalQuery('ventas de hoy')
    expect(r.intent).toBe('sales_today')
  })

  it('matches "caja de hoy"', async () => {
    const r = await executeNaturalQuery('caja de hoy')
    expect(r.intent).toBe('sales_today')
  })
})

describe('Natural Query – low_stock', () => {
  it('matches "productos con stock bajo"', async () => {
    const r = await executeNaturalQuery('productos con stock bajo')
    expect(r.intent).toBe('low_stock')
  })

  it('matches "que hay que reponer"', async () => {
    const r = await executeNaturalQuery('que hay que reponer')
    expect(r.intent).toBe('low_stock')
  })

  it('matches "stock critico"', async () => {
    const r = await executeNaturalQuery('stock critico')
    expect(r.intent).toBe('low_stock')
  })
})

describe('Natural Query – expiring_subscriptions', () => {
  it('matches "suscripciones por vencer"', async () => {
    const r = await executeNaturalQuery('suscripciones por vencer')
    expect(r.intent).toBe('expiring_subscriptions')
  })

  it('matches "suscripciones que vencen"', async () => {
    const r = await executeNaturalQuery('suscripciones que vencen')
    expect(r.intent).toBe('expiring_subscriptions')
  })

  it('matches "cuantas suscripciones vencen"', async () => {
    const r = await executeNaturalQuery('cuantas suscripciones vencen')
    expect(r.intent).toBe('expiring_subscriptions')
  })
})

describe('Natural Query – churn_risk', () => {
  it('matches "socios en riesgo"', async () => {
    const r = await executeNaturalQuery('socios en riesgo')
    expect(r.intent).toBe('churn_risk')
  })

  it('matches "churn"', async () => {
    const r = await executeNaturalQuery('churn')
    expect(r.intent).toBe('churn_risk')
  })

  it('matches "posibles abandonos"', async () => {
    const r = await executeNaturalQuery('posibles abandonos')
    expect(r.intent).toBe('churn_risk')
  })
})

describe('Natural Query – unrecognized (Groq fallback)', () => {
  it('falls back to ai:error when Groq is unavailable', async () => {
    mockQueryOne.mockReturnValue([])
    const r = await executeNaturalQuery('some random unrecognized query xyz')
    // No pattern matched → tries Groq → fails → ai:error
    expect(r.intent).toBe('ai:error')
    expect(r.answer).toBeTruthy()
  })
})

describe('Natural Query – DB error handling', () => {
  it('catches errors from execute() and returns fallback answer', async () => {
    mockQueryOne.mockImplementation(() => {
      throw new Error('DB connection failed')
    })
    const r = await executeNaturalQuery('cuantos socios hay')
    expect(r.intent).toBe('total_members')
    expect(r.answer).toBe('Ocurrio un error al procesar la consulta.')
  })
})
