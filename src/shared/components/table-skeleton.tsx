import { Skeleton } from '#/shared/components/ui/skeleton.tsx'
import { cn } from '#/shared/lib/utils.ts'

export interface TableSkeletonProps {
  /** Number of skeleton rows to display */
  rows?: number
  /** Number of skeleton columns to display */
  columns?: number
  /** Show inside a Card wrapper */
  card?: boolean
}

function TableSkeletonContent({ rows = 3, columns = 4 }: { rows: number; columns: number }) {
  return (
    <div className="w-full">
      {/* Header skeleton */}
      <div className="flex items-center gap-4 px-4 py-3 border-b dark:border-white/5 border-black/5">
        {Array.from({ length: columns }).map((_, columnIdx) => (
          <Skeleton
            key={`hdr-${columnIdx}`}
            className={cn(
              'h-4 rounded-full animate-pulse',
              columnIdx === 0 ? 'w-[180px]' : columnIdx === 1 ? 'w-[120px]' : columnIdx === 2 ? 'w-[80px]' : 'w-[60px]',
            )}
            style={{ animationDelay: `${columnIdx * 60}ms` }}
          />
        ))}
      </div>
      {/* Row skeletons */}
      {Array.from({ length: rows }).map((_r, rowIdx) => (
        <div
          key={`row-${rowIdx}`}
          className="flex items-center gap-4 px-4 py-3.5 border-b dark:border-white/5 border-black/5 last:border-b-0"
        >
          {Array.from({ length: columns }).map((_c, colIdx) => {
            const widths = ['w-[140px]', 'w-[90px]', 'w-[70px]', 'w-[50px]']
            return (
              <div key={colIdx} className="flex items-center gap-2 flex-1">
                {colIdx === 0 && (
                  <Skeleton
                    className="size-7 rounded-full shrink-0 animate-pulse"
                    style={{ animationDelay: `${rowIdx * 80}ms` }}
                  />
                )}
                <Skeleton
                  className={cn(
                    'h-3.5 rounded-full animate-pulse',
                    widths[colIdx] || 'w-[60px]',
                  )}
                  style={{ animationDelay: `${rowIdx * 80 + colIdx * 40}ms` }}
                />
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

/**
 * Reusable table skeleton with animated rows and columns.
 * Can be used standalone or inside a Card.
 *
 * @example
 * <TableSkeleton rows={5} columns={4} />
 * <TableSkeleton rows={3} columns={6} card />
 */
export function TableSkeleton({ rows = 3, columns = 4, card }: TableSkeletonProps) {
  const content = <TableSkeletonContent rows={rows} columns={columns} />

  if (card) {
    return (
      <div className="rounded-xl border dark:border-white/5 border-black/5 overflow-hidden bg-card">
        {content}
      </div>
    )
  }

  return content
}
