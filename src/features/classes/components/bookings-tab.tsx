import { ClipboardList } from 'lucide-react'
import { Card, CardContent } from '#/shared/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/shared/components/ui/table'
import { Badge } from '#/shared/components/ui/badge'
import { Button } from '#/shared/components/ui/button'
import { EmptyState } from '#/shared/components/ui/empty-state'
import { formatDate } from '#/shared/lib/formatters.ts'
import { DAY_LABELS, BOOKING_STATUS_COLORS, BOOKING_STATUS_LABELS } from '../constants.ts'

interface BookingsTabProps {
  bookings: any[]
  isReadOnly: boolean
  onMarkAttendance: (id: string) => void
  onCancelBooking: (id: string) => void
}

export function BookingsTab({
  bookings,
  isReadOnly,
  onMarkAttendance,
  onCancelBooking,
}: BookingsTabProps) {
  return (
    <Card className="transition-all duration-200">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Miembro</TableHead>
              <TableHead>Clase</TableHead>
              <TableHead>Horario</TableHead>
              <TableHead>Entrenador</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Estado</TableHead>
              {!isReadOnly && <TableHead className="text-right">Acciones</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-0">
                  <EmptyState
                    icon={ClipboardList}
                    title="Sin reservas"
                    description="No hay reservas con los filtros seleccionados."
                  />
                </TableCell>
              </TableRow>
            ) : (
              bookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-medium">
                    {booking.member.fullName ||
                      booking.member.firstName + ' ' + booking.member.lastName ||
                      'Miembro #' + booking.memberId}
                  </TableCell>
                  <TableCell>{booking.schedule.class.name || '-'}</TableCell>
                  <TableCell>
                    {`${DAY_LABELS[booking.schedule.dayOfWeek]} ${booking.schedule.startTime} - ${booking.schedule.endTime}`}
                  </TableCell>
                  <TableCell>
                    {booking.schedule.trainer?.user?.name || '-'}
                  </TableCell>
                  <TableCell>{formatDate(booking.bookedAt)}</TableCell>
                  <TableCell>
                    <Badge variant={BOOKING_STATUS_COLORS[booking.status]}>
                      {BOOKING_STATUS_LABELS[booking.status] || booking.status}
                    </Badge>
                  </TableCell>
                  {!isReadOnly && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {booking.status === 'CONFIRMED' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onMarkAttendance(booking.id)}
                            >
                              Asistió
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              onClick={() => onCancelBooking(booking.id)}
                            >
                              Cancelar
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
