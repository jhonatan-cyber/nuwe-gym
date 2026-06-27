import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Snowflake, Play, Users, Search } from 'lucide-react'
import { toast } from 'sonner'
import {
  getFreezes,
  createFreeze,
  resumeSubscription,
  getFrozenSubscriptions,
} from '#/features/membership-freezes/server.ts'
import { getSubscriptions } from '#/features/subscriptions/server.ts'
import { formatDate } from '#/shared/lib/formatters.ts'

import { Button } from '#/shared/components/ui/button'
import { LoadingButton } from '#/shared/components/ui/loading-button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/shared/components/ui/card'
import { Input } from '#/shared/components/ui/input'
import { Label } from '#/shared/components/ui/label'
import { Textarea } from '#/shared/components/ui/textarea'
import { PageHeader } from '#/shared/components/page-header'
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

interface MembershipFreezesPageProps {
  userRole: string
}

export function MembershipFreezesPage({
  userRole,
}: MembershipFreezesPageProps) {
  const queryClient = useQueryClient()
  const isAdmin = userRole === 'ADMIN'
  const canWrite = userRole === 'ADMIN' || userRole === 'RECEPTIONIST'

  const [isFreezeModalOpen, setIsFreezeModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    subscriptionId: 0,
    startDate: '',
    endDate: '',
    reason: '',
  })

  const { data: freezes = [], isLoading } = useQuery({
    queryKey: ['membership-freezes'],
    queryFn: () => getFreezes(),
  })

  const { data: frozenSubs = [] } = useQuery({
    queryKey: ['frozen-subscriptions'],
    queryFn: () => getFrozenSubscriptions(),
  })

  const { data: allSubs = [] } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: () => getSubscriptions(),
  })

  const activeSubs = allSubs.filter(
    (s) => s.status === 'ACTIVE' && new Date(s.endDate) >= new Date(),
  )

  const createMutation = useMutation({
    mutationFn: createFreeze,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['membership-freezes'] })
      queryClient.invalidateQueries({ queryKey: ['frozen-subscriptions'] })
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
      setIsFreezeModalOpen(false)
      toast.success('Membresía congelada exitosamente')
    },
    onError: (error: Error) =>
      toast.error(error.message || 'Error al congelar'),
  })

  const resumeMutation = useMutation({
    mutationFn: resumeSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['membership-freezes'] })
      queryClient.invalidateQueries({ queryKey: ['frozen-subscriptions'] })
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
      toast.success('Suscripción reanudada exitosamente')
    },
    onError: (error: Error) =>
      toast.error(error.message || 'Error al reanudar'),
  })

  const handleOpenFreezeModal = () => {
    setFormData({ subscriptionId: 0, startDate: '', endDate: '', reason: '' })
    setSearchTerm('')
    setIsFreezeModalOpen(true)
  }

  const handleCreateFreeze = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate({
      data: {
        subscriptionId: formData.subscriptionId,
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason || undefined,
      },
    })
  }

  const selectedSub = activeSubs.find((s) => s.id === formData.subscriptionId)
  const calculatedEndDate =
    selectedSub && formData.startDate && formData.endDate
      ? (() => {
          const freezeDays = Math.ceil(
            (new Date(formData.endDate).getTime() -
              new Date(formData.startDate).getTime()) /
              (1000 * 60 * 60 * 24),
          )
          const end = new Date(selectedSub.endDate)
          end.setDate(end.getDate() + freezeDays)
          return end
        })()
      : null

  const daysRemaining = (freezeEnd: Date) => {
    const diff = new Date(freezeEnd).getTime() - Date.now()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  const getFreezeStatus = (f: { resumedAt: Date | null; endDate: Date }) => {
    if (f.resumedAt) return <Badge variant="secondary">Reanudado</Badge>
    const remaining = daysRemaining(f.endDate)
    if (remaining <= 0) return <Badge variant="outline">Finalizado</Badge>
    if (remaining <= 3)
      return <Badge variant="destructive">{remaining} días rest.</Badge>
    return (
      <Badge className="bg-sky-500/15 text-sky-600 border-sky-500/20">
        {remaining} días rest.
      </Badge>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Congelamientos"
        description="Gestioná las pausas temporales de membresías."
        action={
          canWrite && (
            <Button onClick={handleOpenFreezeModal}>
              <Snowflake className="mr-2 size-4" /> Congelar Membresía
            </Button>
          )
        }
      />

      {frozenSubs.length > 0 && (
        <Card className="transition-all duration-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Snowflake className="size-5 text-sky-500" />
              <CardTitle>Suscripciones congeladas</CardTitle>
              <CardDescription>
                {frozenSubs.length}{' '}
                {frozenSubs.length === 1 ? 'suscripción' : 'suscripciones'}{' '}
                actualmente en pausa
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Socio</TableHead>
                  <TableHead>Paquete</TableHead>
                  <TableHead>Congelado desde</TableHead>
                  <TableHead>Finaliza</TableHead>
                  <TableHead>Días rest.</TableHead>
                  {isAdmin && (
                    <TableHead className="text-right">Acciones</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {frozenSubs.map((f) => {
                  const remaining = daysRemaining(f.endDate)
                  return (
                    <TableRow key={f.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="size-4 text-muted-foreground shrink-0" />
                          <span className="font-medium">
                            {f.member.fullName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-primary">
                          {f.subscription.package?.name || f.subscription.plan?.name || 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell>{formatDate(f.startDate)}</TableCell>
                      <TableCell>{formatDate(f.endDate)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={remaining <= 3 ? 'destructive' : 'secondary'}
                        >
                          {remaining} días
                        </Badge>
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (
                                confirm(
                                  '¿Reanudar esta suscripción anticipadamente?',
                                )
                              ) {
                                resumeMutation.mutate({
                                  data: { freezeId: f.id },
                                })
                              }
                            }}
                          >
                            <Play className="size-3.5 mr-1" />
                            Reanudar
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card className="transition-all duration-200">
        <CardHeader>
          <CardTitle>Historial de congelamientos</CardTitle>
          <CardDescription>
            Todos los congelamientos registrados, activos y pasados.
          </CardDescription>
        </CardHeader>
        <DataTable
          columns={[
            {
              key: 'member',
              label: 'Socio',
              render: (f: (typeof freezes)[number]) => (
                <div className="flex items-center gap-2">
                  <Users className="size-4 text-muted-foreground shrink-0" />
                  <div>
                    <div className="font-medium">{f.member.fullName}</div>
                    {f.subscription.member.email && (
                      <div className="text-xs text-muted-foreground">
                        {f.subscription.member.email}
                      </div>
                    )}
                  </div>
                </div>
              ),
            },
            {
              key: 'plan',
              label: 'Paquete',
              render: (f: (typeof freezes)[number]) => (
                <span className="font-medium text-primary">
                  {f.subscription.package?.name || f.subscription.plan?.name || 'N/A'}
                </span>
              ),
            },
            {
              key: 'start',
              label: 'Inicio',
              render: (f: (typeof freezes)[number]) => formatDate(f.startDate),
            },
            {
              key: 'end',
              label: 'Fin',
              render: (f: (typeof freezes)[number]) => formatDate(f.endDate),
            },
            {
              key: 'reason',
              label: 'Motivo',
              render: (f: (typeof freezes)[number]) => (
                <span className="max-w-[200px] truncate">
                  {f.reason || '—'}
                </span>
              ),
            },
            {
              key: 'status',
              label: 'Estado',
              render: (f: (typeof freezes)[number]) => getFreezeStatus(f),
            },
            ...(isAdmin
              ? [
                  {
                    key: 'actions' as string,
                    label: 'Acciones',
                    className: 'text-right' as string,
                    render: (f: (typeof freezes)[number]) => {
                      const remaining = daysRemaining(f.endDate)
                      return !f.resumedAt && remaining > 0 ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (
                              confirm(
                                '¿Reanudar esta suscripción anticipadamente?',
                              )
                            ) {
                              resumeMutation.mutate({
                                data: { freezeId: f.id },
                              })
                            }
                          }}
                        >
                          <Play className="size-3.5 mr-1" /> Reanudar
                        </Button>
                      ) : null
                    },
                  },
                ]
              : []),
          ]}
          data={freezes}
          isLoading={isLoading}
          loadingMessage="Cargando congelamientos..."
          emptyMessage="No hay congelamientos registrados."
          keyExtractor={(f: (typeof freezes)[number]) => f.id}
        />
      </Card>

      <Dialog open={isFreezeModalOpen} onOpenChange={setIsFreezeModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleCreateFreeze}>
            <DialogHeader>
              <DialogTitle>Congelar Membresía</DialogTitle>
              <DialogDescription>
                Pausá temporalmente la suscripción de un socio. Los días
                congelados se añadirán al final del período.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="memberSearch">
                  Socio <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="memberSearch"
                    placeholder="Buscar socio por nombre o documento..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="subscription">
                  Suscripción activa <span className="text-destructive">*</span>
                </Label>
                <select
                  id="subscription"
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  value={formData.subscriptionId || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      subscriptionId: Number(e.target.value),
                    })
                  }
                >
                  <option value="" disabled>
                    Seleccioná una suscripción activa...
                  </option>
                  {activeSubs.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.member.fullName} — {s.package?.name || s.plan?.name || 'N/A'} (vence:{' '}
                      {formatDate(s.endDate)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="startDate">
                    Inicio del congelamiento{' '}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endDate">
                    Fin del congelamiento{' '}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                  />
                </div>
              </div>

              {selectedSub && calculatedEndDate && (
                <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Vencimiento actual:
                    </span>
                    <span className="font-medium">
                      {formatDate(selectedSub.endDate)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Nuevo vencimiento:
                    </span>
                    <span className="font-medium text-primary">
                      {formatDate(calculatedEndDate)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Días extendidos:
                    </span>
                    <span className="font-medium">
                      {Math.ceil(
                        (new Date(formData.endDate).getTime() -
                          new Date(formData.startDate).getTime()) /
                          (1000 * 60 * 60 * 24),
                      )}{' '}
                      días
                    </span>
                  </div>
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="reason">Motivo</Label>
                <Textarea
                  id="reason"
                  placeholder="Ej: Viaje al exterior, razones médicas..."
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFreezeModalOpen(false)}
              >
                Cancelar
              </Button>
              <LoadingButton
                type="submit"
                isLoading={createMutation.isPending}
                disabled={
                  !formData.subscriptionId ||
                  !formData.startDate ||
                  !formData.endDate
                }
              >
                Congelar Membresía
              </LoadingButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
