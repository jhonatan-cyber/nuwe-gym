import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Umbrella, Sun } from 'lucide-react'
import {
  Card,
  CardContent,
} from '#/shared/components/ui/card'
import { Button } from '#/shared/components/ui/button'
import { LoadingButton } from '#/shared/components/ui/loading-button'
import { Input } from '#/shared/components/ui/input'
import { Label } from '#/shared/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/shared/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '#/shared/components/ui/dialog'
import { Textarea } from '#/shared/components/ui/textarea'
import {
  requestVacation,
  getAvailableVacationDays,
} from '../vacation-server.ts'
import { getEmployees } from '../server.ts'

// ── Request Vacation Dialog ──

export function RequestVacationDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [employeeId, setEmployeeId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')

  const { data: employeesList } = useQuery({
    queryKey: ['employees'],
    queryFn: getEmployees,
  })

  const { data: availability } = useQuery({
    queryKey: ['vacationDays', employeeId],
    queryFn: () => getAvailableVacationDays({ data: { employeeId } }),
    enabled: !!employeeId,
  })

  const mutation = useMutation({
    mutationFn: requestVacation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacations'] })
      toast.success('Solicitud de vacaciones creada')
      onClose()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!employeeId || !startDate || !endDate) {
      toast.error('Completá todos los campos obligatorios')
      return
    }
    mutation.mutate({ data: { employeeId, startDate, endDate, reason } })
  }

  const start = new Date(startDate)
  const end = new Date(endDate)
  const calcDays = startDate && endDate
    ? Math.max(0, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1)
    : 0

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-black">Solicitar Vacaciones</DialogTitle>
          <DialogDescription>
            Seleccioná el miembro del personal y las fechas para solicitar vacaciones.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider">Personal *</Label>
            <Select value={employeeId} onValueChange={setEmployeeId}>
              <SelectTrigger className="rounded-2xl border-border/10">
                <SelectValue placeholder="Seleccionar personal" />
              </SelectTrigger>
              <SelectContent>
                {employeesList?.filter((e) => e.status === 'ACTIVE').map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.fullName} · {emp.position}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {availability && (
            <Card className="rounded-2xl bg-muted/20 border-border/5">
              <CardContent className="p-3 flex items-center gap-3">
                <Umbrella className="size-5 text-primary shrink-0" />
                <div className="text-xs">
                  <p className="font-bold">
                    {availability.available} / {availability.total} días disponibles
                  </p>
                  <p className="text-muted-foreground">
                    Usados: {availability.used} en {availability.year}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider">Fecha inicio *</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-2xl border-border/10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider">Fecha fin *</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-2xl border-border/10"
              />
            </div>
          </div>

          {calcDays > 0 && (
            <p className="text-xs text-muted-foreground">
              Total: <strong className="text-foreground">{calcDays} días</strong>
              {availability && calcDays > availability.available && (
                <span className="text-destructive ml-2">⚠️ Excede los días disponibles</span>
              )}
            </p>
          )}

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider">Motivo</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Opcional..."
              rows={2}
              className="rounded-2xl border-border/10"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} className="rounded-full font-semibold">
              Cancelar
            </Button>
            <LoadingButton
              type="submit"
              isLoading={mutation.isPending}
              disabled={!employeeId || !startDate || !endDate || (availability && calcDays > availability.available)}
              className="rounded-full font-bold"
            >
              <Sun className="size-4 mr-1.5" />
              Solicitar
            </LoadingButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
