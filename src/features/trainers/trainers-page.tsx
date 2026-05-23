import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit2, Eye, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  getTrainers,
  getTrainer,
  createTrainer,
  updateTrainer,
  assignMember,
  unassignMember,
  getMyMembers,
  getTrainerUsers,
  setAvailability,
} from '#/features/trainers/server.ts'
import { getMembers } from '#/features/members/server.ts'

import { Button } from '#/shared/components/ui/button'
import { LoadingButton } from '#/shared/components/ui/loading-button'
import { Card, CardContent } from '#/shared/components/ui/card'
import { Input } from '#/shared/components/ui/input'
import { Label } from '#/shared/components/ui/label'
import { Textarea } from '#/shared/components/ui/textarea'
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

interface TrainersPageProps {
  userRole: string
}

const DAY_LABELS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

type Tab = 'trainers' | 'assignments'

export function TrainersPage({ userRole }: TrainersPageProps) {
  const queryClient = useQueryClient()
  const isAdmin = userRole === 'ADMIN'
  const isTrainer = userRole === 'TRAINER'
  const canWrite = isAdmin
  const [activeTab, setActiveTab] = useState<Tab>('trainers')

  // Trainer CRUD
  const [trainerDialogOpen, setTrainerDialogOpen] = useState(false)
  const [trainerForm, setTrainerForm] = useState({
    userId: '',
    specialty: '',
    bio: '',
    commissionRate: '',
  })

  // Detail view
  const [detailTrainerId, setDetailTrainerId] = useState<number | null>(null)

  // Assign dialog
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [assignForm, setAssignForm] = useState({ trainerId: '', memberId: '' })

  // Availability dialog
  const [availDialogOpen, setAvailDialogOpen] = useState(false)
  const [availTrainerId, setAvailTrainerId] = useState<number | null>(null)
  const [availSlots, setAvailSlots] = useState<{ dayOfWeek: string; startTime: string; endTime: string }[]>([])

  // Queries
  const { data: trainers = [], isLoading: trainersLoading } = useQuery({
    queryKey: ['trainers'],
    queryFn: () => getTrainers(),
  })

  const [editingTrainer, setEditingTrainer] = useState<typeof trainers[number] | null>(null)

  const { data: trainerUsers = [] } = useQuery({
    queryKey: ['trainer-users'],
    queryFn: () => getTrainerUsers(),
    enabled: canWrite,
  })

  const { data: membersList = [] } = useQuery({
    queryKey: ['members-for-assign'],
    queryFn: () => getMembers({ data: {} }),
    enabled: canWrite,
  })

  const { data: detailTrainer } = useQuery({
    queryKey: ['trainer-detail', detailTrainerId],
    queryFn: () => getTrainer({ data: { id: detailTrainerId! } }),
    enabled: !!detailTrainerId,
  })

  const { data: myMembers = [] } = useQuery({
    queryKey: ['my-members'],
    queryFn: () => getMyMembers(),
    enabled: isTrainer,
  })

  // Mutations
  const createTrainerMutation = useMutation({
    mutationFn: createTrainer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainers'] })
      setTrainerDialogOpen(false)
      toast.success('Entrenador creado exitosamente')
    },
    onError: (err: Error) => toast.error(err.message || 'Error al crear entrenador'),
  })

  const updateTrainerMutation = useMutation({
    mutationFn: updateTrainer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainers'] })
      setTrainerDialogOpen(false)
      toast.success('Entrenador actualizado')
    },
    onError: () => toast.error('Error al actualizar entrenador'),
  })

  const assignMutation = useMutation({
    mutationFn: assignMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainers'] })
      setAssignDialogOpen(false)
      toast.success('Socio asignado correctamente')
    },
    onError: (err: Error) => toast.error(err.message || 'Error al asignar socio'),
  })

  const unassignMutation = useMutation({
    mutationFn: unassignMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainers'] })
      queryClient.invalidateQueries({ queryKey: ['trainer-detail'] })
      toast.success('Asignación eliminada')
    },
    onError: () => toast.error('Error al eliminar asignación'),
  })

  const setAvailMutation = useMutation({
    mutationFn: setAvailability,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainer-detail'] })
      setAvailDialogOpen(false)
      toast.success('Disponibilidad actualizada')
    },
    onError: () => toast.error('Error al actualizar disponibilidad'),
  })

  function handleOpenCreateDialog() {
    setEditingTrainer(null)
    setTrainerForm({ userId: '', specialty: '', bio: '', commissionRate: '' })
    setTrainerDialogOpen(true)
  }

  function handleOpenEditDialog(trainer: typeof trainers[number]) {
    setEditingTrainer(trainer)
    setTrainerForm({
      userId: trainer.userId,
      specialty: trainer.specialty || '',
      bio: trainer.bio || '',
      commissionRate: trainer.commissionRate || '0',
    })
    setTrainerDialogOpen(true)
  }

  function handleTrainerSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (editingTrainer) {
      updateTrainerMutation.mutate({
        data: {
          id: editingTrainer.id,
          specialty: trainerForm.specialty,
          bio: trainerForm.bio,
          commissionRate: trainerForm.commissionRate,
        },
      })
    } else {
      createTrainerMutation.mutate({ data: trainerForm })
    }
  }

  function handleAssignSubmit() {
    assignMutation.mutate({
      data: {
        trainerId: Number(assignForm.trainerId),
        memberId: Number(assignForm.memberId),
      },
    })
  }

  function handleUnassign(id: number) {
    if (confirm('¿Eliminar esta asignación?')) {
      unassignMutation.mutate({ data: { id } })
    }
  }

  function handleOpenAvailDialog(trainerId: number, slots: typeof availSlots) {
    setAvailTrainerId(trainerId)
    setAvailSlots(
      slots.length > 0
        ? slots.map((s) => ({
            dayOfWeek: String(s.dayOfWeek),
            startTime: s.startTime,
            endTime: s.endTime,
          }))
        : [{ dayOfWeek: '1', startTime: '08:00', endTime: '17:00' }],
    )
    setAvailDialogOpen(true)
  }

  function handleSaveAvailability() {
    if (!availTrainerId) return
    setAvailMutation.mutate({
      data: {
        trainerId: availTrainerId,
        slots: availSlots.map((s) => ({
          dayOfWeek: Number(s.dayOfWeek),
          startTime: s.startTime,
          endTime: s.endTime,
        })),
      },
    })
  }

  function addAvailSlot() {
    setAvailSlots([...availSlots, { dayOfWeek: '1', startTime: '08:00', endTime: '17:00' }])
  }

  function removeAvailSlot(index: number) {
    setAvailSlots(availSlots.filter((_, i) => i !== index))
  }

  function updateAvailSlot(index: number, field: string, value: string) {
    setAvailSlots(availSlots.map((s, i) => (i === index ? { ...s, [field]: value } : s)))
  }

  if (isTrainer) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mis Socios</h1>
          <p className="text-muted-foreground">Socios asignados a tu cargo.</p>
        </div>
        <Card className="transition-all duration-200">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Email</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                      No tenés socios asignados.
                    </TableCell>
                  </TableRow>
                ) : (
                  myMembers.map((member: typeof myMembers[number]) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.fullName}</TableCell>
                      <TableCell>{member.phone || '-'}</TableCell>
                      <TableCell>{member.email || '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    )
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'trainers', label: 'Entrenadores' },
    { key: 'assignments', label: 'Asignaciones' },
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Entrenadores</h1>
        <p className="text-muted-foreground">Gestión de entrenadores, asignaciones y disponibilidad.</p>
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

      {activeTab === 'trainers' && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {trainers.length} entrenador{trainers.length !== 1 ? 'es' : ''} registrado{trainers.length !== 1 ? 's' : ''}
            </p>
            {canWrite && (
              <Button onClick={handleOpenCreateDialog}>
                <Plus className="mr-2 size-4" />
                Nuevo Entrenador
              </Button>
            )}
          </div>

          <Card className="transition-all duration-200">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Especialidad</TableHead>
                    <TableHead>Socios</TableHead>
                    <TableHead>Estado</TableHead>
                    {canWrite && <TableHead className="text-right">Acciones</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trainersLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 5 }).map((_, j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-4 w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : trainers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No hay entrenadores registrados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    trainers.map((t: typeof trainers[number]) => (
                      <TableRow key={t.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="size-8 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-xs uppercase">
                              {t.user?.name?.substring(0, 2) || '??'}
                            </div>
                            <span className="font-medium">{t.user?.name || 'Sin usuario'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {t.specialty || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{t.memberCount} socio{(t.memberCount) !== 1 ? 's' : ''}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={t.isActive ? 'default' : 'secondary'}>
                            {t.isActive ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </TableCell>
                        {canWrite && (
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDetailTrainerId(t.id)}
                                title="Ver detalle"
                              >
                                <Eye className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenEditDialog(t)}
                                title="Editar"
                              >
                                <Edit2 className="size-4" />
                              </Button>
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

      {activeTab === 'assignments' && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Asignaciones de socios a entrenadores.
            </p>
            {canWrite && (
              <Button onClick={() => { setAssignForm({ trainerId: '', memberId: '' }); setAssignDialogOpen(true) }}>
                <Plus className="mr-2 size-4" />
                Asignar Socio
              </Button>
            )}
          </div>

          <Card className="transition-all duration-200">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entrenador</TableHead>
                    <TableHead>Socio</TableHead>
                    <TableHead>Asignado</TableHead>
                    <TableHead>Estado</TableHead>
                    {canWrite && <TableHead className="text-right">Acciones</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trainers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No hay asignaciones.
                      </TableCell>
                    </TableRow>
                  ) : (
                    trainers.flatMap((t: typeof trainers[number]) =>
                      (t as typeof trainers[number]).memberCount === 0
                        ? []
                        : (t as typeof trainers[number]).assignments?.map((a: typeof trainers[number]['assignments'][number]) => (
                            <TableRow key={`${t.id}-${a.id}`}>
                              <TableCell className="font-medium">{t.user?.name}</TableCell>
                              <TableCell>{a.member?.fullName || 'Socio #' + a.memberId}</TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {new Date(a.assignedAt).toLocaleDateString('es-AR')}
                              </TableCell>
                              <TableCell>
                                <Badge variant={a.isActive ? 'default' : 'secondary'}>
                                  {a.isActive ? 'Activa' : 'Inactiva'}
                                </Badge>
                              </TableCell>
                              {canWrite && (
                                <TableCell className="text-right">
                                  {a.isActive && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleUnassign(a.id)}
                                      title="Desasignar"
                                    >
                                      <X className="size-4 text-destructive" />
                                    </Button>
                                  )}
                                </TableCell>
                              )}
                            </TableRow>
                          )),
                    )
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {/* Create/Edit Trainer Dialog */}
      <Dialog open={trainerDialogOpen} onOpenChange={setTrainerDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleTrainerSubmit}>
            <DialogHeader>
              <DialogTitle>{editingTrainer ? 'Editar Entrenador' : 'Nuevo Entrenador'}</DialogTitle>
              <DialogDescription>
                {editingTrainer
                  ? 'Actualizá los datos del entrenador.'
                  : 'Seleccioná un usuario para crear su perfil de entrenador.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {!editingTrainer && (
                <div className="grid gap-2">
                  <Label htmlFor="userId">Usuario</Label>
                  <Select
                    value={trainerForm.userId}
                    onValueChange={(v) => setTrainerForm({ ...trainerForm, userId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar usuario" />
                    </SelectTrigger>
                    <SelectContent>
                      {trainerUsers.map((u: typeof trainerUsers[number]) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name} ({u.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="specialty">Especialidad</Label>
                <Input
                  id="specialty"
                  value={trainerForm.specialty}
                  onChange={(e) => setTrainerForm({ ...trainerForm, specialty: e.target.value })}
                  placeholder="Ej: Musculación, Yoga, Spinning"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="bio">Biografía</Label>
                <Textarea
                  id="bio"
                  value={trainerForm.bio}
                  onChange={(e) => setTrainerForm({ ...trainerForm, bio: e.target.value })}
                  placeholder="Breve descripción del entrenador"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="commissionRate">Comisión (%)</Label>
                <Input
                  id="commissionRate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={trainerForm.commissionRate}
                  onChange={(e) => setTrainerForm({ ...trainerForm, commissionRate: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setTrainerDialogOpen(false)}>
                Cancelar
              </Button>
              <LoadingButton
                type="submit"
                isLoading={createTrainerMutation.isPending || updateTrainerMutation.isPending}
              >
                Guardar
              </LoadingButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Member Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar Socio a Entrenador</DialogTitle>
            <DialogDescription>
              Seleccioná el entrenador y el socio a asignar.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Entrenador</Label>
              <Select
                value={assignForm.trainerId}
                onValueChange={(v) => setAssignForm({ ...assignForm, trainerId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar entrenador" />
                </SelectTrigger>
                <SelectContent>
                  {trainers.map((t: typeof trainers[number]) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.user?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Socio</Label>
              <Select
                value={assignForm.memberId}
                onValueChange={(v) => setAssignForm({ ...assignForm, memberId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar socio" />
                </SelectTrigger>
                <SelectContent>
                  {membersList.map((m: typeof membersList[number]) => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      {m.fullName} {m.documentNumber ? `(${m.documentNumber})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAssignSubmit} disabled={assignMutation.isPending}>
              {assignMutation.isPending ? 'Asignando...' : 'Asignar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Trainer Detail Dialog */}
      <Dialog open={!!detailTrainerId} onOpenChange={(open) => { if (!open) setDetailTrainerId(null) }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle del Entrenador</DialogTitle>
            <DialogDescription>
              Información del perfil, disponibilidad y socios asignados.
            </DialogDescription>
          </DialogHeader>
          {detailTrainer ? (
            <div className="space-y-6 py-4">
              {/* Profile info */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Nombre</Label>
                  <p className="font-medium">{detailTrainer.user?.name || '-'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <p className="font-medium">{detailTrainer.user?.email || '-'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Estado</Label>
                  <Badge variant={detailTrainer.isActive ? 'default' : 'secondary'} className="mt-0.5">
                    {detailTrainer.isActive ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Especialidad</Label>
                  <p className="font-medium">{detailTrainer.specialty || '-'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Comisión</Label>
                  <p className="font-medium">{detailTrainer.commissionRate || '0'}%</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Socios Asignados</Label>
                  <p className="font-medium">{detailTrainer.assignments?.length || 0}</p>
                </div>
              </div>
              {detailTrainer.bio && (
                <div>
                  <Label className="text-xs text-muted-foreground">Biografía</Label>
                  <p className="text-sm mt-1">{detailTrainer.bio}</p>
                </div>
              )}

              {/* Availability */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Disponibilidad</h3>
                {canWrite && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenAvailDialog(detailTrainer.id, (detailTrainer.availability || []).map((s) => ({ dayOfWeek: String(s.dayOfWeek), startTime: s.startTime, endTime: s.endTime })))}
                  >
                    Editar Disponibilidad
                  </Button>
                )}
              </div>
              {(!detailTrainer.availability || detailTrainer.availability.length === 0) ? (
                <p className="text-sm text-muted-foreground">Sin disponibilidad configurada.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {detailTrainer.availability.map((s: NonNullable<typeof detailTrainer>['availability'][number]) => (
                    <Badge key={s.id} variant="outline" className="gap-1">
                      {DAY_NAMES[s.dayOfWeek]} {s.startTime}-{s.endTime}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Assigned members */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Socios Asignados</h3>
                {!detailTrainer.assignments || detailTrainer.assignments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No tiene socios asignados.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Teléfono</TableHead>
                        <TableHead>Email</TableHead>
                        {canWrite && <TableHead className="text-right">Acciones</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detailTrainer.assignments.map((a: NonNullable<typeof detailTrainer>['assignments'][number]) => (
                        <TableRow key={a.id}>
                          <TableCell className="font-medium">{a.member?.fullName || '-'}</TableCell>
                          <TableCell>{a.member?.phone || '-'}</TableCell>
                          <TableCell>{a.member?.email || '-'}</TableCell>
                          {canWrite && (
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleUnassign(a.id)}
                                title="Desasignar"
                              >
                                <X className="size-4 text-destructive" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">Cargando...</div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailTrainerId(null)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Availability Dialog */}
      <Dialog open={availDialogOpen} onOpenChange={setAvailDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Configurar Disponibilidad</DialogTitle>
            <DialogDescription>
              Definí los horarios disponibles del entrenador para cada día de la semana.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 max-h-60 overflow-y-auto">
            {availSlots.map((slot, i) => (
              <div key={i} className="flex items-start gap-2 rounded-lg border p-3">
                <div className="grid grid-cols-3 gap-2 flex-1">
                  <div className="grid gap-1">
                    <Label className="text-xs">Día</Label>
                    <Select
                      value={slot.dayOfWeek}
                      onValueChange={(v) => updateAvailSlot(i, 'dayOfWeek', v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DAY_LABELS.map((label, di) => (
                          <SelectItem key={di} value={String(di)}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-xs">Inicio</Label>
                    <Input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) => updateAvailSlot(i, 'startTime', e.target.value)}
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-xs">Fin</Label>
                    <Input
                      type="time"
                      value={slot.endTime}
                      onChange={(e) => updateAvailSlot(i, 'endTime', e.target.value)}
                    />
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="mt-5 shrink-0"
                  onClick={() => removeAvailSlot(i)}
                >
                  <X className="size-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={addAvailSlot} className="w-full">
            <Plus className="mr-2 size-4" />
            Agregar Bloque
          </Button>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAvailDialogOpen(false)}>
              Cancelar
            </Button>
            <LoadingButton onClick={handleSaveAvailability} isLoading={setAvailMutation.isPending}>
              Guardar Disponibilidad
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
