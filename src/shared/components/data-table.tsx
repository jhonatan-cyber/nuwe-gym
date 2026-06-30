import { useState, useCallback, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { TableSkeleton } from '#/shared/components/table-skeleton.tsx'
import { Card, CardContent } from '#/shared/components/ui/card.tsx'
import { ErrorState } from '#/shared/components/ui/error-state.tsx'
import { EmptyState } from '#/shared/components/ui/empty-state.tsx'
import { Button } from '#/shared/components/ui/button.tsx'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/shared/components/ui/select.tsx'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/shared/components/ui/table.tsx'
import { cn } from '#/shared/lib/utils.ts'

interface Column<T> {
  key: string
  label: ReactNode
  render: (item: T) => ReactNode
  className?: string
  headerClassName?: string
  sortable?: boolean
  sortValue?: (item: T) => string | number
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  isLoading?: boolean
  isError?: boolean
  errorMessage?: string
  onRetry?: () => void
  emptyMessage?: string
  loadingMessage?: string
  keyExtractor: (item: T) => string | number
  skeletonRows?: number
  // Pagination props
  currentPage?: number
  pageSize?: number
  totalPages?: number
  totalFiltered?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (size: number) => void
}

export function DataTable<T>({
  columns,
  data,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  emptyMessage = 'No se encontraron resultados.',
  loadingMessage = 'Cargando...',
  keyExtractor,
  skeletonRows = 3,
  currentPage,
  pageSize,
  totalPages,
  totalFiltered,
  onPageChange,
  onPageSizeChange,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [pageChanging, setPageChanging] = useState(false)
  const pageTimerRef = useRef<ReturnType<typeof setTimeout>>(null)

  const handlePageChange = useCallback(
    (page: number) => {
      setPageChanging(true)
      if (pageTimerRef.current) clearTimeout(pageTimerRef.current)
      pageTimerRef.current = setTimeout(() => setPageChanging(false), 350)
      onPageChange?.(page)
    },
    [onPageChange],
  )

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (pageTimerRef.current) clearTimeout(pageTimerRef.current)
    }
  }, [])

  const handleSort = (col: Column<T>) => {
    if (!col.sortable) return
    if (sortKey === col.key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(col.key)
      setSortDir('asc')
    }
  }

  const sortedData = [...data].sort((a, b) => {
    if (!sortKey) return 0
    const col = columns.find((c) => c.key === sortKey)
    if (!col || !col.sortable) return 0

    const getValue = col.sortValue || col.render
    const valA = String(getValue(a) ?? '').toLowerCase()
    const valB = String(getValue(b) ?? '').toLowerCase()

    if (valA < valB) return sortDir === 'asc' ? -1 : 1
    if (valA > valB) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  function SortIcon({ colKey }: { colKey: string }) {
    if (sortKey !== colKey)
      return (
        <ArrowUpDown className="size-3 ml-1 opacity-30 group-hover:opacity-60 transition-opacity" />
      )
    return sortDir === 'asc' ? (
      <ArrowUp className="size-3 ml-1 text-primary" />
    ) : (
      <ArrowDown className="size-3 ml-1 text-primary" />
    )
  }

  return (
    <>
      <Card className="overflow-hidden relative">
        {/* Page loading indicator */}
        {pageChanging && (
          <div className="absolute top-0 left-0 right-0 z-10 h-0.5 bg-muted/30">
            <div
              className="h-full bg-primary rounded-full"
              style={{
                animation: `pageLoadBar 0.35s ease-out`,
              }}
            />
          </div>
        )}
        <CardContent className="p-0">
          {isError ? (
            <ErrorState message={errorMessage} onRetry={onRetry} />
          ) : isLoading ? (
            skeletonRows > 0 ? (
              <TableSkeleton rows={skeletonRows} columns={columns.length || 4} />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {loadingMessage}
              </div>
            )
          ) : data.length === 0 ? (
            <EmptyState description={emptyMessage} />
          ) : (
            <div
              key={currentPage ?? 1}
              style={{ animation: `fadeSlideIn 0.3s ease-out` }}
            >
              {/* Page size selector at the top inside the table */}
              {currentPage !== undefined && pageSize !== undefined && totalFiltered !== undefined && onPageSizeChange !== undefined && (
                <div className="flex justify-end items-center px-4 pt-3 pb-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span>Por página:</span>
                    <Select
                      value={String(pageSize)}
                      onValueChange={(val) => {
                        onPageSizeChange(Number(val))
                      }}
                    >
                      <SelectTrigger className="h-7 w-[70px] text-xs rounded-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((col) => (
                      <TableHead
                        key={col.key}
                        className={cn(
                          'cursor-default',
                          col.headerClassName,
                          col.sortable && 'cursor-pointer select-none group',
                        )}
                        onClick={() => handleSort(col)}
                      >
                        <span className="inline-flex items-center">
                          {col.label}
                          {col.sortable && <SortIcon colKey={col.key} />}
                        </span>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedData.map((item, idx) => (
                    <TableRow
                      key={keyExtractor(item)}
                      style={{
                        animation: `fadeSlideIn 0.35s ease-out both`,
                        animationDelay: `${idx * 25}ms`,
                      }}
                    >
                      {columns.map((col) => (
                        <TableCell key={col.key} className={col.className}>
                          {col.render(item)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination outside the Card, centered */}
      {!isLoading && !isError && data.length > 0 && currentPage !== undefined && totalPages !== undefined && onPageChange !== undefined && totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 mt-4">
          <Button
            variant="outline"
            size="icon"
            className="size-8 rounded-full"
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="size-4" />
          </Button>

          {Array.from({ length: totalPages }).map((_, idx) => {
            const pageNum = idx + 1
            return (
              <Button
                key={pageNum}
                variant={currentPage === pageNum ? 'default' : 'outline'}
                size="sm"
                className="size-8 text-xs font-bold rounded-full"
                onClick={() => handlePageChange(pageNum)}
              >
                {pageNum}
              </Button>
            )
          })}

          <Button
            variant="outline"
            size="icon"
            className="size-8 rounded-full"
            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </>
  )
}
