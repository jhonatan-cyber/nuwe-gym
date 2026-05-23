import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit2, Trash2, Calendar, Clock, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  getClasses,
  createClass,
  updateClass,
  deleteClass,
  addSchedule,
  removeSchedule,
  getWeeklySchedule,
  getBookings,
  cancelBooking,
  markAttendance,
} from '#/features/classes/server.ts'
import { formatDate, formatDateTime } from '#/shared/lib/formatters.ts'

import { Button } from '#/shared/components/ui/button'
import { LoadingButton } from '#/shared/components/ui/loading-button'
import { Card, CardContent, CardHeader, CardTitle } from '#/shared/components/ui/card'
import { Input } from '#/shared/components/ui/input'
import { Label } from '#/shared/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/shared/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/shared/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/shared/components/ui/table'
import { Badge } from '#/shared/components/ui/badge'
import { Skeleton } from '#/shared/components/ui/skeleton'

interface ClassesPageProps {
  userRole: string
}

const CLASS_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316']

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const DAY_LABELS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

const TIME_SLOTS = Array.from({ length: 17 }, (_, i) => {
  const hour = i + 6
  return `${hour.toString().padStart(2, '0')}:00`
})

const BOOKING_STATUS_COLORS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  CONFIRMED: 'default',
  CANCELLED: 'secondary',
  ATTENDED: 'outline',
}

const BOOKING_STATUS_LABELS: Record<string, string> = {
  CONFIRMED: 'Confirmada',
  CANCELLED: 'Cancelada',
  ATTENDED: 'Asistió',
}

type Tab = 'classes' | 'schedule' | 'bookings'

export function ClassesPage({ userRole }: ClassesPageProps) {
  const queryClient = useQueryClient()
  const isReadOnly = userRole === 'TRAINER'
  const isAdmin = userRole === 'ADMIN'
  const [activeTab, setActiveTab] = useState<Tab>('classes')

  const [classDialogOpen, setClassDialogOpen] = useState(false)
  const [classForm, setClassForm] = useState({ name: '', description: '', color: '#3b82f6', capacity: 20 })

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deletingClassId, setDeletingClassId] = useState<number | null>(null)

  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false)
  const [scheduleForm, setScheduleForm] = useState({ dayOfWeek: '1', startTime: '08:00', endTime: '09:00', room: '' })

  const [bookingDialogOpen, setBookingDialogOpen] = useState(false)

  const [filterClassId, setFilterClassId] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const { data: classesList = [], isLoading: classesLoading } = useQuery({
    queryKey: ['classes'],
    queryFn: () => getClasses(),
  })

  const { data: weeklySchedule = [] } = useQuery({
    queryKey: ['weekly-schedule'],
    queryFn: () => getWeeklySchedule(),
  })

  const [editingClass, setEditingClass] = useState<typeof classesList[number] | null>(null)
  const [scheduleClass, setScheduleClass] = useState<typeof classesList[number] | null>(null)
  const [selectedScheduleForBookings, setSelectedScheduleForBookings] = useState<typeof weeklySchedule[number] | null>(null)

  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings', filterClassId, filterStatus],
    queryFn: () =>
      getBookings({
        data: {
          classId: filterClassId !== 'all' ? Number(filterClassId) : undefined,
          status: filterStatus !== 'all' ? filterStatus : undefined,
        },
      }),
  })

  const { data: scheduleBookings = [] } = useQuery({
    queryKey: ['schedule-bookings', selectedScheduleForBookings?.id],
    queryFn: () =>
      getBookings({ data: {} }).then((all) =>
        all.filter((b) => b.classScheduleId === selectedScheduleForBookings!.id),
      ),
    enabled: !!selectedScheduleForBookings,
  })

  const createClassMutation = useMutation({
    mutationFn: createClass,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] })
      setClassDialogOpen(false)
      toast.success('Clase creada exitosamente')
    },
    onError: () => toast.error('Error al crear la clase'),
  })

  const updateClassMutation = useMutation({
    mutationFn: updateClass,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] })
      setClassDialogOpen(false)
      toast.success('Clase actualizada')
    },
    onError: () => toast.error('Error al actualizar la clase'),
  })

  const deleteClassMutation = useMutation({
    mutationFn: deleteClass,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] })
      setDeleteConfirmOpen(false)
      toast.success('Clase eliminada')
    },
    onError: () => toast.error('Error al eliminar la clase'),
  })

  const addScheduleMutation = useMutation({
    mutationFn: addSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] })
      queryClient.invalidateQueries({ queryKey: ['weekly-schedule'] })
      toast.success('Horario agregado')
      setScheduleForm({ dayOfWeek: '1', startTime: '08:00', endTime: '09:00', room: '' })
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

  function handleOpenClassDialog(classItem?: typeof classesList[number]) {
    if (classItem) {
      setEditingClass(classItem)
      setClassForm({
        name: classItem.name,
        description: classItem.description || '',
        color: classItem.color || '#3b82f6',
        capacity: classItem.capacity,
      })
    } else {
      setEditingClass(null)
      setClassForm({ name: '', description: '', color: '#3b82f6', capacity: 20 })
    }
    setClassDialogOpen(true)
  }

  function handleClassSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (editingClass) {
      updateClassMutation.mutate({ data: { id: editingClass.id, ...classForm } })
    } else {
      createClassMutation.mutate({ data: classForm })
    }
  }

  function handleDeleteClass() {
    if (deletingClassId) {
      deleteClassMutation.mutate({ data: { id: deletingClassId } })
    }
  }

  function handleOpenScheduleDialog(classItem: typeof classesList[number]) {
    setScheduleClass(classItem)
    setScheduleDialogOpen(true)
  }

  function handleAddSchedule() {
    if (!scheduleClass) return
    addScheduleMutation.mutate({
      data: {
        classId: scheduleClass.id,
        dayOfWeek: Number(scheduleForm.dayOfWeek),
        startTime: scheduleForm.startTime,
        endTime: scheduleForm.endTime,
        room: scheduleForm.room || undefined,
      },
    })
  }

  function handleRemoveSchedule(scheduleId: number) {
    if (confirm('¿Eliminar este horario?')) {
      removeScheduleMutation.mutate({ data: { id: scheduleId } })
    }
  }

  function handleOpenBookingDialog(schedule: typeof weeklySchedule[number]) {
    setSelectedScheduleForBookings(schedule)
    setBookingDialogOpen(true)
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'classes', label: 'Clases' },
    { key: 'schedule', label: 'Horarios Semanal' },
    { key: 'bookings', label: 'Reservas' },
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Clases y Horarios</h1>
        <p className="text-muted-foreground">Administrá las clases, horarios y reservas del gimnasio.</p>
      </div>

      <div className="flex gap-1 rounded-lg bg-muted p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.key
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'classes' && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {classesList.length} clase{classesList.length !== 1 ? 's' : ''} registrada{classesList.length !== 1 ? 's' : ''}
            </p>
            {!isReadOnly && (
              <Button onClick={() => handleOpenClassDialog()}>
                <Plus className="mr-2 size-4" />
                Nueva Clase
              </Button>
            )}
          </div>

          <Card className="transition-all duration-200">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Capacidad</TableHead>
                    <TableHead>Horarios</TableHead>
                    {!isReadOnly && <TableHead className="text-right">Acciones</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classesLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 5 }).map((_, j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-4 w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : classesList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No hay clases registradas.
                      </TableCell>
                    </TableRow>
                  ) : (
                    classesList.map((cls) => (
                      <TableRow key={cls.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className="size-4 rounded-full shrink-0"
                              style={{ backgroundColor: cls.color }}
                            />
                            <span className="font-medium">{cls.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-xs truncate">
                          {cls.description || '-'}
                        </TableCell>
                        <TableCell>{cls.capacity} personas</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1">
                            <Clock className="size-3" />
                            {cls.schedules?.length || 0} horario{(cls.schedules?.length || 0) !== 1 ? 's' : ''}
                          </Badge>
                        </TableCell>
                        {!isReadOnly && (
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenScheduleDialog(cls)}
                                title="Gestionar horarios"
                              >
                                <Calendar className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenClassDialog(cls)}
                                title="Editar"
                              >
                                <Edit2 className="size-4" />
                              </Button>
                              {isAdmin && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setDeletingClassId(cls.id)
                                    setDeleteConfirmOpen(true)
                                  }}
                                  title="Eliminar"
                                >
                                  <Trash2 className="size-4 text-destructive" />
                                </Button>
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
        </>
      )}

      {activeTab === 'schedule' && (
        <Card className="transition-all duration-200">
          <CardHeader>
            <CardTitle>Horario Semanal</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-auto">
            <div className="relative min-w-[800px]">
              <div className="flex sticky top-0 z-10 bg-background">
                <div className="w-20 shrink-0 border-b border-r" />
                {[1, 2, 3, 4, 5, 6, 0].map((day) => (
                  <div
                    key={day}
                    className="flex-1 border-b px-2 py-2 text-xs font-medium text-center"
                  >
                    {DAY_NAMES[day]}
                  </div>
                ))}
              </div>
              <div className="relative">
                {TIME_SLOTS.map((slot) => (
                  <div key={slot} className="flex" style={{ height: '60px' }}>
                    <div className="w-20 shrink-0 border-b border-r text-xs text-muted-foreground text-right pr-2 leading-[60px]">
                      {slot}
                    </div>
                    {[1, 2, 3, 4, 5, 6, 0].map((day) => (
                      <div
                        key={`${day}-${slot}`}
                        className="flex-1 border-b hover:bg-muted/30 transition-colors"
                      />
                    ))}
                  </div>
                ))}
                <div className="absolute inset-0 pointer-events-none">
                  {weeklySchedule.map((schedule) => {
                    const [startHour, startMin] = schedule.startTime.split(':').map(Number)
                    const [endHour, endMin] = schedule.endTime.split(':').map(Number)
                    const topOffset = (startHour - 6) * 60 + startMin
                    const height = (endHour - startHour) * 60 + (endMin - startMin)
                    const colIndex = schedule.dayOfWeek === 0 ? 6 : schedule.dayOfWeek - 1
                    return (
                      <button
                        key={schedule.id}
                        className="absolute pointer-events-auto rounded-md px-2 py-1 text-xs text-white overflow-hidden text-left transition-opacity hover:opacity-80 cursor-pointer border border-white/20"
                        style={{
                          backgroundColor: schedule.class.color,
                          top: `${topOffset}px`,
                          height: `${Math.max(height, 30)}px`,
                          left: `calc(80px + (100% - 80px) * ${colIndex} / 7 + 2px)`,
                          width: 'calc((100% - 80px) / 7 - 4px)',
                          zIndex: 5,
                        }}
                        onClick={() => handleOpenBookingDialog(schedule)}
                      >
                        <div className="font-medium truncate">{schedule.class.name}</div>
                        <div className="opacity-80 truncate">
                          {schedule.startTime} - {schedule.endTime}
                        </div>
                        {schedule.room && (
                          <div className="opacity-60 truncate">Sala: {schedule.room}</div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'bookings' && (
        <>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Label className="text-sm">Clase:</Label>
              <Select value={filterClassId} onValueChange={setFilterClassId}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {classesList.map((cls) => (
                    <SelectItem key={cls.id} value={String(cls.id)}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm">Estado:</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmada</SelectItem>
                  <SelectItem value="CANCELLED">Cancelada</SelectItem>
                  <SelectItem value="ATTENDED">Asistió</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground ml-auto">
              {bookings.length} reserva{bookings.length !== 1 ? 's' : ''}
            </p>
          </div>

          <Card className="transition-all duration-200">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Miembro</TableHead>
                    <TableHead>Clase</TableHead>
                    <TableHead>Horario</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estado</TableHead>
                    {!isReadOnly && <TableHead className="text-right">Acciones</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No hay reservas con los filtros seleccionados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    bookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-medium">
                          {booking.member?.fullName || 'Miembro #' + booking.memberId}
                        </TableCell>
                        <TableCell>{booking.schedule?.class?.name || '-'}</TableCell>
                        <TableCell>
                          {booking.schedule
                            ? `${DAY_LABELS[booking.schedule.dayOfWeek]} ${booking.schedule.startTime} - ${booking.schedule.endTime}`
                            : '-'}
                        </TableCell>
                        <TableCell>{formatDate(booking.bookedAt)}</TableCell>
                        <TableCell>
                          <Badge variant={BOOKING_STATUS_COLORS[booking.status] || 'outline'}>
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
                                    onClick={() =>
                                      markAttendanceMutation.mutate({ data: { id: booking.id } })
                                    }
                                  >
                                    Asistió
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive"
                                    onClick={() =>
                                      cancelBookingMutation.mutate({ data: { id: booking.id } })
                                    }
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
        </>
      )}

      <Dialog open={classDialogOpen} onOpenChange={setClassDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleClassSubmit}>
            <DialogHeader>
              <DialogTitle>{editingClass ? 'Editar Clase' : 'Nueva Clase'}</DialogTitle>
              <DialogDescription>
                {editingClass
                  ? 'Actualizá los datos de la clase.'
                  : 'Completá los datos para registrar una nueva clase.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  required
                  value={classForm.name}
                  onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                  placeholder="Ej: Spinning"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="desc">Descripción</Label>
                <Input
                  id="desc"
                  value={classForm.description}
                  onChange={(e) => setClassForm({ ...classForm, description: e.target.value })}
                  placeholder="Descripción opcional"
                />
              </div>
              <div className="grid gap-2">
                <Label>Color</Label>
                <div className="flex gap-2 flex-wrap">
                  {CLASS_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`size-8 rounded-full border-2 transition-all ${
                        classForm.color === color
                          ? 'border-foreground scale-110'
                          : 'border-transparent hover:scale-110'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setClassForm({ ...classForm, color })}
                    />
                  ))}
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="capacity">Capacidad Máxima</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  required
                  value={classForm.capacity}
                  onChange={(e) =>
                    setClassForm({ ...classForm, capacity: Number(e.target.value) })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setClassDialogOpen(false)}>
                Cancelar
              </Button>
              <LoadingButton
                type="submit"
                isLoading={createClassMutation.isPending || updateClassMutation.isPending}
              >
                Guardar
              </LoadingButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Clase</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de eliminar esta clase? Se eliminarán también todos sus horarios y reservas
              asociadas. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteClass}
              disabled={deleteClassMutation.isPending}
            >
              {deleteClassMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Horarios - {scheduleClass?.name}</DialogTitle>
            <DialogDescription>Agregá o eliminá horarios para esta clase.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {scheduleClass?.schedules?.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay horarios configurados.
                </p>
              ) : (
                scheduleClass?.schedules?.map((sched: NonNullable<typeof scheduleClass>['schedules'][number]) => (
                  <div
                    key={sched.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="size-3 rounded-full shrink-0"
                        style={{ backgroundColor: scheduleClass?.color }}
                      />
                      <div>
                        <p className="text-sm font-medium">
                          {DAY_LABELS[sched.dayOfWeek]} {sched.startTime} - {sched.endTime}
                        </p>
                        {sched.room && (
                          <p className="text-xs text-muted-foreground">Sala: {sched.room}</p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveSchedule(sched.id)}
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
                    onValueChange={(v) => setScheduleForm({ ...scheduleForm, dayOfWeek: v })}
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
                    onChange={(e) => setScheduleForm({ ...scheduleForm, room: e.target.value })}
                    placeholder="Ej: Sala A"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs">Inicio</Label>
                  <Input
                    type="time"
                    value={scheduleForm.startTime}
                    onChange={(e) =>
                      setScheduleForm({ ...scheduleForm, startTime: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs">Fin</Label>
                  <Input
                    type="time"
                    value={scheduleForm.endTime}
                    onChange={(e) =>
                      setScheduleForm({ ...scheduleForm, endTime: e.target.value })
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
                {addScheduleMutation.isPending ? 'Agregando...' : 'Agregar Horario'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Reservas - {selectedScheduleForBookings?.class?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedScheduleForBookings
                ? `${DAY_LABELS[selectedScheduleForBookings.dayOfWeek]} ${selectedScheduleForBookings.startTime} - ${selectedScheduleForBookings.endTime}`
                : ''}
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
                    <p className="text-sm font-medium">{booking.member?.fullName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(booking.bookedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={BOOKING_STATUS_COLORS[booking.status] || 'outline'}>
                      {BOOKING_STATUS_LABELS[booking.status] || booking.status}
                    </Badge>
                    {booking.status === 'CONFIRMED' && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            markAttendanceMutation.mutate({ data: { id: booking.id } })
                          }
                        >
                          Asistió
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() =>
                            cancelBookingMutation.mutate({ data: { id: booking.id } })
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
        </DialogContent>
      </Dialog>
    </div>
  )
}
