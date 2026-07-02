import { createContext, useContext, useState, useId, useCallback } from 'react'
import { cn } from '#/shared/lib/utils.ts'

// ── Context ──

interface TabsContext {
  value: string
  onValueChange: (value: string) => void
  baseId: string
}

const TabsContext = createContext<TabsContext | null>(null)

function useTabsContext() {
  const ctx = useContext(TabsContext)
  if (!ctx) throw new Error('Tabs components must be used within a Tabs provider')
  return ctx
}

// ── Tabs ──

export function Tabs({
  value,
  onValueChange,
  defaultValue,
  className,
  children,
}: {
  value?: string
  onValueChange?: (value: string) => void
  defaultValue?: string
  className?: string
  children: React.ReactNode
}) {
  const [internalValue, setInternalValue] = useState(defaultValue ?? '')
  const baseId = useId()

  const isControlled = value !== undefined
  const activeValue = isControlled ? value : internalValue

  const handleChange = useCallback(
    (newValue: string) => {
      if (!isControlled) setInternalValue(newValue)
      onValueChange?.(newValue)
    },
    [isControlled, onValueChange],
  )

  return (
    <TabsContext.Provider
      value={{ value: activeValue, onValueChange: handleChange, baseId }}
    >
      <div className={cn('w-full', className)}>{children}</div>
    </TabsContext.Provider>
  )
}

// ── TabsList ──

export function TabsList({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-2xl bg-muted/20 p-1',
        className,
      )}
      role="tablist"
    >
      {children}
    </div>
  )
}

// ── TabsTrigger ──

export function TabsTrigger({
  value,
  className,
  children,
}: {
  value: string
  className?: string
  children: React.ReactNode
}) {
  const { value: activeValue, onValueChange, baseId } = useTabsContext()
  const isActive = activeValue === value

  return (
    <button
      role="tab"
      id={`${baseId}-tab-${value}`}
      aria-selected={isActive}
      aria-controls={`${baseId}-panel-${value}`}
      onClick={() => onValueChange(value)}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-200 ease-out',
        isActive
          ? 'bg-background text-foreground shadow-sm scale-[1.02]'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/10',
        className,
      )}
    >
      {children}
    </button>
  )
}

// ── TabsContent ──

export function TabsContent({
  value,
  className,
  children,
}: {
  value: string
  className?: string
  children: React.ReactNode
}) {
  const { value: activeValue, baseId } = useTabsContext()

  if (activeValue !== value) return null

  return (
    <div
      role="tabpanel"
      id={`${baseId}-panel-${value}`}
      aria-labelledby={`${baseId}-tab-${value}`}
      className={cn('', className)}
    >
      {children}
    </div>
  )
}
