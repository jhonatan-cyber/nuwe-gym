import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, BookOpen, Calendar, ClipboardList, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { Link } from '@tanstack/react-router'
import {
  getClasses,
  deleteClass,
  getWeeklySchedule,
  getBookings,
  cancelBooking,
  markAttendance,
} from '#/features/classes/server.ts'
import { getTrainers } from '#/features/trainers/server.ts'
import { useCurrentBranch } from '#/shared/hooks/use-current-branch.ts'
import { cn } from '#/shared/lib/utils.ts'
import { ModuleLayout } from '#/shared/components/layout/module-layout.tsx'

import { Button } from '#/shared/components/ui/button'
import { Label } from '#/shared/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/shared/components/ui/select'
import { ConfirmDialog } from '#/shared/components/ui/confirm-dialog'

import { ClassDialog } from './components/class-dialog.tsx'
import { ScheduleDialog } from './components/schedule-dialog.tsx'
import { BookingDialog } from './components/booking-dialog.tsx'
import { ClassesTab } from './components/classes-tab.tsx'
import { ScheduleTab } from './components/schedule-tab.tsx'
import { BookingsTab } from './components/bookings-tab.tsx'

interface ClassesPageProps {
  userRole: string
  userId: string
}

type Tab = 'classes' | 'schedule' | 'bookings'

export function ClassesPage({ userRole, userId }: ClassesPageProps) {
  const queryClient = useQueryClient()
  const isReadOnly = userRole === 'TRAINER'
  const isAdmin = userRole === 'ADMIN'
  const [activeTab, setActiveTab] = useState<Tab>('classes')

  const [classDialogOpen, setClassDialogOpen] = useState(false)
  const [editingClass, setEditingClass] = useState<any | null>(null)

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deletingClassId, setDeletingClassId] = useState<string | null>(null)

  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false)
  const [scheduleClass, setScheduleClass] = useState<any | null>(null)

  const [bookingDialogOpen, setBookingDialogOpen] = useState(false)
  const [selectedScheduleForBookings, setSelectedScheduleForBookings] = useState<any | null>(null)

  const [filterClassId, setFilterClassId] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const { branchId } = useCurrentBranch()

  const { data: trainersList = [] } = useQuery({
    queryKey: ['trainers', branchId],
    queryFn: () => getTrainers({ data: { branchId } }),
    enabled: !!branchId,
  })

  // Si el rol es TRAINER, buscar su perfil para filtrar sus clases
  const currentTrainer =
    isReadOnly ? trainersList.find((t) => t.userId === userId) : null
  const currentTrainerId = currentTrainer?.id

  const { data: classesList = [], isLoading: classesLoading } = useQuery({
    queryKey: ['classes', branchId, currentTrainerId],
    queryFn: () =>
      getClasses({
        data: {
          branchId,
          trainerId: currentTrainerId,
        },
      }),
    enabled: !!branchId,
  })

  const { data: weeklySchedule = [] } = useQuery({
    queryKey: ['weekly-schedule', branchId, currentTrainerId],
    queryFn: () =>
      getWeeklySchedule({
        data: {
          branchId,
          trainerId: currentTrainerId,
        },
      }),
    enabled: !!branchId,
  })

  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings', filterClassId, filterStatus],
    queryFn: () =>
      getBookings({
        data: {
          classId: filterClassId !== 'all' ? filterClassId : undefined,
          status: filterStatus !== 'all' ? filterStatus : undefined,
        },
      }),
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

  function handleOpenClassDialog(classItem?: any) {
    setEditingClass(classItem || null)
    setClassDialogOpen(true)
  }

  function handleDeleteClass() {
    if (deletingClassId) {
      deleteClassMutation.mutate({ data: { id: deletingClassId } })
    }
  }

  function handleOpenScheduleDialog(classItem: any) {
    setScheduleClass(classItem)
    setScheduleDialogOpen(true)
  }

  function handleOpenBookingDialog(schedule: any) {
    setSelectedScheduleForBookings(schedule)
    setBookingDialogOpen(true)
  }

  return (
    <ModuleLayout
      breadcrumb={
        <>
          <Link
            to="/dashboard"
            className="hover:text-foreground transition-colors"
          >
            Dashboard
          </Link>
          <ChevronRight className="size-3 mx-1 inline" />
          <span className="dark:text-white/60 text-foreground/60">Clases</span>
        </>
      }
      title={
        activeTab === 'classes'
          ? 'Gestión de Clases'
          : activeTab === 'schedule'
            ? 'Horario Semanal'
            : 'Historial de Reservas'
      }
      headerActions={
        activeTab === 'classes' &&
        !isReadOnly && (
          <Button onClick={() => handleOpenClassDialog()}>
            <Plus className="mr-2 size-4" />
            Nueva Clase
          </Button>
        )
      }
      leftPanel={
        <div className="flex flex-col gap-6 z-10 w-full">
          {/* Navigation menu */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
              Sección
            </p>
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => setActiveTab('classes')}
                className={cn(
                  'w-full text-left p-3.5 rounded-2xl flex items-center gap-3 transition-all duration-200 border',
                  activeTab === 'classes'
                    ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/20'
                    : 'bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-foreground',
                )}
              >
                <div
                  className={cn(
                    'size-8 rounded-xl flex items-center justify-center shrink-0',
                    activeTab === 'classes'
                      ? 'bg-white/20'
                      : 'bg-black/5 dark:bg-white/5',
                  )}
                >
                  <BookOpen
                    className={cn(
                      'size-4',
                      activeTab === 'classes'
                        ? 'text-white'
                        : 'text-muted-foreground',
                    )}
                  />
                </div>
                <div>
                  <p className="text-xs font-bold">Clases</p>
                  <p
                    className={cn(
                      'text-[9px] font-semibold uppercase tracking-wider',
                      activeTab === 'classes'
                        ? 'text-white/60'
                        : 'text-muted-foreground',
                    )}
                  >
                    Lista y gestión
                  </p>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('schedule')}
                className={cn(
                  'w-full text-left p-3.5 rounded-2xl flex items-center gap-3 transition-all duration-200 border',
                  activeTab === 'schedule'
                    ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/20'
                    : 'bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-foreground',
                )}
              >
                <div
                  className={cn(
                    'size-8 rounded-xl flex items-center justify-center shrink-0',
                    activeTab === 'schedule'
                      ? 'bg-white/20'
                      : 'bg-black/5 dark:bg-white/5',
                  )}
                >
                  <Calendar
                    className={cn(
                      'size-4',
                      activeTab === 'schedule'
                        ? 'text-white'
                        : 'text-muted-foreground',
                    )}
                  />
                </div>
                <div>
                  <p className="text-xs font-bold">Horario Semanal</p>
                  <p
                    className={cn(
                      'text-[9px] font-semibold uppercase tracking-wider',
                      activeTab === 'schedule'
                        ? 'text-white/60'
                        : 'text-muted-foreground',
                    )}
                  >
                    Calendario
                  </p>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('bookings')}
                className={cn(
                  'w-full text-left p-3.5 rounded-2xl flex items-center gap-3 transition-all duration-200 border',
                  activeTab === 'bookings'
                    ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/20'
                    : 'bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-foreground',
                )}
              >
                <div
                  className={cn(
                    'size-8 rounded-xl flex items-center justify-center shrink-0',
                    activeTab === 'bookings'
                      ? 'bg-white/20'
                      : 'bg-black/5 dark:bg-white/5',
                  )}
                >
                  <ClipboardList
                    className={cn(
                      'size-4',
                      activeTab === 'bookings'
                        ? 'text-white'
                        : 'text-muted-foreground',
                    )}
                  />
                </div>
                <div>
                  <p className="text-xs font-bold">Reservas</p>
                  <p
                    className={cn(
                      'text-[9px] font-semibold uppercase tracking-wider',
                      activeTab === 'bookings'
                        ? 'text-white/60'
                        : 'text-muted-foreground',
                    )}
                  >
                    Historial
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Metrics */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
              Métricas
            </p>
            <div className="grid grid-cols-1 gap-2.5">
              <div className="bg-muted p-4 rounded-2xl border border-border/10 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                    Total Clases
                  </p>
                  <p className="text-xl font-black mt-0.5">
                    {classesList.length}
                  </p>
                </div>
              </div>
              <div className="bg-muted p-4 rounded-2xl border border-border/10 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                    Horarios
                  </p>
                  <p className="text-xl font-black text-amber-500 mt-0.5">
                    {weeklySchedule.length}
                  </p>
                </div>
              </div>
              <div className="bg-muted p-4 rounded-2xl border border-border/10 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                    Reservas Filtro
                  </p>
                  <p className="text-xl font-black text-emerald-500 mt-0.5">
                    {bookings.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters (only visible when in bookings tab) */}
          {activeTab === 'bookings' && (
            <div className="space-y-3 pt-2 border-t dark:border-white/5 border-black/5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
                Filtros
              </p>
              <div className="space-y-2">
                <div className="grid gap-1">
                  <Label className="text-[9px] uppercase tracking-wider text-muted-foreground">
                    Clase
                  </Label>
                  <Select
                    value={filterClassId}
                    onValueChange={(v) => setFilterClassId(v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las clases</SelectItem>
                      {classesList.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-1">
                  <Label className="text-[9px] uppercase tracking-wider text-muted-foreground">
                    Estado
                  </Label>
                  <Select
                    value={filterStatus}
                    onValueChange={(v) => setFilterStatus(v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los estados</SelectItem>
                      <SelectItem value="CONFIRMED">Confirmada</SelectItem>
                      <SelectItem value="ATTENDED">Asistió</SelectItem>
                      <SelectItem value="CANCELLED">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </div>
      }
    >
      {activeTab === 'classes' && (
        <ClassesTab
          classesList={classesList}
          classesLoading={classesLoading}
          isReadOnly={isReadOnly}
          isAdmin={isAdmin}
          onManageSchedule={handleOpenScheduleDialog}
          onEdit={handleOpenClassDialog}
          onDelete={(id) => {
            setDeletingClassId(id)
            setDeleteConfirmOpen(true)
          }}
        />
      )}

      {activeTab === 'schedule' && (
        <ScheduleTab
          weeklySchedule={weeklySchedule}
          onOpenBookingDialog={handleOpenBookingDialog}
        />
      )}

      {activeTab === 'bookings' && (
        <BookingsTab
          bookings={bookings}
          isReadOnly={isReadOnly}
          onMarkAttendance={(id) => markAttendanceMutation.mutate({ data: { id } })}
          onCancelBooking={(id) => cancelBookingMutation.mutate({ data: { id } })}
        />
      )}

      <ClassDialog
        isOpen={classDialogOpen}
        onOpenChange={setClassDialogOpen}
        editingClass={editingClass}
        branchId={branchId}
      />

      <ScheduleDialog
        isOpen={scheduleDialogOpen}
        onOpenChange={setScheduleDialogOpen}
        scheduleClass={scheduleClass}
        trainersList={trainersList}
      />

      <BookingDialog
        isOpen={bookingDialogOpen}
        onOpenChange={setBookingDialogOpen}
        selectedSchedule={selectedScheduleForBookings}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Eliminar Clase"
        description="¿Estás seguro de eliminar esta clase? Se eliminarán también todos sus horarios y reservas asociadas. Esta acción no se puede deshacer."
        confirmText="Eliminar"
        variant="destructive"
        onConfirm={handleDeleteClass}
      />
    </ModuleLayout>
  )
}
