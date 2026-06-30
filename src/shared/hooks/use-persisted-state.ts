import { useState, useCallback } from 'react'

/**
 * useState that persists its value to localStorage under the given key.
 *
 * @param key - localStorage key
 * @param defaultValue - fallback when nothing is stored or validation fails
 * @param validate - optional function to validate/transform the raw stored value
 */
export function usePersistedState<T>(
  key: string,
  defaultValue: T,
  validate?: (stored: T) => T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      if (raw === null) return defaultValue
      const parsed = JSON.parse(raw) as T
      return validate ? validate(parsed) : parsed
    } catch {
      return defaultValue
    }
  })

  const setPersistedState = useCallback(
    (value: T | ((prev: T) => T)) => {
      setState((prev) => {
        const next = typeof value === 'function' ? (value as (prev: T) => T)(prev) : value
        try {
          localStorage.setItem(key, JSON.stringify(next))
        } catch {
          // localStorage unavailable (quota exceeded, incognito, etc.)
        }
        return next
      })
    },
    [key],
  )

  return [state, setPersistedState]
}
