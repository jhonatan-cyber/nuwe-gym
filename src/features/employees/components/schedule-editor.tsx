import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Save, Plus, Trash2 } from 'lucide-react'
import { Button } from '#/shared/components/ui/button'
import { LoadingButton } from '#/shared/components/ui/loading-button'
import { Input } from '#/shared/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/shared/components/ui/select'
import { Separator } from '#/shared/components/ui/separator'
import { setEmployeeSchedules } from '../schedule-server.ts'
import { DAY_LABELS } from '../schedule-types.ts'
import type { EmployeeWithSchedule } from '../schedule-types.ts'

// ── Editor for a single employee's schedules ──

export interface SlotForm {
  dayOfWeek: number
  startTime: string
  endTime: string
}

export function ScheduleEditor({
  employee,
  onClose,
}: {
  employee: EmployeeWithSchedule
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [slots, setSlots] = useState<SlotForm[]>(
    employee.schedules.map((s) => ({
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
    })),
  )

  const mutation = useMutation({
    mutationFn: setEmployeeSchedules,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['weeklySchedule'] })
      if (result.conflicts.length > 0) {
        toast.warning(`Guardado con ${result.conflicts.length} conflicto(s) de horario`)
        result.conflicts.forEach((c) => toast.error(c))
      } else {
        toast.success(`${result.saved} horario(s) guardados`)
      }
      onClose()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  function addSlot() {
    setSlots([...slots, { dayOfWeek: 1, startTime: '09:00', endTime: '18:00' }])
  }

  function removeSlot(idx: number) {
    setSlots(slots.filter((_, i) => i !== idx))
  }

  function updateSlot(idx: number, field: keyof SlotForm, value: number | string) {
    setSlots(slots.map((s, i) => (i === idx ? { ...s, [field]: value } : s)))
  }

  function handleSave() {
    const valid = slots.filter((s) => s.startTime && s.endTime)
    mutation.mutate({
      data: {
        employeeId: employee.id,
        slots: valid.map((s) => ({
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          scheduleType: 'REGULAR' as const,
        })),
      },
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-2xl shadow-2xl border border-border/10 max-w-xl w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-black">{employee.fullName}</h3>
              <p className="text-xs text-muted-foreground">{employee.position} · {employee.employeeCode}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="rounded-full">✕</Button>
          </div>
          <Separator className="mb-4" />

          <div className="space-y-3">
            {slots.map((slot, idx) => (
              <div key={idx} className="flex items-center gap-2 p-3 rounded-xl bg-muted/20">
                <Select
                  value={String(slot.dayOfWeek)}
                  onValueChange={(v) => updateSlot(idx, 'dayOfWeek', Number(v))}
                >
                  <SelectTrigger className="w-[120px] rounded-xl h-8 text-xs border-border/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAY_LABELS.map((label, d) => (
                      <SelectItem key={d} value={String(d)}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="time"
                  value={slot.startTime}
                  onChange={(e) => updateSlot(idx, 'startTime', e.target.value)}
                  className="w-28 rounded-xl h-8 text-xs border-border/10"
                />
                <span className="text-xs text-muted-foreground">→</span>
                <Input
                  type="time"
                  value={slot.endTime}
                  onChange={(e) => updateSlot(idx, 'endTime', e.target.value)}
                  className="w-28 rounded-xl h-8 text-xs border-border/10"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSlot(idx)}
                  className="rounded-full h-8 w-8 p-0 text-muted-foreground hover:text-red-500 shrink-0"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={addSlot}
            className="rounded-full mt-3 text-xs font-semibold"
          >
            <Plus className="size-3 mr-1" />
            Agregar horario
          </Button>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border/5">
            <Button variant="ghost" onClick={onClose} className="rounded-full font-semibold">
              Cancelar
            </Button>
            <LoadingButton
              onClick={handleSave}
              isLoading={mutation.isPending}
              className="rounded-full font-bold"
            >
              <Save className="size-4 mr-1.5" />
              Guardar horarios
            </LoadingButton>
          </div>
        </div>
      </div>
    </div>
  )
}
