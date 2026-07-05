import { CheckCircle2, Banknote } from 'lucide-react'
import { CardContent } from '#/shared/components/ui/card'
import { Button } from '#/shared/components/ui/button'
import { Badge } from '#/shared/components/ui/badge'
import { Skeleton } from '#/shared/components/ui/skeleton'
import { cn } from '#/shared/lib/utils.ts'
import type { UseMutationResult } from '@tanstack/react-query'

interface PayrollRecord {
  id: string
  employee?: { fullName: string } | null
  periodStart: string | Date
  periodEnd: string | Date
  baseSalary: string | number
  bonusesTotal: string | number
  netSalary: string | number
  status: string
}

interface PayrollTabContentProps {
  payrollLoading: boolean
  payrollRecords: PayrollRecord[] | undefined
  filteredPayroll: PayrollRecord[] | undefined
  markPaidMutation: UseMutationResult<any, Error, any>
}

export function PayrollTabContent({
  payrollLoading,
  payrollRecords,
  filteredPayroll,
  markPaidMutation,
}: PayrollTabContentProps) {
  if (payrollLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
    )
  }

  if (!payrollRecords || payrollRecords.length === 0) {
    return (
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Banknote className="size-12 text-muted-foreground/30 mb-3" />
        <h3 className="font-bold mb-1">Sin nóminas generadas</h3>
        <p className="text-xs text-muted-foreground">
          Generá la primera nómina desde el botón en el panel izquierdo.
        </p>
      </CardContent>
    )
  }

  return (
    <div className="divide-y divide-border/5 -mx-6">
      {filteredPayroll?.map((r) => (
        <div
          key={r.id}
          className="flex items-center gap-4 px-6 py-4 hover:bg-muted/20 transition-colors"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm truncate">
                {r.employee?.fullName ?? '—'}
              </p>
              <Badge
                variant="outline"
                className={cn(
                  'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5',
                  r.status === 'PAID'
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                    : r.status === 'PENDING'
                      ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                      : 'bg-zinc-500/10 text-zinc-600 border-zinc-500/20',
                )}
              >
                {r.status === 'PAID'
                  ? 'Pagado'
                  : r.status === 'PENDING'
                    ? 'Pendiente'
                    : r.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {new Date(r.periodStart).toLocaleDateString('es-AR')}{' '}
              → {new Date(r.periodEnd).toLocaleDateString('es-AR')}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold">
              ${Number(r.netSalary).toLocaleString()}
            </p>
            <p className="text-[10px] text-muted-foreground">
              Base: ${Number(r.baseSalary).toLocaleString()}
              {Number(r.bonusesTotal) > 0 &&
                ` + $${Number(r.bonusesTotal).toLocaleString()}`}
            </p>
          </div>
          {r.status === 'PENDING' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const method =
                  prompt(
                    'Método de pago (BANK_TRANSFER, CASH, CHECK):',
                  ) || 'BANK_TRANSFER'
                markPaidMutation.mutate({
                  data: { id: r.id, paymentMethod: method as any },
                })
              }}
              className="rounded-full h-8 px-3 text-xs font-semibold text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"
            >
              <CheckCircle2 className="size-3.5 mr-1" />
              Pagar
            </Button>
          )}
        </div>
      ))}
    </div>
  )
}
