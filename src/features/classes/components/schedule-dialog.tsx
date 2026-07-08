import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { X } from 'lucide-react'
import { addSchedule, removeSchedule } from '#/features/classes/server.ts'
import { DAY_LABELS } from '../constants.ts'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '#/shared/components/ui/dialog'
import { Input } from '#/shared/components/ui/input'
import { Label } from '#/shared/components/ui/label'
import { Button } from '#/shared/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/shared/components/ui/select'
import { ConfirmDialog } from '#/shared/components/ui/confirm-dialog'

interface ScheduleDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  scheduleClass: any | null // Class with schedules & trainers
  trainersList: any[]
}

export function ScheduleDialog({
  isOpen,
  onOpenChange,
  scheduleClass,
  trainersList,
}: ScheduleDialogProps) {
  const queryClient = useQueryClient()
  const [scheduleForm, setScheduleForm] = useState({
    dayOfWeek: '1',
    startTime: '08:00',
    endTime: '09:00',
    room: '',
    trainerId: '',
  })
  const [deletingScheduleId, setDeletingScheduleId] = useState<string | null>(
    null,
  )

  const addScheduleMutation = useMutation({
    mutationFn: addSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] })
      queryClient.invalidateQueries({ queryKey: ['weekly-schedule'] })
      toast.success('Horario agregado')
      setScheduleForm({
        dayOfWeek: '1',
        startTime: '08:00',
        endTime: '09:00',
        room: '',
        trainerId: '',
      })
    },
    onError: () => toast.error('Error al agregar horario'),
  })

  const removeScheduleMutation = useMutation({
    mutationFn: removeSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] })
      queryClient.invalidateQueries({ queryKey: ['weekly-schedule'] })
      toast.success('Horario eliminado')
    },
    onError: () => toast.error('Error al eliminar horario'),
  })

  function handleAddSchedule() {
    if (!scheduleClass) return
    addScheduleMutation.mutate({
      data: {
        classId: scheduleClass.id,
        dayOfWeek: Number(scheduleForm.dayOfWeek),
        startTime: scheduleForm.startTime,
        endTime: scheduleForm.endTime,
        room: scheduleForm.room || undefined,
        trainerId: scheduleForm.trainerId || undefined,
      },
    })
  }

  function handleConfirmRemoveSchedule() {
    if (deletingScheduleId !== null) {
      removeScheduleMutation.mutate({ data: { id: deletingScheduleId } })
      setDeletingScheduleId(null)
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          {scheduleClass && (
            <>
              <DialogHeader>
                <DialogTitle>Horarios - {scheduleClass.name}</DialogTitle>
                <DialogDescription>
                  Agregá o eliminá horarios para esta clase.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {scheduleClass.schedules.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No hay horarios configurados.
                    </p>
                  ) : (
                    scheduleClass.schedules.map((sched: any) => (
                      <div
                        key={sched.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="size-3 rounded-full shrink-0"
                            style={{ backgroundColor: scheduleClass.color }}
                          />
                          <div>
                            <p className="text-sm font-medium">
                              {DAY_LABELS[sched.dayOfWeek]} {sched.startTime} -{' '}
                              {sched.endTime}
                            </p>
                            {sched.room && (
                              <p className="text-xs text-muted-foreground">
                                Sala: {sched.room}
                              </p>
                            )}
                            {sched.trainer && (
                              <p className="text-xs text-muted-foreground">
                                Prof: {sched.trainer.user.name}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingScheduleId(sched.id)}
                        >
                          <X className="size-4 text-destructive" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-3">Agregar Horario</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-1.5">
                      <Label className="text-xs">Día</Label>
                      <Select
                        value={scheduleForm.dayOfWeek}
                        onValueChange={(v) =>
                          setScheduleForm({ ...scheduleForm, dayOfWeek: v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DAY_LABELS.map((label, i) => (
                            <SelectItem key={i} value={String(i)}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-1.5">
                      <Label className="text-xs">Sala (opcional)</Label>
                      <Input
                        value={scheduleForm.room}
                        onChange={(e) =>
                          setScheduleForm({
                            ...scheduleForm,
                            room: e.target.value,
                          })
                        }
                        placeholder="Ej: Sala A"
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label className="text-xs">Entrenador (opcional)</Label>
                      <Select
                        value={scheduleForm.trainerId}
                        onValueChange={(v) =>
                          setScheduleForm({ ...scheduleForm, trainerId: v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sin asignar" />
                        </SelectTrigger>
                        <SelectContent>
                          {trainersList.map((trainer) => (
                            <SelectItem key={trainer.id} value={trainer.id}>
                              {trainer.user.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-1.5">
                      <Label className="text-xs">Inicio</Label>
                      <Input
                        type="time"
                        value={scheduleForm.startTime}
                        onChange={(e) =>
                          setScheduleForm({
                            ...scheduleForm,
                            startTime: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label className="text-xs">Fin</Label>
                      <Input
                        type="time"
                        value={scheduleForm.endTime}
                        onChange={(e) =>
                          setScheduleForm({
                            ...scheduleForm,
                            endTime: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <Button
                    className="mt-3 w-full"
                    size="sm"
                    onClick={handleAddSchedule}
                    disabled={addScheduleMutation.isPending}
                  >
                    {addScheduleMutation.isPending
                      ? 'Agregando...'
                      : 'Agregar Horario'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deletingScheduleId !== null}
        onOpenChange={() => setDeletingScheduleId(null)}
        title="Eliminar Horario"
        description="¿Eliminar este horario?"
        confirmText="Eliminar"
        variant="destructive"
        onConfirm={handleConfirmRemoveSchedule}
      />
    </>
  )
}
