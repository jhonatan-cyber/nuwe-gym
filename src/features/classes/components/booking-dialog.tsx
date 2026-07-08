import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getBookings, cancelBooking, markAttendance } from '#/features/classes/server.ts'
import { formatDateTime } from '#/shared/lib/formatters.ts'
import { DAY_LABELS, BOOKING_STATUS_COLORS, BOOKING_STATUS_LABELS } from '../constants.ts'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '#/shared/components/ui/dialog'
import { Badge } from '#/shared/components/ui/badge'
import { Button } from '#/shared/components/ui/button'

interface BookingDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  selectedSchedule: any | null // ClassScheduleWithDetails
}

export function BookingDialog({
  isOpen,
  onOpenChange,
  selectedSchedule,
}: BookingDialogProps) {
  const queryClient = useQueryClient()

  const { data: scheduleBookings = [] } = useQuery({
    queryKey: ['schedule-bookings', selectedSchedule?.id],
    queryFn: () =>
      getBookings({ data: {} }).then((all) =>
        all.filter((b) => b.classScheduleId === selectedSchedule!.id),
      ),
    enabled: !!selectedSchedule && isOpen,
  })

  const cancelBookingMutation = useMutation({
    mutationFn: cancelBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({ queryKey: ['schedule-bookings'] })
      toast.success('Reserva cancelada')
    },
    onError: () => toast.error('Error al cancelar reserva'),
  })

  const markAttendanceMutation = useMutation({
    mutationFn: markAttendance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({ queryKey: ['schedule-bookings'] })
      toast.success('Asistencia registrada')
    },
    onError: () => toast.error('Error al registrar asistencia'),
  })

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        {selectedSchedule && (
          <>
            <DialogHeader>
              <DialogTitle>
                Reservas - {selectedSchedule.class.name}
              </DialogTitle>
              <DialogDescription>
                {`${DAY_LABELS[selectedSchedule.dayOfWeek]} ${selectedSchedule.startTime} - ${selectedSchedule.endTime}`}
                {selectedSchedule.trainer && (
                  <> — Prof. {selectedSchedule.trainer.user.name}</>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {scheduleBookings.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay reservas para este horario.
                </p>
              ) : (
                scheduleBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {booking.member.fullName || 'Miembro #' + booking.memberId}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(booking.bookedAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={BOOKING_STATUS_COLORS[booking.status]}>
                        {BOOKING_STATUS_LABELS[booking.status] ||
                          booking.status}
                      </Badge>
                      {booking.status === 'CONFIRMED' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              markAttendanceMutation.mutate({
                                data: { id: booking.id },
                              })
                            }
                          >
                            Asistió
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() =>
                              cancelBookingMutation.mutate({
                                data: { id: booking.id },
                              })
                            }
                          >
                            Cancelar
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
