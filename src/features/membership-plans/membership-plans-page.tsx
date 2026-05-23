import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit2, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { getPlans, createPlan, updatePlan } from '#/features/membership-plans/server.ts'
import { formatCurrency } from '#/shared/lib/formatters.ts'

import { Button } from '#/shared/components/ui/button'
import { LoadingButton } from '#/shared/components/ui/loading-button'
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
import { Badge } from '#/shared/components/ui/badge'


interface MembershipPlansPageProps {
  userRole: string
}

export function MembershipPlansPage({ userRole }: MembershipPlansPageProps) {
  const queryClient = useQueryClient()
  const isReadOnly = userRole === 'TRAINER'

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<typeof plans[number] | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    durationDays: 30,
    price: '',
    isActive: true,
  })

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: () => getPlans(),
  })

  const createMutation = useMutation({
    mutationFn: createPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] })
      setIsModalOpen(false)
      toast.success('Plan creado exitosamente')
    },
    onError: () => toast.error('Error al crear el plan'),
  })

  const updateMutation = useMutation({
    mutationFn: updatePlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] })
      setIsModalOpen(false)
      toast.success('Plan actualizado')
    },
    onError: () => toast.error('Error al actualizar el plan'),
  })

  const handleOpenModal = (plan?: typeof plans[number]) => {
    if (plan) {
      setEditingPlan(plan)
      setFormData({
        name: plan.name,
        description: plan.description || '',
        durationDays: plan.durationDays,
        price: plan.price,
        isActive: plan.isActive,
      })
    } else {
      setEditingPlan(null)
      setFormData({
        name: '',
        description: '',
        durationDays: 30,
        price: '',
        isActive: true,
      })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingPlan) {
      updateMutation.mutate({ data: { ...formData, id: editingPlan.id } })
    } else {
      const { name, description, durationDays, price } = formData
      createMutation.mutate({ data: { name, description, durationDays, price } })
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Planes de Membresía"
        description="Administrá los tipos de planes y tarifas del gimnasio."
        action={!isReadOnly && <Button onClick={() => handleOpenModal()}><Plus className="mr-2 size-4" /> Nuevo Plan</Button>}
      />

      <DataTable
        columns={[
          { key: 'name', label: 'Nombre', render: (plan: typeof plans[number]) => (
            <div>
              <span className="font-medium">{plan.name}</span>
              {plan.description && <p className="text-xs text-muted-foreground">{plan.description}</p>}
            </div>
          )},
          { key: 'duration', label: 'Duración (Días)', render: (plan: typeof plans[number]) => `${plan.durationDays} días` },
          { key: 'price', label: 'Precio', render: (plan: typeof plans[number]) => <span className="font-medium">{formatCurrency(plan.price)}</span> },
          { key: 'status', label: 'Estado', render: (plan: typeof plans[number]) => (
            <Badge variant={plan.isActive ? 'default' : 'secondary'} className="gap-1">
              {plan.isActive ? <CheckCircle2 className="size-3" /> : <XCircle className="size-3" />}
              {plan.isActive ? 'Activo' : 'Inactivo'}
            </Badge>
          )},
          ...(!isReadOnly ? [{
            key: 'actions' as string, label: 'Acciones', className: 'text-right' as string, render: (plan: typeof plans[number]) => (
              <Button variant="ghost" size="icon" onClick={() => handleOpenModal(plan)}>
                <Edit2 className="size-4" />
              </Button>
            ),
          }] : []),
        ]}
        data={plans}
        isLoading={isLoading}
        loadingMessage="Cargando planes..."
        emptyMessage="No hay planes registrados."
        keyExtractor={(plan: typeof plans[number]) => plan.id}
      />

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingPlan ? 'Editar Plan' : 'Crear Plan'}
              </DialogTitle>
              <DialogDescription>
                Completá los datos del plan de membresía.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nombre del Plan</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Ej: Pase Libre Mensual"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Acceso libre a musculación y cardio..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="duration">Duración (Días)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    required
                    value={formData.durationDays}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        durationDays: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="price">Precio (ARS)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                  />
                </div>
              </div>
              {editingPlan && (
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    className="size-4 rounded border-gray-300"
                  />
                  <Label htmlFor="isActive">
                    Plan activo (visible para ventas)
                  </Label>
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
              >
                Guardar Plan
              </LoadingButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
