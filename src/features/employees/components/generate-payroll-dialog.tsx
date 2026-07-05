import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CalendarDays, TrendingUp } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '#/shared/components/ui/dialog'
import { Input } from '#/shared/components/ui/input'
import { Label } from '#/shared/components/ui/label'
import { Separator } from '#/shared/components/ui/separator'
import { Button } from '#/shared/components/ui/button'
import { LoadingButton } from '#/shared/components/ui/loading-button'
import { generatePayroll } from '../payroll-server.ts'
import { getEmployees } from '../server.ts'

export function GeneratePayrollDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [selectedAll, setSelectedAll] = useState(true)
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])
  const [includeCommissions, setIncludeCommissions] = useState(false)

  const { data: employeesList } = useQuery({
    queryKey: ['employees'],
    queryFn: getEmployees,
  })

  const mutation = useMutation({
    mutationFn: generatePayroll,
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] })
      queryClient.invalidateQueries({ queryKey: ['payrollStats'] })
      const created = results.filter((r) => r.status === 'CREATED').length
      const skipped = results.filter((r) => r.status === 'YA_EXISTE').length
      toast.success(
        `Nómina generada: ${created} creada${skipped > 0 ? `, ${skipped} ya existían` : ''}`,
      )
      onClose()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!periodStart || !periodEnd) {
      toast.error('Seleccioná el período')
      return
    }
    mutation.mutate({
      data: {
        periodStart,
        periodEnd,
        employeeIds: selectedAll ? undefined : selectedEmployees,
        includeCommissions,
      },
    })
  }

  const activeEmployees =
    employeesList?.filter((e) => e.status === 'ACTIVE') ?? []

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-black">
            Generar Nómina
          </DialogTitle>
          <DialogDescription>
            Seleccioná el período y los miembros del personal para generar los recibos de
            sueldo.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider">
                Período desde *
              </Label>
              <Input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="rounded-2xl border-border/10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider">
                Período hasta *
              </Label>
              <Input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="rounded-2xl border-border/10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="allEmployees"
                checked={selectedAll}
                onChange={(e) => setSelectedAll(e.target.checked)}
                className="rounded border-border/10"
              />
              <Label
                htmlFor="allEmployees"
                className="text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Todos los personal activos ({activeEmployees.length})
              </Label>
            </div>
            {!selectedAll && (
              <div className="max-h-32 overflow-y-auto space-y-1">
                {activeEmployees.map((emp) => (
                  <label
                    key={emp.id}
                    className="flex items-center gap-2 px-2 py-1 hover:bg-muted/20 rounded-lg cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedEmployees.includes(emp.id)}
                      onChange={(e) => {
                        if (e.target.checked)
                          setSelectedEmployees([...selectedEmployees, emp.id])
                        else
                          setSelectedEmployees(
                            selectedEmployees.filter((id) => id !== emp.id),
                          )
                      }}
                      className="rounded border-border/10"
                    />
                    <span className="text-xs">{emp.fullName}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <Separator className="border-border/5" />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="includeCommissions"
              checked={includeCommissions}
              onChange={(e) => setIncludeCommissions(e.target.checked)}
              className="rounded border-border/10"
            />
            <Label
              htmlFor="includeCommissions"
              className="text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1.5"
            >
              <TrendingUp className="size-3.5 text-emerald-500" />
              Incluir comisiones de entrenadores
            </Label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="rounded-full font-semibold"
            >
              Cancelar
            </Button>
            <LoadingButton
              type="submit"
              isLoading={mutation.isPending}
              className="rounded-full font-bold"
            >
              <CalendarDays className="size-4 mr-1.5" />
              Generar Nómina
            </LoadingButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
