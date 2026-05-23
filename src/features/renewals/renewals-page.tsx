import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { RefreshCw, Users, Calendar, AlertTriangle, Receipt } from 'lucide-react'
import { toast } from 'sonner'
import {
  getExpiringSubscriptions,
  getExpiredSubscriptions,
  renewSubscription,
} from '#/features/renewals/server.ts'
import { getActivePlans } from '#/features/membership-plans/server.ts'
import { formatCurrency, formatDate } from '#/shared/lib/formatters.ts'

import { Button } from '#/shared/components/ui/button'
import { LoadingButton } from '#/shared/components/ui/loading-button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/shared/components/ui/card'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/shared/components/ui/table'
import { Badge } from '#/shared/components/ui/badge'
import { Skeleton } from '#/shared/components/ui/skeleton'

const paymentMethods = [
  { value: 'CASH', label: 'Efectivo' },
  { value: 'CARD', label: 'Tarjeta (Crédito/Débito)' },
  { value: 'TRANSFER', label: 'Transferencia' },
  { value: 'QR', label: 'QR / Mercado Pago' },
] as const

interface SubscriptionWithRelations {
  id: number
  memberId: number
  planId: number
  startDate: Date
  endDate: Date
  status: string
  notes: string | null
  member: {
    id: number
    fullName: string
    email: string | null
    phone: string | null
    documentNumber: string | null
  }
  plan: {
    id: number
    name: string
    durationDays: number
    price: string
    isActive: boolean
  }
}

export function RenewalsPage() {
  const queryClient = useQueryClient()

  const [days, setDays] = useState(7)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedSub, setSelectedSub] = useState<SubscriptionWithRelations | null>(null)
  const [formData, setFormData] = useState({
    planId: 0,
    paymentMethod: 'CASH' as 'CASH' | 'CARD' | 'TRANSFER' | 'QR',
    amount: '',
    notes: '',
  })

  const { data: expiringList = [], isLoading: loadingExpiring } = useQuery({
    queryKey: ['renewals', 'expiring', days],
    queryFn: () => getExpiringSubscriptions({ data: { days } }),
  })

  const { data: expiredList = [], isLoading: loadingExpired } = useQuery({
    queryKey: ['renewals', 'expired'],
    queryFn: () => getExpiredSubscriptions(),
  })

  const { data: plans = [] } = useQuery({
    queryKey: ['active-plans'],
    queryFn: () => getActivePlans(),
  })

  const renewMutation = useMutation({
    mutationFn: renewSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['renewals'] })
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
      setIsModalOpen(false)
      setSelectedSub(null)
      toast.success('Membresía renovada exitosamente')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al renovar la membresía')
    },
  })

  const handleOpenRenew = (sub: SubscriptionWithRelations) => {
    setSelectedSub(sub)
    setFormData({
      planId: sub.planId,
      paymentMethod: 'CASH',
      amount: sub.plan.price,
      notes: '',
    })
    setIsModalOpen(true)
  }

  const handlePlanChange = (planId: number) => {
    const plan = plans.find((p) => p.id === planId)
    if (!plan) return
    setFormData({ ...formData, planId, amount: plan.price })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSub) return

    renewMutation.mutate({
      data: {
        memberId: selectedSub.memberId,
        planId: formData.planId,
        paymentMethod: formData.paymentMethod,
        amount: formData.amount,
        notes: formData.notes || undefined,
      },
    })
  }

  const daysLeft = (endDate: Date) => {
    const diff = new Date(endDate).getTime() - Date.now()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  const daysOverdue = (endDate: Date) => {
    const diff = Date.now() - new Date(endDate).getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Renovaciones</h1>
        <p className="text-muted-foreground">
          Gestioná las renovaciones de membresías próximas a vencer y vencidas.
        </p>
      </div>

      <Card className="transition-all duration-200">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="size-5 text-primary" />
                Próximos a vencer
              </CardTitle>
              <CardDescription>
                Suscripciones activas que vencen en los próximos días.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="days" className="text-sm whitespace-nowrap">
                Mostrar próximos
              </Label>
              <Input
                id="days"
                type="number"
                min={1}
                max={90}
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="w-16 h-8 text-center"
              />
              <span className="text-sm text-muted-foreground">días</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Socio</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Vence</TableHead>
                <TableHead>Días restantes</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingExpiring ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : expiringList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No hay suscripciones próximas a vencer.
                  </TableCell>
                </TableRow>
              ) : (
                expiringList.map((sub) => {
                  const left = daysLeft(sub.endDate)
                  return (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="size-4 text-muted-foreground shrink-0" />
                          <div>
                            <div className="font-medium">{sub.member.fullName}</div>
                            <div className="text-xs text-muted-foreground">{sub.member.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-primary">{sub.plan.name}</div>
                      </TableCell>
                      <TableCell>{formatDate(sub.endDate)}</TableCell>
                      <TableCell>
                        {left <= 3 ? (
                          <Badge variant="destructive">{left} días</Badge>
                        ) : left <= 7 ? (
                          <Badge variant="secondary" className="bg-orange-500/15 text-orange-600">
                            {left} días
                          </Badge>
                        ) : (
                          <Badge variant="secondary">{left} días</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" onClick={() => handleOpenRenew(sub)}>
                          <RefreshCw className="size-3.5 mr-1" />
                          Renovar
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="transition-all duration-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-destructive" />
            Vencidas
          </CardTitle>
          <CardDescription>
            Suscripciones que ya han expirado y necesitan renovación.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Socio</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Venció</TableHead>
                <TableHead>Días vencida</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingExpired ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : expiredList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No hay suscripciones vencidas.
                  </TableCell>
                </TableRow>
              ) : (
                expiredList.map((sub) => {
                  const overdue = daysOverdue(sub.endDate)
                  return (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="size-4 text-muted-foreground shrink-0" />
                          <div>
                            <div className="font-medium">{sub.member.fullName}</div>
                            <div className="text-xs text-muted-foreground">{sub.member.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-primary">{sub.plan.name}</div>
                      </TableCell>
                      <TableCell>{formatDate(sub.endDate)}</TableCell>
                      <TableCell>
                        <Badge variant="destructive">{overdue} días</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" onClick={() => handleOpenRenew(sub)}>
                          <RefreshCw className="size-3.5 mr-1" />
                          Renovar
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Renovar Membresía</DialogTitle>
              <DialogDescription>
                Completá los datos para renovar la membresía del socio.
              </DialogDescription>
            </DialogHeader>

            {selectedSub && (
              <div className="grid gap-4 py-4">
                <div className="bg-muted/50 rounded-lg p-3 border">
                  <div className="text-sm font-medium">{selectedSub.member.fullName}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {selectedSub.member.email && <span>{selectedSub.member.email} · </span>}
                    {selectedSub.member.phone && <span>{selectedSub.member.phone}</span>}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Documento: {selectedSub.member.documentNumber || '—'}
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="plan">
                    Plan de Membresía <span className="text-destructive">*</span>
                  </Label>
                  <select
                    id="plan"
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    value={formData.planId || ''}
                    onChange={(e) => handlePlanChange(Number(e.target.value))}
                  >
                    <option value="" disabled>
                      Seleccione un plan...
                    </option>
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} - {formatCurrency(p.price)} ({p.durationDays} días)
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
                        paymentMethod: e.target.value as 'CASH' | 'CARD' | 'TRANSFER' | 'QR',
                      })
                    }
                  >
                    {paymentMethods.map((pm) => (
                      <option key={pm.value} value={pm.value}>
                        {pm.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="amount">
                    Monto <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="notes">Notas (opcional)</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Notas sobre la renovación..."
                  />
                </div>

                <div className="bg-primary/5 border border-primary/10 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-primary font-medium">
                    <Receipt className="size-5" />
                    <span>Total</span>
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {formatCurrency(formData.amount || 0)}
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsModalOpen(false)
                  setSelectedSub(null)
                }}
              >
                Cancelar
              </Button>
              <LoadingButton
                type="submit"
                isLoading={renewMutation.isPending}
                disabled={!formData.planId || !formData.amount}
              >
                Confirmar Renovación
              </LoadingButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
