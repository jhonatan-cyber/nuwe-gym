import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Gift } from 'lucide-react'
import { Button } from '#/shared/components/ui/button'
import { LoadingButton } from '#/shared/components/ui/loading-button'
import { Input } from '#/shared/components/ui/input'
import { NumericInput } from '#/shared/components/ui/numeric-input'
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
import { createBonus } from '../bonus-server.ts'
import { getEmployees } from '../server.ts'

export const BONUS_TYPES = [
  { value: 'PERFORMANCE', label: 'Desempeño' },
  { value: 'COMMISSION', label: 'Comisión' },
  { value: 'SPECIAL', label: 'Especial' },
  { value: 'HOLIDAY', label: 'Aguinaldo/Vacaciones' },
  { value: 'BIRTHDAY', label: 'Cumpleaños' },
  { value: 'OTHER', label: 'Otro' },
] as const

export function CreateBonusDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [employeeId, setEmployeeId] = useState('')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [type, setType] = useState('OTHER')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  const { data: employeesList } = useQuery({
    queryKey: ['employees'],
    queryFn: getEmployees,
  })

  const mutation = useMutation({
    mutationFn: createBonus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bonuses'] })
      queryClient.invalidateQueries({ queryKey: ['payroll'] })
      toast.success('Bonificación creada')
      onClose()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!employeeId || !amount || !reason) {
      toast.error('Completá todos los campos obligatorios')
      return
    }
    mutation.mutate({
      data: { employeeId, amount, reason, type: type as any, date },
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-black">
            Nueva Bonificación
          </DialogTitle>
          <DialogDescription>
            Creá una bonificación para un miembro del personal. Se incluirá automáticamente
            en la próxima nómina.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider">
              Personal *
            </Label>
            <Select value={employeeId} onValueChange={setEmployeeId}>
              <SelectTrigger className="rounded-2xl border-border/10">
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                {employeesList
                  ?.filter((e) => e.status === 'ACTIVE')
                  .map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.fullName}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider">
                Monto *
              </Label>
              <NumericInput
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="rounded-2xl border-border/10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider">
                Tipo
              </Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="rounded-2xl border-border/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BONUS_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider">
              Motivo *
            </Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej: Bono por desempeño mensual"
              className="rounded-2xl border-border/10"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider">
              Fecha
            </Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-2xl border-border/10"
            />
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
              <Gift className="size-4 mr-1.5" />
              Crear Bonificación
            </LoadingButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
