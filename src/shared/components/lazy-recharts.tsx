import React, { Suspense } from 'react'
import type { RechartsExports } from './recharts-module'

export type { RechartsExports }

// ── Loading skeleton ──────────────────────────────────────────────

export function ChartSkeleton({ height = 300 }: { height?: number | string }) {
  return (
    <div
      className="w-full flex items-center justify-center bg-muted/20 rounded-lg animate-pulse"
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
    >
      <div className="flex flex-col items-center gap-2">
        <div className="size-6 rounded-full bg-muted/40" />
        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
          Cargando gráfico...
        </span>
      </div>
    </div>
  )
}

// ── Lazy module loader ───────────────────────────────────────────

const LazyRechartsModule = React.lazy(() => import('./recharts-module'))

// ── Provider that only loads recharts when mounted ───────────────

interface LazyRechartsProps {
  children: (R: RechartsExports) => React.ReactNode
  height?: number | string
  className?: string
}

/**
 * Renders children (with recharts components) only when the recharts
 * module has been loaded via React.lazy(), keeping recharts out of
 * the initial bundle.
 *
 * Usage:
 * ```tsx
 * <LazyRecharts height={300}>
 *   {(R) => (
 *     <R.ResponsiveContainer width="100%" height="100%">
 *       <R.LineChart data={data}>...</R.LineChart>
 *     </R.ResponsiveContainer>
 *   )}
 * </LazyRecharts>
 * ```
 */
export function LazyRecharts({ children, height = 300, className }: LazyRechartsProps) {
  return (
    <Suspense fallback={<ChartSkeleton height={height} />}>
      <div
        className={className}
        style={{ height: typeof height === 'number' ? `${height}px` : height }}
      >
        <LazyRechartsModule>
          {(R: RechartsExports) => children(R)}
        </LazyRechartsModule>
      </div>
    </Suspense>
  )
}
