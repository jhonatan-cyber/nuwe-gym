import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Edit2,
  Eye,
  RefreshCw,
  Receipt,
  Camera,
  Upload,
  Filter,
  List,
  ChevronRight,
  User,
  Users,
  CheckCircle2,
  Clock,
  Mail,
  Calendar,
  Heart,
  MapPin,
  Phone,
  Plus,
} from 'lucide-react'
import { toast } from 'sonner'
import { Link } from '@tanstack/react-router'
import {
  getMembers,
  updateMember,
  getMemberById,
  uploadMemberPhoto,
} from '#/features/members/server.ts'
import { getMemberRenewalHistory } from '#/features/renewals/server.ts'
import { formatCurrency, formatDate } from '#/shared/lib/formatters.ts'

import { Button } from '#/shared/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '#/shared/components/ui/toggle-group'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '#/shared/components/ui/tooltip'
import { LoadingButton } from '#/shared/components/ui/loading-button'
import { Input } from '#/shared/components/ui/input'
import { Label } from '#/shared/components/ui/label'
import { Textarea } from '#/shared/components/ui/textarea'
import { SearchInput } from '#/shared/components/search-input'
import { DataTable } from '#/shared/components/data-table'
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
import { Separator } from '#/shared/components/ui/separator'
import { cn } from '#/shared/lib/utils.ts'
import { MemberEnrollmentWizard } from '#/features/members/member-enrollment-wizard.tsx'
import { ModuleLayout } from '#/shared/components/layout/module-layout.tsx'

interface MembersPageProps {
  userRole: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isExpiringThisWeek(dateStr: string | Date | null): boolean {
  if (!dateStr) return false
  const date = new Date(dateStr)
  const now = new Date()
  const nextWeek = new Date()
  nextWeek.setDate(now.getDate() + 7)
  return date >= now && date <= nextWeek
}

function isExpired(dateStr: string | Date | null): boolean {
  if (!dateStr) return false
  return new Date(dateStr) < new Date()
}

function getFirstSubscription<T extends { subscriptions: any[] }>(
  member: T,
): T['subscriptions'][number] | undefined {
  return member.subscriptions[0]
}

type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE' | 'NO_SUBSCRIPTION'

export function MembersPage({ userRole }: MembersPageProps) {
  const queryClient = useQueryClient()
  const isReadOnly = userRole === 'TRAINER'

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [activeView, setActiveView] = useState<'enroll' | 'list'>('enroll')
  const [editingMember, setEditingMember] = useState<
    (typeof membersList)[number] | null
  >(null)
  const [viewMemberId, setViewMemberId] = useState<number | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  // ── Queries ────────────────────────────────────────────────────────────

  const { data: membersList = [], isLoading } = useQuery({
    queryKey: ['members', debouncedSearch],
    queryFn: () => getMembers({ data: { search: debouncedSearch } }),
    enabled: true,
  })

  const { data: memberDetail, isLoading: loadingDetail } = useQuery({
    queryKey: ['member-detail', viewMemberId],
    queryFn: () => getMemberById({ data: viewMemberId! }),
    enabled: !!viewMemberId,
  })

  const { data: renewalHistory = [] } = useQuery({
    queryKey: ['member-renewal-history', viewMemberId],
    queryFn: () =>
      getMemberRenewalHistory({ data: { memberId: viewMemberId! } }),
    enabled: !!viewMemberId,
  })

  // ── Stats ──────────────────────────────────────────────────────────────

  const totalMembers = membersList.length
  const activeNow = membersList.filter((m) => {
    const sub = getFirstSubscription(m)
    return sub && sub.status === 'ACTIVE' && !isExpired(sub.endDate)
  }).length
  const expiringThisWeek = membersList.filter((m) => {
    const sub = getFirstSubscription(m)
    return sub && sub.status === 'ACTIVE' && isExpiringThisWeek(sub.endDate)
  }).length

  // ── Filters ────────────────────────────────────────────────────────────

  const filteredMembers = membersList.filter((m) => {
    if (statusFilter === 'ALL') return true
    if (statusFilter === 'ACTIVE') {
      const sub = getFirstSubscription(m)
      return sub?.status === 'ACTIVE' && !isExpired(sub.endDate)
    }
    if (statusFilter === 'INACTIVE') {
      const sub = getFirstSubscription(m)
      return (
        m.status !== 'ACTIVE' ||
        !sub ||
        sub.status !== 'ACTIVE' ||
        isExpired(sub.endDate)
      )
    }
    // statusFilter has to be 'NO_SUBSCRIPTION' here:
    return m.subscriptions.length === 0
  })

  // ── Photo upload ───────────────────────────────────────────────────────

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  const photoMutation = useMutation({
    mutationFn: uploadMemberPhoto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] })
      toast.success('Foto actualizada')
    },
    onError: () => toast.error('Error al subir la foto'),
  })

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editingMember) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      setPhotoPreview(base64)
      photoMutation.mutate({
        data: { memberId: editingMember.id, photoBase64: base64 },
      })
    }
    reader.readAsDataURL(file)
  }

  // ── Edit form ──────────────────────────────────────────────────────────

  const [formData, setFormData] = useState({
    fullName: '',
    documentNumber: '',
    email: '',
    phone: '',
    birthDate: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    address: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  })

  const updateMutation = useMutation({
    mutationFn: updateMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] })
      setIsEditModalOpen(false)
      toast.success('Datos del socio actualizados')
    },
    onError: () => toast.error('Error al actualizar el socio'),
  })

  const handleOpenEditModal = (member: (typeof membersList)[number]) => {
    setEditingMember(member)
    setFormData({
      fullName: member.fullName,
      documentNumber: member.documentNumber || '',
      email: member.email || '',
      phone: member.phone || '',
      birthDate: member.birthDate
        ? new Date(member.birthDate).toISOString().split('T')[0]
        : '',
      emergencyContactName: member.emergencyContactName || '',
      emergencyContactPhone: member.emergencyContactPhone || '',
      address: member.address || '',
      status: member.status === 'SUSPENDED' ? 'INACTIVE' : member.status,
    })
    setPhotoPreview(null)
    setViewMemberId(null)
    setIsEditModalOpen(true)
  }

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingMember) {
      updateMutation.mutate({ data: { ...formData, id: editingMember.id } })
    }
  }

  if (activeView === 'enroll') {
    return (
      <div className="w-full h-full">
        {/* Wizard */}
        <MemberEnrollmentWizard
          variant="inline"
          isOpen={true}
          onClose={() => {
            queryClient.invalidateQueries({ queryKey: ['members'] })
            setActiveView('list')
          }}
        />
      </div>
    )
  }

  return (
    <>
      <ModuleLayout
        breadcrumb={
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Socios</span>
            <ChevronRight className="size-3 text-muted-foreground/50" />
            <span className="text-foreground">Listado</span>
          </div>
        }
        title="Listado"
        leftPanel={
          <div className="flex flex-col gap-6 z-10 w-full">
            {/* View Toggle */}
            {!isReadOnly && (
              <ToggleGroup
                type="single"
                value="list"
                onValueChange={(v) => {
                  if (v === 'enroll') setActiveView('enroll')
                }}
              >
                <ToggleGroupItem value="list">
                  <List className="size-3.5" /> Listado
                </ToggleGroupItem>
                <ToggleGroupItem value="enroll">
                  <Plus className="size-3.5" /> Inscripción
                </ToggleGroupItem>
              </ToggleGroup>
            )}
            {/* Stats */}
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
                Métricas
              </p>
              <div className="grid grid-cols-1 gap-3">
                {/* Total Members */}
                <div className="relative overflow-hidden bg-muted/60 p-4.5 rounded-[1.25rem] border border-border/10 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between group">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">
                      Total Socios
                    </p>
                    <p className="text-2xl font-black tracking-tight">
                      {totalMembers}
                    </p>
                  </div>
                  <div className="size-10 rounded-xl dark:bg-white/5 bg-black/5 flex items-center justify-center dark:group-hover:bg-white/10 group-hover:bg-black/10 transition-all duration-300 shrink-0">
                    <Users className="size-5 text-muted-foreground group-hover:scale-110 transition-transform duration-300" />
                  </div>
                </div>

                {/* Active Now */}
                <div className="relative overflow-hidden bg-muted/60 p-4.5 rounded-[1.25rem] border border-border/10 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between group">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Activos
                    </p>
                    <p className="text-2xl font-black text-emerald-500 tracking-tight">
                      {activeNow}
                    </p>
                  </div>
                  <div className="size-10 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:scale-105 transition-all duration-300 shrink-0">
                    <CheckCircle2 className="size-5 text-emerald-500 group-hover:rotate-12 transition-transform duration-300" />
                  </div>
                </div>

                {/* Expiring This Week */}
                <div className="relative overflow-hidden bg-muted/60 p-4.5 rounded-[1.25rem] border border-border/10 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between group">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Vencen pronto
                    </p>
                    <p className="text-2xl font-black text-foreground tracking-tight">
                      {expiringThisWeek}
                    </p>
                  </div>
                  <div className="size-10 rounded-xl bg-foreground/10 flex items-center justify-center group-hover:scale-105 transition-all duration-300 shrink-0">
                    <Clock className="size-5 text-foreground group-hover:-rotate-12 transition-transform duration-300" />
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="space-y-3 pt-2 border-t dark:border-white/5 border-black/5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
                Filtros
              </p>
              <div className="space-y-2">
                <SearchInput
                  placeholder="Buscar por DNI, nombre..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full"
                />
                <Select
                  value={statusFilter}
                  onValueChange={(v) => setStatusFilter(v as StatusFilter)}
                >
                  <SelectTrigger className="w-full">
                    <Filter className="size-3 mr-1" />
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos los Estados</SelectItem>
                    <SelectItem value="ACTIVE">Activos</SelectItem>
                    <SelectItem value="INACTIVE">Inactivos</SelectItem>
                    <SelectItem value="NO_SUBSCRIPTION">Sin plan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        }
      >
        <div className="bg-card p-5 rounded-[2rem] border border-border/10 shadow-xl flex-1 flex flex-col min-w-0">
          <DataTable
            columns={[
              {
                key: 'member',
                label: 'Socio',
                render: (member: (typeof membersList)[number]) => (
                  <div className="flex items-center gap-3">
                    {member.photoUrl ? (
                      <div className="relative size-9 rounded-full ring-2 ring-foreground/10 overflow-hidden shrink-0">
                        <img
                          src={member.photoUrl}
                          alt=""
                          className="size-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="size-9 rounded-full bg-gradient-to-br from-foreground/10 to-foreground/5 border border-foreground/10 flex items-center justify-center font-bold text-xs uppercase shrink-0 text-foreground tracking-wider shadow-inner">
                        {member.fullName
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-sm dark:text-white text-foreground leading-tight truncate">
                        {member.fullName}
                      </p>
                      <p className="text-[10px] font-semibold text-muted-foreground">
                        DNI: {member.documentNumber || '—'}
                      </p>
                    </div>
                  </div>
                ),
              },
              {
                key: 'plan',
                label: 'Plan',
                render: (member: (typeof membersList)[number]) => {
                  const sub = getFirstSubscription(member)
                  if (!sub)
                    return (
                      <span className="text-xs text-muted-foreground">—</span>
                    )
                  const expired = isExpired(sub.endDate)
                  return (
                    <Badge
                      className={cn(
                        'text-[10px] font-bold',
                        expired
                          ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/15'
                          : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/15',
                      )}
                    >
                      {sub.plan.name}
                    </Badge>
                  )
                },
              },
              {
                key: 'status',
                label: '',
                render: (member: (typeof membersList)[number]) => {
                  const sub = getFirstSubscription(member)
                  const expired = sub && isExpired(sub.endDate)
                  if (!sub) return null
                  if (expired)
                    return (
                      <Badge
                        variant="destructive"
                        className="text-[10px] font-bold"
                      >
                        Vencido
                      </Badge>
                    )
                  if (sub.status === 'ACTIVE') {
                    return (
                      <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] font-bold">
                        Activo
                      </Badge>
                    )
                  }
                  return null
                },
              },
              ...(!isReadOnly
                ? [
                    {
                      key: 'actions' as string,
                      label: '',
                      className: 'text-right',
                      render: (member: (typeof membersList)[number]) => (
                        <div className="flex justify-end gap-0.5">
                          <TooltipProvider delayDuration={200}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  onClick={() => setViewMemberId(member.id)}
                                >
                                  <Eye className="size-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom">
                                <p>Ver detalle</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  onClick={() => handleOpenEditModal(member)}
                                >
                                  <Edit2 className="size-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom">
                                <p>Editar</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      ),
                    },
                  ]
                : []),
            ]}
            data={filteredMembers}
            isLoading={isLoading}
            loadingMessage="Cargando..."
            emptyMessage="No se encontraron socios."
            keyExtractor={(member: (typeof membersList)[number]) => member.id}
            skeletonRows={5}
          />
        </div>
      </ModuleLayout>

      {/* ── Edit Dialog ───────────────────────────────────────────────── */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Editar Socio</DialogTitle>
              <DialogDescription>
                Actualizá los datos personales y de contacto del miembro.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
              <div className="grid grid-cols-1 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-fullName">Nombre Completo</Label>
                  <Input
                    id="edit-fullName"
                    required
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                  />
                </div>
              </div>

              {editingMember && (
                <div className="flex items-center gap-4 p-3 border rounded-2xl dark:border-white/5 border-black/5">
                  {photoPreview || editingMember.photoUrl ? (
                    <img
                      src={photoPreview || editingMember.photoUrl || ''}
                      alt=""
                      className="size-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="size-16 rounded-full dark:bg-white/5 bg-black/5 flex items-center justify-center">
                      <Camera className="size-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <Label className="text-sm font-bold">Foto del Socio</Label>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                      JPG o PNG, max 2MB
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={photoMutation.isPending}
                    >
                      <Upload className="size-4 mr-1" />
                      {photoMutation.isPending ? 'Subiendo...' : 'Subir Foto'}
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoSelect}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-documentNumber">DNI / Documento</Label>
                  <Input
                    id="edit-documentNumber"
                    required
                    value={formData.documentNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        documentNumber: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-birthDate">Fecha de Nacimiento</Label>
                  <Input
                    id="edit-birthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) =>
                      setFormData({ ...formData, birthDate: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-phone">Teléfono</Label>
                  <Input
                    id="edit-phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-emergencyContactName">
                    Contacto de Emergencia
                  </Label>
                  <Input
                    id="edit-emergencyContactName"
                    value={formData.emergencyContactName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        emergencyContactName: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-emergencyContactPhone">
                    Teléfono de Emergencia
                  </Label>
                  <Input
                    id="edit-emergencyContactPhone"
                    type="tel"
                    value={formData.emergencyContactPhone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        emergencyContactPhone: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-address">Dirección</Label>
                <Textarea
                  id="edit-address"
                  placeholder="Calle, Ciudad, Provincia"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                />
              </div>

              <Separator />

              <div className="grid gap-2">
                <Label htmlFor="edit-status">Estado del Perfil</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      status: value as 'ACTIVE' | 'INACTIVE',
                    })
                  }
                >
                  <SelectTrigger id="edit-status" className="w-full">
                    <SelectValue placeholder="Estado del perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Activo</SelectItem>
                    <SelectItem value="INACTIVE">
                      Inactivo (Suspendido)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancelar
              </Button>
              <LoadingButton
                type="submit"
                isLoading={updateMutation.isPending}
                loadingText="Guardando..."
              >
                Guardar Cambios
              </LoadingButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── View Detail Dialog ────────────────────────────────────────── */}
      <Dialog
        open={!!viewMemberId}
        onOpenChange={(open) => {
          if (!open) setViewMemberId(null)
        }}
      >
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle del Socio</DialogTitle>
            <DialogDescription>
              Información personal e historial de membresías.
            </DialogDescription>
          </DialogHeader>

          {loadingDetail ? (
            <div className="py-8 text-center text-muted-foreground flex items-center justify-center gap-2">
              <RefreshCw className="size-4 animate-spin text-primary" />
              <span>Cargando datos del socio...</span>
            </div>
          ) : memberDetail ? (
            <div className="space-y-6 py-2">
              {/* Encabezado VIP */}
              <div className="relative overflow-hidden p-6 rounded-[2rem] border dark:border-white/[0.04] border-black/[0.04] bg-gradient-to-r from-foreground/[0.04] to-transparent flex flex-col sm:flex-row sm:items-center gap-5">
                {memberDetail.photoUrl ? (
                  <div className="relative size-16 rounded-full ring-4 ring-foreground/10 overflow-hidden shrink-0 shadow-md">
                    <img
                      src={memberDetail.photoUrl}
                      alt=""
                      className="size-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="size-16 rounded-full bg-gradient-to-br from-foreground/10 to-foreground/5 border border-foreground/10 flex items-center justify-center font-black text-lg uppercase shrink-0 text-foreground tracking-wider shadow-inner">
                    {memberDetail.fullName
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')}
                  </div>
                )}
                <div className="space-y-1">
                  <div className="flex items-center flex-wrap gap-2.5">
                    <p className="text-xl font-black dark:text-white text-foreground tracking-tight leading-none">
                      {memberDetail.fullName}
                    </p>
                    <Badge
                      className={cn(
                        'font-bold text-[10px] py-0.5 px-2.5 rounded-full select-none',
                        memberDetail.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/15'
                          : 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/15',
                      )}
                    >
                      {memberDetail.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none pt-0.5">
                    Socio desde el {formatDate(memberDetail.createdAt)}
                  </p>
                </div>
              </div>

              {/* Datos Personales */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 px-1">
                  <User className="size-3.5 text-primary" /> Datos Personales
                </h4>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {/* DNI */}
                  <div className="bg-muted/60 p-3.5 rounded-2xl border border-border/10 flex items-start gap-3">
                    <div className="size-8 rounded-lg dark:bg-white/5 bg-black/5 flex items-center justify-center shrink-0">
                      <User className="size-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                        Documento / DNI
                      </p>
                      <p className="font-bold text-sm mt-0.5 truncate">
                        {memberDetail.documentNumber || '—'}
                      </p>
                    </div>
                  </div>

                  {/* Teléfono */}
                  <div className="bg-muted/60 p-3.5 rounded-2xl border border-border/10 flex items-start gap-3">
                    <div className="size-8 rounded-lg dark:bg-white/5 bg-black/5 flex items-center justify-center shrink-0">
                      <Phone className="size-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                        Teléfono
                      </p>
                      <p className="font-bold text-sm mt-0.5 truncate">
                        {memberDetail.phone || '—'}
                      </p>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="bg-muted/60 p-3.5 rounded-2xl border border-border/10 flex items-start gap-3">
                    <div className="size-8 rounded-lg dark:bg-white/5 bg-black/5 flex items-center justify-center shrink-0">
                      <Mail className="size-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                        Email
                      </p>
                      <p className="font-bold text-sm mt-0.5 truncate break-all">
                        {memberDetail.email || '—'}
                      </p>
                    </div>
                  </div>

                  {/* Fecha Nacimiento */}
                  <div className="bg-muted/60 p-3.5 rounded-2xl border border-border/10 flex items-start gap-3">
                    <div className="size-8 rounded-lg dark:bg-white/5 bg-black/5 flex items-center justify-center shrink-0">
                      <Calendar className="size-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                        Fecha de Nac.
                      </p>
                      <p className="font-bold text-sm mt-0.5 truncate">
                        {memberDetail.birthDate
                          ? formatDate(memberDetail.birthDate)
                          : '—'}
                      </p>
                    </div>
                  </div>

                  {/* Contacto Emergencia */}
                  <div className="bg-muted/60 p-3.5 rounded-2xl border border-border/10 flex items-start gap-3">
                    <div className="size-8 rounded-lg dark:bg-white/5 bg-black/5 flex items-center justify-center shrink-0">
                      <Heart className="size-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                        Contacto de Emerg.
                      </p>
                      <p className="font-bold text-sm mt-0.5 truncate">
                        {memberDetail.emergencyContactName || '—'}
                      </p>
                    </div>
                  </div>

                  {/* Tel. Emergencia */}
                  <div className="bg-muted/60 p-3.5 rounded-2xl border border-border/10 flex items-start gap-3">
                    <div className="size-8 rounded-lg dark:bg-white/5 bg-black/5 flex items-center justify-center shrink-0">
                      <Phone className="size-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                        Tel. Emergencia
                      </p>
                      <p className="font-bold text-sm mt-0.5 truncate">
                        {memberDetail.emergencyContactPhone || '—'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dirección */}
              {memberDetail.address && (
                <div className="space-y-2 pt-1">
                  <div className="bg-muted/60 p-4 rounded-2xl border border-border/10 flex items-start gap-3.5">
                    <div className="size-8 rounded-lg dark:bg-white/5 bg-black/5 flex items-center justify-center shrink-0">
                      <MapPin className="size-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                        Dirección
                      </p>
                      <p className="font-bold text-sm mt-0.5 leading-relaxed">
                        {memberDetail.address}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <Separator />

              {/* Historial de Membresías */}
              <div className="space-y-3 pt-1">
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 px-1">
                  <RefreshCw className="size-3.5 text-primary" /> Historial de
                  Membresías
                </h4>
                {renewalHistory.length === 0 ? (
                  <div className="bg-muted/60 p-8 rounded-2xl border border-border/10 text-center text-sm text-muted-foreground">
                    Este socio no tiene membresías registradas.
                  </div>
                ) : (
                  <div className="rounded-2xl border dark:border-white/[0.04] border-black/[0.04] overflow-hidden">
                    <Table>
                      <TableHeader className="bg-black/[0.02] dark:bg-white/[0.02]">
                        <TableRow>
                          <TableHead className="text-[9px] font-bold uppercase tracking-widest py-3">
                            Plan
                          </TableHead>
                          <TableHead className="text-[9px] font-bold uppercase tracking-widest py-3">
                            Inicio
                          </TableHead>
                          <TableHead className="text-[9px] font-bold uppercase tracking-widest py-3">
                            Fin
                          </TableHead>
                          <TableHead className="text-[9px] font-bold uppercase tracking-widest py-3">
                            Estado
                          </TableHead>
                          <TableHead className="text-[9px] font-bold uppercase tracking-widest py-3">
                            Pago
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {renewalHistory.map((sub) => {
                          const hasPayment = sub.payments.length > 0
                          const lastPayment = sub.payments[0]
                          const active = sub.status === 'ACTIVE'
                          const expired = sub.status === 'EXPIRED'
                          return (
                            <TableRow
                              key={sub.id}
                              className="hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-colors"
                            >
                              <TableCell className="font-bold py-3.5">
                                {sub.plan.name}
                              </TableCell>
                              <TableCell className="py-3.5">
                                {formatDate(sub.startDate)}
                              </TableCell>
                              <TableCell className="py-3.5">
                                {formatDate(sub.endDate)}
                              </TableCell>
                              <TableCell className="py-3.5">
                                <Badge
                                  className={cn(
                                    'font-bold text-[9px] py-0.5 px-2 rounded-full select-none',
                                    active
                                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                      : expired
                                        ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                        : 'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20',
                                  )}
                                >
                                  {active
                                    ? 'Activa'
                                    : expired
                                      ? 'Vencida'
                                      : sub.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-3.5">
                                {hasPayment ? (
                                  <div className="flex items-center gap-1.5 text-xs">
                                    <Receipt className="size-3.5 text-muted-foreground shrink-0" />
                                    <span className="font-semibold">
                                      {formatCurrency(lastPayment.amount)}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                                      ({lastPayment.paymentMethod})
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground">
                                    —
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-destructive">
              Error al cargar el socio
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewMemberId(null)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
