import { useState } from 'react'
import type { ReactNode } from 'react'
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Card, CardContent } from '#/shared/components/ui/card.tsx'
import { Skeleton } from '#/shared/components/ui/skeleton.tsx'
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
    <Card className="overflow-hidden">
      {/* Table Header inside the Card */}
      {!isLoading && !isError && data.length > 0 && currentPage !== undefined && pageSize !== undefined && totalFiltered !== undefined && onPageSizeChange !== undefined && (
        <div className="flex justify-between items-center px-6 py-3 border-b dark:border-white/5 border-black/5 bg-muted/20">
          <span className="text-xs text-muted-foreground font-medium">
            Mostrando {totalFiltered === 0 ? 0 : (currentPage - 1) * pageSize + 1} a{' '}
            {Math.min(currentPage * pageSize, totalFiltered)} de {totalFiltered} registros
          </span>
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

      <CardContent className="p-0">
        {isError ? (
          <ErrorState message={errorMessage} onRetry={onRetry} />
        ) : isLoading ? (
          skeletonRows > 0 ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: skeletonRows }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {loadingMessage}
            </div>
          )
        ) : data.length === 0 ? (
          <EmptyState description={emptyMessage} />
        ) : (
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
              {sortedData.map((item) => (
                <TableRow key={keyExtractor(item)}>
                  {columns.map((col) => (
                    <TableCell key={col.key} className={col.className}>
                      {col.render(item)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Table Footer inside the Card */}
      {!isLoading && !isError && data.length > 0 && currentPage !== undefined && totalPages !== undefined && onPageChange !== undefined && totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 py-3 border-t dark:border-white/5 border-black/5 bg-muted/10">
          <Button
            variant="outline"
            size="icon"
            className="size-8 rounded-full"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
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
                onClick={() => onPageChange(pageNum)}
              >
                {pageNum}
              </Button>
            )
          })}

          <Button
            variant="outline"
            size="icon"
            className="size-8 rounded-full"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </Card>
  )
}
