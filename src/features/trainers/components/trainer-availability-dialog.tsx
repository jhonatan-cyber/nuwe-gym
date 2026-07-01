import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Plus, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { setAvailability } from '#/features/trainers/server.ts'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/shared/components/ui/dialog'
import { Button } from '#/shared/components/ui/button'
import { LoadingButton } from '#/shared/components/ui/loading-button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/shared/components/ui/select'
import { Label } from '#/shared/components/ui/label'
import type { TrainerCalendarEntry, AvailabilitySlot } from '#/features/trainers/types.ts'

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

const HOURS = Array.from({ length: 24 }, (_, i) =>
  `${i.toString().padStart(2, '0')}:00`,
)

interface SlotForm {
  dayOfWeek: string
  startTime: string
  endTime: string
}

interface TrainerAvailabilityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  trainer: TrainerCalendarEntry | null
  isAdmin: boolean
}

export function TrainerAvailabilityDialog({
  open,
  onOpenChange,
  trainer,
  isAdmin,
}: TrainerAvailabilityDialogProps) {
  const queryClient = useQueryClient()
  const [slots, setSlots] = useState<SlotForm[]>([])

  useEffect(() => {
    if (trainer && open) {
      setSlots(
        trainer.availability.length > 0
          ? trainer.availability.map((s: AvailabilitySlot) => ({
              dayOfWeek: String(s.dayOfWeek),
              startTime: s.startTime,
              endTime: s.endTime,
            }))
          : [{ dayOfWeek: '1', startTime: '08:00', endTime: '17:00' }],
      )
    }
  }, [trainer, open])

  const mutation = useMutation({
    mutationFn: setAvailability,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainer-schedule'] })
      queryClient.invalidateQueries({ queryKey: ['trainers'] })
      toast.success('Disponibilidad actualizada')
      onOpenChange(false)
    },
    onError: (err: Error) => toast.error(err.message || 'Error al actualizar disponibilidad'),
  })

  function addSlot() {
    setSlots([...slots, { dayOfWeek: '1', startTime: '08:00', endTime: '17:00' }])
  }

  function removeSlot(idx: number) {
    setSlots(slots.filter((_, i) => i !== idx))
  }

  function updateSlot(idx: number, field: keyof SlotForm, value: string) {
    setSlots(slots.map((s, i) => (i === idx ? { ...s, [field]: value } : s)))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!trainer) return

    const validatedSlots = slots.map((s) => ({
      dayOfWeek: parseInt(s.dayOfWeek) as 0 | 1 | 2 | 3 | 4 | 5 | 6,
      startTime: s.startTime,
      endTime: s.endTime,
    }))

    mutation.mutate({ data: { trainerId: trainer.id, slots: validatedSlots } })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              Disponibilidad de {trainer?.name || '...'}
            </DialogTitle>
            <DialogDescription>
              Configurá los horarios disponibles del entrenador.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 my-4">
            {slots.map((slot, idx) => (
              <div key={idx} className="flex items-center gap-2 p-3 rounded-xl bg-muted/30 border border-border/10">
                <Clock className="size-4 text-muted-foreground shrink-0" />
                <div className="grid grid-cols-3 gap-2 flex-1">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Día</Label>
                    <Select value={slot.dayOfWeek} onValueChange={(v) => updateSlot(idx, 'dayOfWeek', v)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DAY_NAMES.map((name, i) => (
                          <SelectItem key={i} value={String(i)} className="text-xs">
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Desde</Label>
                    <Select value={slot.startTime} onValueChange={(v) => updateSlot(idx, 'startTime', v)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {HOURS.map((h) => (
                          <SelectItem key={h} value={h} className="text-xs">
                            {h}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Hasta</Label>
                    <Select value={slot.endTime} onValueChange={(v) => updateSlot(idx, 'endTime', v)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {HOURS.map((h) => (
                          <SelectItem key={h} value={h} className="text-xs">
                            {h}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {slots.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" className="size-7 shrink-0" onClick={() => removeSlot(idx)}>
                    <X className="size-3.5" />
                  </Button>
                )}
              </div>
            ))}

            <Button type="button" variant="outline" size="sm" className="w-full gap-1.5" onClick={addSlot}>
              <Plus className="size-3.5" /> Agregar horario
            </Button>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <LoadingButton type="submit" isLoading={mutation.isPending} disabled={!isAdmin}>
              Guardar
            </LoadingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
