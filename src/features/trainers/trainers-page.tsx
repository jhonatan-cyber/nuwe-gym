import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ChevronRight,
  Edit2,
  Plus,
  Users,
  CheckCircle2,
  XCircle,
  List,
  ArrowLeft,
  Zap,
  Phone,
  Mail,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  getTrainers,
  getMyMembers,
  createTrainer,
  updateTrainer,
  getTrainerUsers,
} from '#/features/trainers/server.ts'
import { ModuleLayout } from '#/shared/components/layout/module-layout.tsx'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '#/shared/components/ui/toggle-group'
import { Button } from '#/shared/components/ui/button'
import { LoadingButton } from '#/shared/components/ui/loading-button'
import { Badge } from '#/shared/components/ui/badge'
import { DataTable } from '#/shared/components/data-table.tsx'
import { StatCard } from '#/shared/components/ui/stat-card'
import { FilterBar } from '#/shared/components/ui/filter-bar'
import { Input } from '#/shared/components/ui/input'
import { Textarea } from '#/shared/components/ui/textarea'
import { Label } from '#/shared/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/shared/components/ui/select'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '#/shared/components/ui/tooltip'
import type { TrainerWithDetails, ViewMode } from './types.ts'

interface TrainersPageProps {
  userRole: string
}

export function TrainersPage({ userRole }: TrainersPageProps) {
  const queryClient = useQueryClient()
  const isAdmin = userRole === 'ADMIN'
  const isTrainer = userRole === 'TRAINER'
  const canWrite = isAdmin

  const [activeView, setActiveView] = useState<ViewMode>('trainers')
  const [search, setSearch] = useState('')

  // Create/Edit form state
  const [editingTrainer, setEditingTrainer] =
    useState<TrainerWithDetails | null>(null)
  const [userId, setUserId] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [bio, setBio] = useState('')
  const [commissionRate, setCommissionRate] = useState('')

  useEffect(() => {
    if (activeView === 'create' || activeView === 'edit') {
      setUserId(editingTrainer?.userId || '')
      setSpecialty(editingTrainer?.specialty || '')
      setBio(editingTrainer?.bio || '')
      setCommissionRate(editingTrainer?.commissionRate || '0')
    }
  }, [activeView, editingTrainer])

  // Queries
  const { data: trainers = [], isLoading } = useQuery({
    queryKey: ['trainers', search],
    queryFn: () => getTrainers(),
  })

  const { data: myMembers = [] } = useQuery({
    queryKey: ['my-members'],
    queryFn: () => getMyMembers(),
    enabled: isTrainer,
  })

  const { data: trainerUsers = [] } = useQuery({
    queryKey: ['trainer-users'],
    queryFn: () => getTrainerUsers(),
    enabled: activeView === 'create' && canWrite,
  })

  const totalTrainers = trainers.length
  const activeTrainers = trainers.filter((t) => t.isActive).length
  const inactiveTrainers = totalTrainers - activeTrainers

  const filteredTrainers = trainers.filter((t) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      t.user.name.toLowerCase().includes(q) ||
      (t.specialty || '').toLowerCase().includes(q)
    )
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: createTrainer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainers'] })
      setEditingTrainer(null)
      setActiveView('trainers')
      toast.success('Entrenador creado exitosamente')
    },
    onError: (err: Error) =>
      toast.error(err.message || 'Error al crear entrenador'),
  })

  const updateMutation = useMutation({
    mutationFn: updateTrainer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainers'] })
      setEditingTrainer(null)
      setActiveView('trainers')
      toast.success('Entrenador actualizado')
    },
    onError: () => toast.error('Error al actualizar entrenador'),
  })

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (editingTrainer) {
      updateMutation.mutate({
        data: { id: editingTrainer.id, specialty, bio, commissionRate },
      })
    } else {
      if (!userId) return
      createMutation.mutate({
        data: { userId, specialty, bio, commissionRate },
      })
    }
  }

  function handleEdit(trainer: TrainerWithDetails) {
    setEditingTrainer(trainer)
    setActiveView('edit')
  }

  function handleBackToList() {
    setEditingTrainer(null)
    setActiveView('trainers')
  }

  // Trainer view
  if (isTrainer) {
    return (
      <ModuleLayout
        breadcrumb={
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Entrenadores</span>
            <ChevronRight className="size-3 text-muted-foreground/50" />
            <span className="text-foreground">Mis Socios</span>
          </div>
        }
        title="Mis Socios"
      >
        <DataTable
          columns={[
            {
              key: 'member',
              label: 'Socio',
              render: (member: any) => (
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10 flex items-center justify-center font-bold text-[10px] uppercase shrink-0 text-primary tracking-wider shadow-inner">
                    {member.fullName
                      .split(' ')
                      .map((n: string) => n[0])
                      .slice(0, 2)
                      .join('')}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{member.fullName}</p>
                    {member.documentNumber && (
                      <p className="text-[10px] text-muted-foreground">
                        CI: {member.documentNumber}
                      </p>
                    )}
                  </div>
                </div>
              ),
            },
            {
              key: 'phone',
              label: 'Teléfono',
              render: (member: any) => (
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="size-3 text-muted-foreground" />
                  {member.phone || '—'}
                </span>
              ),
            },
            {
              key: 'email',
              label: 'Email',
              render: (member: any) => (
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="size-3 text-muted-foreground" />
                  {member.email || '—'}
                </span>
              ),
            },
          ]}
          data={myMembers}
          keyExtractor={(m: any) => m.id}
          emptyMessage="No tenés socios asignados."
          skeletonRows={5}
        />
      </ModuleLayout>
    )
  }

  const isFormView = activeView === 'create' || activeView === 'edit'

  return (
    <ModuleLayout
      breadcrumb={
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">Entrenadores</span>
          <ChevronRight className="size-3 text-muted-foreground/50" />
          <span className="text-foreground">
            {isFormView ? (editingTrainer ? 'Editar' : 'Nuevo') : 'Listado'}
          </span>
        </div>
      }
      title={
        isFormView
          ? editingTrainer
            ? 'Editar Entrenador'
            : 'Nuevo Entrenador'
          : 'Entrenadores'
      }
      leftPanel={
        <div className="flex flex-col gap-6 z-10 w-full">
          <ToggleGroup
            type="single"
            value={activeView === 'trainers' ? 'trainers' : 'create'}
            onValueChange={(v) => {
              if (v) {
                setEditingTrainer(null)
                setActiveView(v as ViewMode)
              }
            }}
          >
            <ToggleGroupItem value="trainers">
              <List className="size-3.5" /> Listado
            </ToggleGroupItem>
            {canWrite && (
              <ToggleGroupItem value="create">
                <Plus className="size-3.5" /> Crear nuevo
              </ToggleGroupItem>
            )}
          </ToggleGroup>

          {isFormView ? (
            <>
              <img
                src="/logo-ligth.png"
                alt="Logo Gym"
                className="w-full mx-auto opacity-90 dark:hidden block"
              />
              <img
                src="/logo-dark.png"
                alt="Logo Gym"
                className="w-full mx-auto opacity-90 hidden dark:block"
              />
              <div className="flex items-start gap-3 p-3 rounded-2xl dark:bg-white/2 bg-black/2 border dark:border-white/5 border-black/5">
                <Zap className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Completá los datos para crear un nuevo entrenador o asignarlo
                  a un usuario existente.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
                  Métricas
                </p>
                <div className="grid grid-cols-1 gap-3">
                  <StatCard
                    label="Total Entrenadores"
                    value={totalTrainers}
                    icon={Users}
                    variant="default"
                  />
                  <StatCard
                    label="Activos"
                    value={activeTrainers}
                    icon={CheckCircle2}
                    variant="emerald"
                  />
                  <StatCard
                    label="Inactivos"
                    value={inactiveTrainers}
                    icon={XCircle}
                    variant="foreground"
                  />
                </div>
              </div>

              <FilterBar
                search={search}
                onSearchChange={setSearch}
                searchPlaceholder="Buscar por nombre, especialidad..."
              />
            </>
          )}
        </div>
      }
    >
      {isFormView ? (
        <div className="flex-1 flex justify-center items-start pt-5">
          <div className="w-full max-w-lg bg-card/60 border border-border/10 rounded-4xl shadow-xl overflow-hidden flex flex-col min-h-[580px]">
            <form
              onSubmit={handleFormSubmit}
              className="flex-1 p-6 flex flex-col"
            >
              <div className="flex items-center gap-2 mb-5">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 rounded-xl"
                  onClick={handleBackToList}
                >
                  <ArrowLeft className="size-3.5" /> Volver
                </Button>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto space-y-5">
                {!editingTrainer && (
                  <div className="grid gap-2">
                    <Label htmlFor="userId">Usuario</Label>
                    <Select value={userId} onValueChange={setUserId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar usuario" />
                      </SelectTrigger>
                      <SelectContent>
                        {trainerUsers.map((u) => (
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
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    placeholder="Ej: Musculación, Yoga, Spinning"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="bio">Biografía</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
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
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4 mt-auto">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  onClick={handleBackToList}
                >
                  Cancelar
                </Button>
                <LoadingButton
                  type="submit"
                  className="rounded-xl font-bold"
                  isLoading={
                    createMutation.isPending || updateMutation.isPending
                  }
                >
                  {editingTrainer ? 'Guardar Cambios' : 'Crear Entrenador'}
                </LoadingButton>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <TooltipProvider delayDuration={200}>
          <DataTable
            columns={[
              {
                key: 'trainer',
                label: 'Entrenador',
                render: (t: TrainerWithDetails) => (
                  <div className="flex items-center gap-3">
                    <div className="ring-2 ring-foreground/10 rounded-full size-9 flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5 font-bold text-xs uppercase shrink-0 text-primary tracking-wider shadow-inner">
                      {t.user.name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm dark:text-white text-foreground leading-tight truncate">
                        {t.user.name}
                      </p>
                      <p className="text-[10px] font-semibold text-muted-foreground">
                        {t.user.email}
                      </p>
                    </div>
                  </div>
                ),
              },
              {
                key: 'specialty',
                label: (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-default">Especialidad</span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>Área de entrenamiento del instructor</p>
                    </TooltipContent>
                  </Tooltip>
                ),
                render: (t: TrainerWithDetails) => (
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Zap className="size-3 text-muted-foreground" />
                    {t.specialty || '—'}
                  </span>
                ),
              },
              {
                key: 'members',
                label: 'Socios',
                render: (t: TrainerWithDetails) => (
                  <Badge
                    variant="secondary"
                    className="inline-flex items-center gap-1 font-bold text-[10px]"
                  >
                    <Users className="size-2.5" />
                    {t.memberCount} socio{t.memberCount !== 1 ? 's' : ''}
                  </Badge>
                ),
              },
              {
                key: 'status',
                label: '',
                render: (t: TrainerWithDetails) =>
                  t.isActive ? (
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] font-bold">
                      Activo
                    </Badge>
                  ) : (
                    <Badge
                      variant="destructive"
                      className="text-[10px] font-bold"
                    >
                      Inactivo
                    </Badge>
                  ),
              },
              ...(canWrite
                ? [
                    {
                      key: 'actions' as string,
                      label: '',
                      className: 'text-right' as string,
                      render: (t: TrainerWithDetails) => (
                        <div className="flex justify-end gap-0.5">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                onClick={() => handleEdit(t)}
                              >
                                <Edit2 className="size-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                              <p>Editar</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      ),
                    },
                  ]
                : []),
            ]}
            data={filteredTrainers}
            isLoading={isLoading}
            loadingMessage="Cargando..."
            emptyMessage={
              search
                ? 'No se encontraron entrenadores.'
                : 'No hay entrenadores registrados.'
            }
            keyExtractor={(t: TrainerWithDetails) => t.id}
            skeletonRows={5}
          />
        </TooltipProvider>
      )}
    </ModuleLayout>
  )
}
