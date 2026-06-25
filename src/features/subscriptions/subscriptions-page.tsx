import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, XCircle, Users, Receipt, ChevronRight, CreditCard } from 'lucide-react'
import { toast } from 'sonner'
import { Link } from '@tanstack/react-router'
import {
  getSubscriptions,
  createSubscription,
  cancelSubscription,
} from '#/features/subscriptions/server.ts'
import { getMembers } from '#/features/members/server.ts'
import { getActivePlans } from '#/features/membership-plans/server.ts'
import { formatCurrency, formatDate } from '#/shared/lib/formatters.ts'
import { ModuleLayout } from '#/shared/components/layout/module-layout.tsx'

import { Button } from '#/shared/components/ui/button'
import { LoadingButton } from '#/shared/components/ui/loading-button'
import { Input } from '#/shared/components/ui/input'
import { Label } from '#/shared/components/ui/label'

import { DataTable } from '#/shared/components/data-table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/shared/components/ui/dialog'
import { Badge } from '#/shared/components/ui/badge'

interface SubscriptionsPageProps {
  userRole: string
}

export function SubscriptionsPage({ userRole }: SubscriptionsPageProps) {
  const queryClient = useQueryClient()
  const isReadOnly = userRole === 'TRAINER'

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    memberId: 0,
    planId: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    amountPaid: '',
    paymentMethod: 'CASH' as 'CASH' | 'CARD' | 'TRANSFER' | 'QR',
  })

  const { data: subsList = [], isLoading } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: () => getSubscriptions(),
  })

  const { data: members = [] } = useQuery({
    queryKey: ['members', ''],
    queryFn: () => getMembers({ data: { search: '' } }),
  })

  const { data: plans = [] } = useQuery({
    queryKey: ['active-plans'],
    queryFn: () => getActivePlans(),
  })

  const createMutation = useMutation({
    mutationFn: createSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
      queryClient.invalidateQueries({ queryKey: ['members'] })
      setIsModalOpen(false)
      toast.success('Suscripción y pago registrados exitosamente')
    },
    onError: () => toast.error('Error al registrar la suscripción'),
  })

  const cancelMutation = useMutation({
    mutationFn: cancelSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
      queryClient.invalidateQueries({ queryKey: ['members'] })
      toast.success('Suscripción cancelada')
    },
    onError: () => toast.error('Error al cancelar'),
  })

  const handlePlanSelect = (planId: number) => {
    const plan = plans.find((p) => p.id === planId)
    if (!plan) return

    const start = new Date(formData.startDate)
    start.setDate(start.getDate() + plan.durationDays)

    setFormData({
      ...formData,
      planId,
      amountPaid: plan.price,
      endDate: start.toISOString().split('T')[0],
    })
  }

  const handleStartDateChange = (date: string) => {
    if (!formData.planId) {
      setFormData({ ...formData, startDate: date })
      return
    }
    const plan = plans.find((p) => p.id === formData.planId)
    const start = new Date(date)
    start.setDate(start.getDate() + (plan?.durationDays || 30))
    setFormData({
      ...formData,
      startDate: date,
      endDate: start.toISOString().split('T')[0],
    })
  }

  const handleOpenModal = () => {
    setFormData({
      memberId: 0,
      planId: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      amountPaid: '',
      paymentMethod: 'CASH',
    })
    setIsModalOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate({ data: formData })
  }

  const getStatusBadge = (status: string, endDate: Date) => {
    if (status === 'CANCELLED')
      return <Badge variant="destructive">Cancelada</Badge>
    if (new Date(endDate) < new Date())
      return (
        <Badge variant="secondary" className="bg-orange-500/15 text-orange-600">
          Vencida
        </Badge>
      )
    return (
      <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 border-emerald-500/20">
        Activa
      </Badge>
    )
  }

  const totalSubscriptions = subsList.length
  const activeSubscriptions = subsList.filter(
    (s) => s.status === 'ACTIVE' && new Date(s.endDate) >= new Date()
  ).length
  const expiredSubscriptions = subsList.filter(
    (s) => s.status === 'ACTIVE' && new Date(s.endDate) < new Date()
  ).length

  return (
    <ModuleLayout
      breadcrumb={
        <>
          <Link to="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
          <ChevronRight className="size-3 mx-1 inline" />
          <span className="dark:text-white/60 text-foreground/60">Suscripciones</span>
        </>
      }
      title="Suscripciones"
      headerActions={
        !isReadOnly && (
          <Button onClick={handleOpenModal}>
            <Plus className="mr-2 size-4" /> Nueva Suscripción
          </Button>
        )
      }
      leftPanel={
        <div className="flex flex-col gap-6 z-10 w-full">
          {/* Navigation menu */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">Sección</p>
            <div className="flex flex-col gap-1.5">
              <div className="w-full text-left p-3.5 rounded-2xl flex items-center gap-3 transition-all duration-200 border bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/20">
                <div className="size-8 rounded-xl flex items-center justify-center shrink-0 bg-white/20">
                  <CreditCard className="size-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold">Membresías</p>
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-white/60">Planes y Vigencia</p>
                </div>
              </div>
            </div>
          </div>

          {/* Metrics */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">Métricas</p>
            <div className="grid grid-cols-1 gap-2.5">
              <div className="bg-muted p-4 rounded-2xl border border-border/10 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Total Suscripciones</p>
                  <p className="text-xl font-black mt-0.5">{totalSubscriptions}</p>
                </div>
              </div>
              <div className="bg-muted p-4 rounded-2xl border border-border/10 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Activas</p>
                  <p className="text-xl font-black text-emerald-500 mt-0.5">{activeSubscriptions}</p>
                </div>
              </div>
              <div className="bg-muted p-4 rounded-2xl border border-border/10 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Vencidas</p>
                  <p className="text-xl font-black text-amber-500 mt-0.5">{expiredSubscriptions}</p>
                </div>
              </div>
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
            render: (sub: (typeof subsList)[number]) => (
              <div className="flex items-center gap-2">
                <Users className="size-4 text-muted-foreground" />
                <span className="font-medium">{sub.member.fullName}</span>
              </div>
            ),
          },
          {
            key: 'plan',
            label: 'Plan',
            render: (sub: (typeof subsList)[number]) => (
              <div>
                <span className="font-medium text-primary">
                  {sub.plan.name}
                </span>
                <div className="text-xs text-muted-foreground">
                  Alta: {formatDate(sub.createdAt)}
                </div>
              </div>
            ),
          },
          {
            key: 'dates',
            label: 'Vigencia',
            render: (sub: (typeof subsList)[number]) => (
              <div className="flex flex-col text-sm">
                <span className="text-muted-foreground">
                  Desde: {formatDate(sub.startDate)}
                </span>
                <span className="font-medium">
                  Hasta: {formatDate(sub.endDate)}
                </span>
              </div>
            ),
          },
          {
            key: 'status',
            label: 'Estado',
            render: (sub: (typeof subsList)[number]) =>
              getStatusBadge(sub.status, new Date(sub.endDate)),
          },
          ...(!isReadOnly
            ? [
                {
                  key: 'actions' as string,
                  label: 'Acciones',
                  className: 'text-right' as string,
                  render: (sub: (typeof subsList)[number]) =>
                    sub.status === 'ACTIVE' &&
                    new Date(sub.endDate) >= new Date() ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          if (
                            confirm(
                              '¿Está seguro de cancelar esta suscripción? El socio perderá el acceso inmediatamente.',
                            )
                          ) {
                            cancelMutation.mutate({ data: sub.id })
                          }
                        }}
                      >
                        <XCircle className="size-4 mr-2" /> Cancelar
                      </Button>
                    ) : null,
                },
              ]
            : []),
        ]}
        data={subsList}
        isLoading={isLoading}
        loadingMessage="Cargando suscripciones..."
        emptyMessage="No hay suscripciones registradas."
        keyExtractor={(sub: (typeof subsList)[number]) => sub.id}
      />
    </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Alta de Suscripción</DialogTitle>
              <DialogDescription>
                Asigná un plan a un socio y registrá el pago correspondiente.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid gap-2">
                <Label htmlFor="member">
                  Socio <span className="text-destructive">*</span>
                </Label>
                <select
                  id="member"
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  value={formData.memberId || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      memberId: Number(e.target.value),
                    })
                  }
                >
                  <option value="" disabled>
                    Seleccione un socio...
                  </option>
                  {members.map((m: (typeof members)[number]) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName} (DNI: {m.documentNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div className="grid gap-2">
                  <Label htmlFor="plan">
                    Plan de Membresía{' '}
                    <span className="text-destructive">*</span>
                  </Label>
                  <select
                    id="plan"
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    value={formData.planId || ''}
                    onChange={(e) => handlePlanSelect(Number(e.target.value))}
                  >
                    <option value="" disabled>
                      Seleccione un plan...
                    </option>
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} - {formatCurrency(p.price)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="paymentMethod">
                    Medio de Pago <span className="text-destructive">*</span>
                  </Label>
                  <select
                    id="paymentMethod"
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    value={formData.paymentMethod}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        paymentMethod: e.target.value as
                          | 'CASH'
                          | 'CARD'
                          | 'TRANSFER'
                          | 'QR',
                      })
                    }
                  >
                    <option value="CASH">Efectivo</option>
                    <option value="CARD">Tarjeta (Crédito/Débito)</option>
                    <option value="TRANSFER">Transferencia</option>
                    <option value="QR">QR / Mercado Pago</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="startDate">
                    Fecha de Inicio <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endDate">Fecha de Vencimiento</Label>
                  <Input
                    id="endDate"
                    type="date"
                    readOnly
                    className="bg-muted"
                    value={formData.endDate}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Calculado automáticamente por el plan.
                  </p>
                </div>
              </div>

              <div className="bg-primary/5 border border-primary/10 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-primary font-medium">
                  <Receipt className="size-5" />
                  <span>Total a Pagar</span>
                </div>
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(formData.amountPaid || 0)}
                </div>
              </div>
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
                isLoading={createMutation.isPending}
                disabled={!formData.memberId || !formData.planId}
              >
                Confirmar Suscripción y Pago
              </LoadingButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </ModuleLayout>
  )
}
