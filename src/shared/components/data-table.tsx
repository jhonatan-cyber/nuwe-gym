import type { ReactNode } from 'react'
import { Card, CardContent } from '#/shared/components/ui/card.tsx'
import { Skeleton } from '#/shared/components/ui/skeleton.tsx'
import { ErrorState } from '#/shared/components/ui/error-state.tsx'
import { EmptyState } from '#/shared/components/ui/empty-state.tsx'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/shared/components/ui/table.tsx'

interface Column<T> {
  key: string
  label: string
  render: (item: T) => ReactNode
  className?: string
  headerClassName?: string
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
}: DataTableProps<T>) {
  return (
    <Card>
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
            <div className="text-center py-8 text-muted-foreground">{loadingMessage}</div>
          )
        ) : data.length === 0 ? (
          <EmptyState description={emptyMessage} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead key={col.key} className={col.headerClassName}>
                    {col.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => (
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
    </Card>
  )
}
