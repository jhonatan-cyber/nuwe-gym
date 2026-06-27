import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Store, Plus, Pencil, Power, PowerOff, MapPin, Phone, Mail, Clock } from 'lucide-react'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '#/shared/components/ui/tooltip'
import { toast } from 'sonner'
import {
  getBranches,
  createBranch,
  updateBranch,
} from '#/features/branches/server.ts'
import { Button } from '#/shared/components/ui/button'
import { Input } from '#/shared/components/ui/input'
import { Badge } from '#/shared/components/ui/badge'
import { PageHeader } from '#/shared/components/page-header'
import { DataTable } from '#/shared/components/data-table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '#/shared/components/ui/dialog'

interface BranchForm {
  name: string
  address: string
  phone: string
  email: string
  openingTime: string
  closingTime: string
}

const emptyForm: BranchForm = {
  name: '',
  address: '',
  phone: '',
  email: '',
  openingTime: '08:00',
  closingTime: '22:00',
}

export function BranchesPage() {
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<BranchForm>(emptyForm)

  const { data: branchesList = [], isLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: () => getBranches(),
  })

  const createMutation = useMutation({
    mutationFn: createBranch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] })
      toast.success('Sucursal creada con éxito')
      closeModal()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const updateMutation = useMutation({
    mutationFn: updateBranch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] })
      toast.success('Sucursal actualizada con éxito')
      closeModal()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setIsOpen(true)
  }

  const openEdit = (branch: (typeof branchesList)[number]) => {
    setEditingId(branch.id)
    setForm({
      name: branch.name,
      address: branch.address ?? '',
      phone: branch.phone ?? '',
      email: branch.email ?? '',
      openingTime: branch.openingTime ?? '08:00',
      closingTime: branch.closingTime ?? '22:00',
    })
    setIsOpen(true)
  }

  const closeModal = () => {
    setIsOpen(false)
    setEditingId(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name) return

    if (editingId !== null) {
      updateMutation.mutate({ data: { id: editingId, ...form } })
    } else {
      createMutation.mutate({ data: form })
    }
  }

  const handleToggleActive = (branch: (typeof branchesList)[number]) => {
    updateMutation.mutate({
      data: {
        id: branch.id,
        name: branch.name,
        address: branch.address ?? '',
        phone: branch.phone ?? '',
        email: branch.email ?? '',
        openingTime: branch.openingTime ?? '08:00',
        closingTime: branch.closingTime ?? '22:00',
        isActive: !branch.isActive,
      },
    })
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Sucursales"
        description="Gestioná las sucursales del gimnasio"
        icon={<Store className="size-8 text-primary" />}
        action={
          <Button onClick={openCreate}>
            <Plus className="size-4" /> Nueva Sucursal
          </Button>
        }
      />

      <TooltipProvider delayDuration={200}>
      <DataTable
        columns={[
          {
            key: 'name',
            label: 'Nombre',
            render: (b: (typeof branchesList)[number]) => (
              <span className="font-semibold">{b.name}</span>
            ),
          },
          {
            key: 'address',
            label: 'Dirección',
            render: (b: (typeof branchesList)[number]) => (
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="size-3 text-muted-foreground shrink-0" />
                {b.address || '-'}
              </span>
            ),
          },
          {
            key: 'phone',
            label: 'Teléfono',
            render: (b: (typeof branchesList)[number]) => (
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Phone className="size-3 text-muted-foreground" />
                {b.phone || '-'}
              </span>
            ),
          },
          {
            key: 'email',
            label: 'Email',
            render: (b: (typeof branchesList)[number]) => (
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Mail className="size-3 text-muted-foreground" />
                {b.email || '-'}
              </span>
            ),
          },
          {
            key: 'hours',
            label: (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-default">Horario</span>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Horario de atención de la sucursal</p>
                </TooltipContent>
              </Tooltip>
            ),
            render: (b: (typeof branchesList)[number]) => (
              <span className="inline-flex items-center gap-1.5 text-sm whitespace-nowrap">
                <Clock className="size-3 text-muted-foreground" />
                {b.openingTime} - {b.closingTime}
              </span>
            ),
          },
          {
            key: 'status',
            label: 'Estado',
            render: (b: (typeof branchesList)[number]) => (
              <Badge variant={b.isActive ? 'default' : 'secondary'}>
                {b.isActive ? 'Activa' : 'Inactiva'}
              </Badge>
            ),
          },
          {
            key: 'actions',
            label: 'Acciones',
            className: 'text-right',
            render: (b: (typeof branchesList)[number]) => (
              <div className="flex justify-end gap-1">
                <Button size="icon" variant="ghost" onClick={() => openEdit(b)}>
                  <Pencil className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleToggleActive(b)}
                >
                  {b.isActive ? (
                    <PowerOff className="size-4 text-destructive" />
                  ) : (
                    <Power className="size-4 text-green-500" />
                  )}
                </Button>
              </div>
            ),
          },
        ]}
        data={branchesList}
        isLoading={isLoading}
        emptyMessage="No hay sucursales"
        keyExtractor={(b: (typeof branchesList)[number]) => b.id}
      />
      </TooltipProvider>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Editar Sucursal' : 'Nueva Sucursal'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Nombre *</label>
              <Input
                placeholder="Ej. Sucursal Centro"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Dirección</label>
              <Input
                placeholder="Ej. Av. Siempre Viva 123"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Teléfono</label>
                <Input
                  placeholder="Ej. 11 1234-5678"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  placeholder="Ej. centro@gimnasio.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Apertura</label>
                <Input
                  type="time"
                  value={form.openingTime}
                  onChange={(e) =>
                    setForm({ ...form, openingTime: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Cierre</label>
                <Input
                  type="time"
                  value={form.closingTime}
                  onChange={(e) =>
                    setForm({ ...form, closingTime: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={closeModal}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending || !form.name}>
                {editingId ? 'Guardar Cambios' : 'Crear Sucursal'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
