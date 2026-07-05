import { Trash2, Gift, Medal } from 'lucide-react'
import { CardContent } from '#/shared/components/ui/card'
import { Button } from '#/shared/components/ui/button'
import { Skeleton } from '#/shared/components/ui/skeleton'
import type { UseMutationResult } from '@tanstack/react-query'

const BONUS_TYPES = [
  { value: 'PERFORMANCE', label: 'Desempeño' },
  { value: 'COMMISSION', label: 'Comisión' },
  { value: 'SPECIAL', label: 'Especial' },
  { value: 'HOLIDAY', label: 'Aguinaldo/Vacaciones' },
  { value: 'BIRTHDAY', label: 'Cumpleaños' },
  { value: 'OTHER', label: 'Otro' },
] as const

interface Bonus {
  id: string
  employee?: { fullName: string } | null
  amount: string | number
  reason: string
  type: string
}

interface BonusesTabContentProps {
  bonusesLoading: boolean
  bonuses: Bonus[] | undefined
  filteredBonuses: Bonus[] | undefined
  deleteBonusMutation: UseMutationResult<any, Error, any>
}

export function BonusesTabContent({
  bonusesLoading,
  bonuses,
  filteredBonuses,
  deleteBonusMutation,
}: BonusesTabContentProps) {
  if (bonusesLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
    )
  }

  if (!bonuses || bonuses.length === 0) {
    return (
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Gift className="size-12 text-muted-foreground/30 mb-3" />
        <h3 className="font-bold mb-1">Sin bonificaciones</h3>
        <p className="text-xs text-muted-foreground">
          Creá bonificaciones desde el panel izquierdo.
        </p>
      </CardContent>
    )
  }

  return (
    <div className="divide-y divide-border/5 -mx-6">
      {filteredBonuses?.map((b) => (
        <div
          key={b.id}
          className="flex items-center gap-4 px-6 py-4 hover:bg-muted/20 transition-colors group"
        >
          <div className="size-9 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
            <Medal className="size-4 text-amber-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">
              {b.employee?.fullName ?? '—'}
            </p>
            <p className="text-xs text-muted-foreground">
              {BONUS_TYPES.find((t) => t.value === b.type)?.label ??
                b.type}{' '}
              · {b.reason}
            </p>
          </div>
          <p className="text-sm font-bold text-emerald-500">
            +${Number(b.amount).toLocaleString()}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (window.confirm('¿Eliminar esta bonificación?')) {
                deleteBonusMutation.mutate({ data: { id: b.id } })
              }
            }}
            className="rounded-full h-8 w-8 p-0 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ))}
    </div>
  )
}
