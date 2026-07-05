import { TrendingUp } from 'lucide-react'
import { CardContent } from '#/shared/components/ui/card'
import { Badge } from '#/shared/components/ui/badge'
import { Input } from '#/shared/components/ui/input'
import { Skeleton } from '#/shared/components/ui/skeleton'
import type { EmployeeCommissionInfo } from '../commission-server.ts'

interface CommissionPeriod {
  start: string
  end: string
}

interface CommissionsTabContentProps {
  commissionLoading: boolean
  commissionData: EmployeeCommissionInfo[] | undefined
  commissionPeriod: CommissionPeriod
  setCommissionPeriod: React.Dispatch<React.SetStateAction<CommissionPeriod>>
}

export function CommissionsTabContent({
  commissionLoading,
  commissionData,
  commissionPeriod,
  setCommissionPeriod,
}: CommissionsTabContentProps) {
  if (commissionLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
    )
  }

  if (!commissionData || commissionData.length === 0) {
    return (
      <CardContent className="flex flex-col items-center justify-center py-12">
        <TrendingUp className="size-12 text-muted-foreground/30 mb-3" />
        <h3 className="font-bold mb-1">
          Sin comisiones de entrenadores
        </h3>
        <p className="text-xs text-muted-foreground">
          No hay personal vinculado como entrenadores o no hay
          ingresos por membresías en el período.
        </p>
      </CardContent>
    )
  }

  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        <div className="flex gap-2 items-center">
          <Input
            type="date"
            value={commissionPeriod.start}
            onChange={(e) =>
              setCommissionPeriod((p) => ({
                ...p,
                start: e.target.value,
              }))
            }
            className="w-36 rounded-xl text-xs h-9 border-border/10"
          />
          <span className="text-xs text-muted-foreground">→</span>
          <Input
            type="date"
            value={commissionPeriod.end}
            onChange={(e) =>
              setCommissionPeriod((p) => ({
                ...p,
                end: e.target.value,
              }))
            }
            className="w-36 rounded-xl text-xs h-9 border-border/10"
          />
        </div>
      </div>
      <div className="divide-y divide-border/5 -mx-6">
        {commissionData.map((c) => (
          <div
            key={c.employeeId}
            className="flex items-center gap-4 px-6 py-4 hover:bg-muted/20 transition-colors"
          >
            <div className="size-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
              <TrendingUp className="size-4 text-emerald-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm">
                  {c.employeeName}
                </p>
                <Badge
                  variant="outline"
                  className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border-emerald-500/20 px-2 py-0.5"
                >
                  {c.commissionRate}%
                </Badge>
                {c.includedInPayroll && (
                  <Badge
                    variant="outline"
                    className="text-[10px] font-bold bg-blue-500/10 text-blue-600 border-blue-500/20 px-2 py-0.5"
                  >
                    En nómina
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {c.assignedMembers} socios asignados · $
                {c.totalMembershipRevenue.toLocaleString()} en
                membresías
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-emerald-500">
                ${c.commissionAmount.toLocaleString()}
              </p>
              <p className="text-[10px] text-muted-foreground">
                Comisión calculada
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="px-6 py-4 border-t border-border/5 flex items-center justify-between bg-muted/10">
        <div className="text-sm">
          <span className="text-muted-foreground">
            Total personal con comisión:{' '}
          </span>
          <span className="font-bold">
            {
              commissionData.filter((c) => c.commissionAmount > 0)
                .length
            }
          </span>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">
            Total comisiones
          </p>
          <p className="text-lg font-bold text-emerald-500">
            $
            {commissionData
              .reduce((s, c) => s + c.commissionAmount, 0)
              .toLocaleString()}
          </p>
        </div>
      </div>
    </>
  )
}
