import { useQuery } from '@tanstack/react-query'
import { Button } from '#/shared/components/ui/button'
import { Skeleton } from '#/shared/components/ui/skeleton'
import { Badge } from '#/shared/components/ui/badge'
import { Separator } from '#/shared/components/ui/separator'
import { cn } from '#/shared/lib/utils.ts'
import { getEmployeeAttendance } from '../attendance-server.ts'
import { ATTENDANCE_STATUS_LABELS, ATTENDANCE_STATUS_COLORS } from '../attendance-types.ts'
import type { TodayAttendanceRow } from '../attendance-types.ts'

export function HistoryDialog({
  employee,
  onClose,
}: {
  employee: TodayAttendanceRow | null
  onClose: () => void
}) {
  const { data: history, isLoading } = useQuery({
    queryKey: ['employeeAttendance', employee?.employeeId],
    queryFn: () => getEmployeeAttendance({ data: { employeeId: employee!.employeeId, days: 30 } }),
    enabled: !!employee,
  })

  if (!employee) return null

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-2xl shadow-2xl border border-border/10 max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-black">{employee.fullName}</h3>
              <p className="text-xs text-muted-foreground">Historial últimos 30 días</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="rounded-full">✕</Button>
          </div>
          <Separator className="mb-4" />
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full rounded-xl" />
              <Skeleton className="h-8 w-full rounded-xl" />
              <Skeleton className="h-8 w-full rounded-xl" />
            </div>
          ) : !history || history.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Sin registros en los últimos 30 días</p>
          ) : (
            <div className="space-y-1">
              {history.map((r) => (
                <div key={r.id} className="flex items-center justify-between p-2 rounded-xl bg-muted/20 text-xs">
                  <span className="font-semibold">{r.date.toLocaleDateString('es-AR')}</span>
                  <span className="text-muted-foreground">
                    {r.clockIn.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    {r.clockOut ? ` → ${r.clockOut.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}` : ' → ?'}
                  </span>
                  <Badge variant="outline" className={cn('text-[9px] font-bold px-1.5 py-0', ATTENDANCE_STATUS_COLORS[r.status as keyof typeof ATTENDANCE_STATUS_COLORS])}>
                    {ATTENDANCE_STATUS_LABELS[r.status as keyof typeof ATTENDANCE_STATUS_LABELS]}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
