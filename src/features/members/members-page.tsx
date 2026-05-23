import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Edit2,
  User,
  Phone,
  Mail,
  CalendarDays,
  Eye,
  RefreshCw,
  Receipt,
  Camera,
  Upload,
} from 'lucide-react'
import { toast } from 'sonner'
import { getMembers, createMember, updateMember, getMemberById, uploadMemberPhoto } from '#/features/members/server.ts'
import { getMemberRenewalHistory } from '#/features/renewals/server.ts'
import { formatCurrency, formatDate } from '#/shared/lib/formatters.ts'

import { Button } from '#/shared/components/ui/button'
import { LoadingButton } from '#/shared/components/ui/loading-button'
import { Card } from '#/shared/components/ui/card'
import { Input } from '#/shared/components/ui/input'
import { Label } from '#/shared/components/ui/label'
import { Textarea } from '#/shared/components/ui/textarea'
import { PageHeader } from '#/shared/components/page-header'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/shared/components/ui/table'
import { Badge } from '#/shared/components/ui/badge'


interface MembersPageProps {
  userRole: string
}

export function MembersPage({ userRole }: MembersPageProps) {
  const queryClient = useQueryClient()
  const isReadOnly = userRole === 'TRAINER'

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<typeof membersList[number] | null>(null)
  const [viewMemberId, setViewMemberId] = useState<number | null>(null)

  const { data: memberDetail, isLoading: loadingDetail } = useQuery({
    queryKey: ['member-detail', viewMemberId],
    queryFn: () => getMemberById({ data: viewMemberId! }),
    enabled: !!viewMemberId,
  })

  const { data: renewalHistory = [] } = useQuery({
    queryKey: ['member-renewal-history', viewMemberId],
    queryFn: () => getMemberRenewalHistory({ data: { memberId: viewMemberId! } }),
    enabled: !!viewMemberId,
  })

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
      photoMutation.mutate({ data: { memberId: editingMember.id, photoBase64: base64 } })
    }
    reader.readAsDataURL(file)
  }

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

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)

    return () => clearTimeout(timer)
  }, [search])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
  }

  const { data: membersList = [], isLoading } = useQuery({
    queryKey: ['members', debouncedSearch],
    queryFn: () => getMembers({ data: { search: debouncedSearch } }),
  })

  const createMutation = useMutation({
    mutationFn: createMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] })
      setIsModalOpen(false)
      toast.success('Socio registrado exitosamente')
    },
    onError: () => toast.error('Error al registrar el socio'),
  })

  const updateMutation = useMutation({
    mutationFn: updateMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] })
      setIsModalOpen(false)
      toast.success('Datos del socio actualizados')
    },
    onError: () => toast.error('Error al actualizar el socio'),
  })

  const handleOpenModal = (member?: typeof membersList[number]) => {
    if (member) {
      setEditingMember(member)
      setFormData({
        fullName: member.fullName,
        documentNumber: member.documentNumber || '',
        email: member.email || '',
        phone: member.phone || '',
        birthDate: member.birthDate ? new Date(member.birthDate).toISOString().split('T')[0] : '',
        emergencyContactName: member.emergencyContactName || '',
        emergencyContactPhone: member.emergencyContactPhone || '',
        address: member.address || '',
        status: member.status === 'SUSPENDED' ? 'INACTIVE' : member.status,
      })
    } else {
      setEditingMember(null)
      setFormData({
        fullName: '',
        documentNumber: '',
        email: '',
        phone: '',
        birthDate: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        address: '',
        status: 'ACTIVE',
      })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingMember) {
      updateMutation.mutate({ data: { ...formData, id: editingMember.id } })
    } else {
      createMutation.mutate({ data: formData })
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Socios"
        description="Gestión de miembros del gimnasio, datos personales y estado."
        action={!isReadOnly && <Button onClick={() => handleOpenModal()}><Plus className="mr-2 size-4" /> Nuevo Socio</Button>}
      />

      <Card>
        <div className="p-4 border-b">
          <SearchInput
            placeholder="Buscar por nombre, DNI, email..."
            value={search}
            onChange={handleSearchChange}
            className="max-w-sm"
          />
        </div>
        <DataTable
          columns={[
            { key: 'member', label: 'Socio', render: (member: typeof membersList[number]) => (
              <div className="flex items-center gap-2">
                {member.photoUrl ? (
                  <img src={member.photoUrl} alt="" className="hidden size-8 rounded-full object-cover sm:block" />
                ) : (
                  <div className="hidden size-8 bg-primary/10 text-primary rounded-full sm:flex items-center justify-center font-bold text-xs uppercase">
                    {member.fullName.substring(0, 2)}
                  </div>
                )}
                <div>
                  <p className="font-medium">{member.fullName}</p>
                  <div className="flex items-center text-xs text-muted-foreground gap-1">
                    <User className="size-3" /> DNI: {member.documentNumber}
                  </div>
                </div>
              </div>
            )},
            { key: 'contact', label: 'Contacto', render: (member: typeof membersList[number]) => (
              <div className="space-y-1">
                {member.phone && (
                  <div className="flex items-center text-xs text-muted-foreground gap-1">
                    <Phone className="size-3" /> {member.phone}
                  </div>
                )}
                {member.email && (
                  <div className="flex items-center text-xs text-muted-foreground gap-1">
                    <Mail className="size-3" /> {member.email}
                  </div>
                )}
              </div>
            )},
            { key: 'subscription', label: 'Suscripción Actual', render: (member: typeof membersList[number]) => {
              const hasSub = member.subscriptions.length > 0
              const activeSub = member.subscriptions[0]
              return hasSub ? (
                <div className="space-y-1">
                  <Badge variant="default" className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 border-emerald-500/20">
                    {activeSub.plan.name}
                  </Badge>
                  <div className="flex items-center text-xs text-muted-foreground gap-1">
                    <CalendarDays className="size-3" /> Hasta {formatDate(activeSub.endDate)}
                  </div>
                </div>
              ) : (
                <Badge variant="secondary">Sin suscripción activa</Badge>
              )
            }},
            { key: 'status', label: 'Estado Perfil', render: (member: typeof membersList[number]) => (
              <Badge variant={member.status === 'ACTIVE' ? 'default' : 'destructive'}>
                {member.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
              </Badge>
            )},
            ...(!isReadOnly ? [{
              key: 'actions' as string, label: 'Acciones', className: 'text-right' as string, render: (member: typeof membersList[number]) => (
                <>
                  <Button variant="ghost" size="icon" onClick={() => setViewMemberId(member.id)} title="Ver detalle">
                    <Eye className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleOpenModal(member)}>
                    <Edit2 className="size-4" />
                  </Button>
                </>
              ),
            }] : []),
          ]}
          data={membersList}
          isLoading={isLoading}
          loadingMessage="Cargando socios..."
          emptyMessage="No se encontraron socios."
          keyExtractor={(member: typeof membersList[number]) => member.id}
        />
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingMember ? 'Editar Socio' : 'Nuevo Socio'}
              </DialogTitle>
              <DialogDescription>
                Ingresá los datos personales y de contacto del miembro.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
              <div className="grid grid-cols-1 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="fullName">Nombre Completo</Label>
                  <Input
                    id="fullName"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  />
                </div>
              </div>

              {editingMember && (
                <div className="flex items-center gap-4 p-3 border rounded-lg">
                  {photoPreview || editingMember.photoUrl ? (
                    <img
                      src={photoPreview || editingMember.photoUrl || ''}
                      alt=""
                      className="size-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="size-16 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      <Camera className="size-6" />
                    </div>
                  )}
                  <div className="flex-1">
                    <Label htmlFor="photo" className="text-sm font-medium">Foto del Socio</Label>
                    <p className="text-xs text-muted-foreground mb-2">JPG o PNG, max 2MB</p>
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
                      id="photo"
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
                  <Label htmlFor="documentNumber">DNI / Documento</Label>
                  <Input
                    id="documentNumber"
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
                  <Label htmlFor="birthDate">Fecha de Nacimiento</Label>
                  <Input
                    id="birthDate"
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
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t pt-4 mt-2">
                <div className="grid gap-2">
                  <Label htmlFor="emergencyContactName">
                    Contacto de Emergencia
                  </Label>
                  <Input
                    id="emergencyContactName"
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
                  <Label htmlFor="emergencyContactPhone">
                    Teléfono de Emergencia
                  </Label>
                  <Input
                    id="emergencyContactPhone"
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
                <Label htmlFor="address" className="flex items-center gap-2">
                  Dirección
                </Label>
                <Textarea
                  id="address"
                  placeholder="Calle, Ciudad, Provincia"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              {editingMember && (
                <div className="grid gap-2 border-t pt-4 mt-2">
                  <Label htmlFor="status">Estado del Perfil</Label>
                  <select
                    id="status"
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as 'ACTIVE' | 'INACTIVE',
                      })
                    }
                  >
                    <option value="ACTIVE">Activo</option>
                    <option value="INACTIVE">Inactivo (Suspendido)</option>
                  </select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                Cancelar
              </Button>
              <LoadingButton
                type="submit"
                isLoading={createMutation.isPending || updateMutation.isPending}
                loadingText="Guardando..."
              >
                Guardar Socio
              </LoadingButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewMemberId} onOpenChange={(open) => { if (!open) setViewMemberId(null) }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle del Socio</DialogTitle>
            <DialogDescription>
              Información personal e historial de membresías.
            </DialogDescription>
          </DialogHeader>

          {loadingDetail ? (
            <div className="py-8 text-center text-muted-foreground">Cargando...</div>
          ) : memberDetail ? (
            <div className="space-y-6 py-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Nombre</Label>
                  <p className="font-medium">{memberDetail.fullName}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Documento</Label>
                  <p className="font-medium">{memberDetail.documentNumber || '—'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Estado</Label>
                  <Badge variant={memberDetail.status === 'ACTIVE' ? 'default' : 'destructive'} className="mt-0.5">
                    {memberDetail.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Teléfono</Label>
                  <p className="font-medium">{memberDetail.phone || '—'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <p className="font-medium">{memberDetail.email || '—'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Miembro desde</Label>
                  <p className="font-medium">{formatDate(memberDetail.createdAt)}</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
                  <RefreshCw className="size-4 text-primary" />
                  Renovaciones
                </h3>
                {renewalHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">
                    Este socio no tiene membresías registradas.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Plan</TableHead>
                        <TableHead>Inicio</TableHead>
                        <TableHead>Fin</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Pago</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {renewalHistory.map((sub) => {
                        const lastPayment = sub.payments?.[0]
                        return (
                          <TableRow key={sub.id}>
                            <TableCell className="font-medium">{sub.plan.name}</TableCell>
                            <TableCell>{formatDate(sub.startDate)}</TableCell>
                            <TableCell>{formatDate(sub.endDate)}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  sub.status === 'ACTIVE' ? 'default' : sub.status === 'EXPIRED' ? 'destructive' : 'secondary'
                                }
                              >
                                {sub.status === 'ACTIVE' ? 'Activa' : sub.status === 'EXPIRED' ? 'Vencida' : sub.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {lastPayment ? (
                                <div className="flex items-center gap-1 text-sm">
                                  <Receipt className="size-3 text-muted-foreground" />
                                  <span>{formatCurrency(lastPayment.amount)}</span>
                                  <span className="text-xs text-muted-foreground">
                                    ({lastPayment.paymentMethod})
                                  </span>
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-destructive">Error al cargar el socio</div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewMemberId(null)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
