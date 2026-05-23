import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Truck, Plus, Edit, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { getSuppliers, createSupplier, updateSupplier } from '#/features/suppliers/server.ts'
import { Button } from '#/shared/components/ui/button'
import { Input } from '#/shared/components/ui/input'
import { Textarea } from '#/shared/components/ui/textarea'
import { Badge } from '#/shared/components/ui/badge'
import { PageHeader } from '#/shared/components/page-header'
import { DataTable } from '#/shared/components/data-table'
import { Route as authedRoute } from '#/routes/_authed.tsx'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '#/shared/components/ui/dialog'


export function SuppliersPage() {
  const queryClient = useQueryClient()
  const { userRole } = authedRoute.useRouteContext()
  const isAdmin = userRole === 'ADMIN'

  const [isOpen, setIsOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<typeof suppliersList[number] | null>(null)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')

  const { data: suppliersList = [], isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => getSuppliers(),
  })

  const createMutation = useMutation({
    mutationFn: createSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      toast.success('Proveedor registrado con éxito')
      closeModal()
    },
    onError: () => toast.error('Error al registrar proveedor'),
  })

  const updateMutation = useMutation({
    mutationFn: updateSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      toast.success('Proveedor actualizado con éxito')
      closeModal()
    },
    onError: () => toast.error('Error al actualizar proveedor'),
  })

  const openCreateModal = () => {
    setEditingSupplier(null)
    setName('')
    setPhone('')
    setEmail('')
    setAddress('')
    setNotes('')
    setIsOpen(true)
  }

  const openEditModal = (sup: typeof suppliersList[number]) => {
    setEditingSupplier(sup)
    setName(sup.name)
    setPhone(sup.phone || '')
    setEmail(sup.email || '')
    setAddress(sup.address || '')
    setNotes(sup.notes || '')
    setIsOpen(true)
  }

  const closeModal = () => {
    setIsOpen(false)
    setEditingSupplier(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return

    const payload = { name, phone, email, address, notes }

    if (editingSupplier) {
      updateMutation.mutate({
        data: {
          id: editingSupplier.id,
          ...payload,
          isActive: editingSupplier.isActive,
        },
      })
    } else {
      createMutation.mutate({ data: payload })
    }
  }

  const toggleStatus = (sup: typeof suppliersList[number]) => {
    updateMutation.mutate({
      data: {
        id: sup.id,
        name: sup.name,
        phone: sup.phone || undefined,
        email: sup.email || undefined,
        address: sup.address || undefined,
        notes: sup.notes || undefined,
        isActive: !sup.isActive,
      },
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Proveedores"
        description="Administrá los contactos de proveedores del buffet y equipamiento."
        icon={<Truck className="size-8 text-primary" />}
        action={isAdmin && <Button onClick={openCreateModal}><Plus className="size-4" /> Nuevo Proveedor</Button>}
      />

      <DataTable
        columns={[
          { key: 'name', label: 'Nombre', render: (sup: typeof suppliersList[number]) => <span className="font-semibold">{sup.name}</span> },
          { key: 'phone', label: 'Teléfono', render: (sup: typeof suppliersList[number]) => sup.phone || '-' },
          { key: 'email', label: 'Email', render: (sup: typeof suppliersList[number]) => sup.email || '-' },
          { key: 'address', label: 'Dirección', render: (sup: typeof suppliersList[number]) => <span className="text-muted-foreground max-w-xs truncate">{sup.address || '-'}</span> },
          { key: 'status', label: 'Estado', render: (sup: typeof suppliersList[number]) => (
            sup.isActive
              ? <Badge className="bg-emerald-500/10 text-emerald-600 border-none">Activo</Badge>
              : <Badge variant="secondary">Inactivo</Badge>
          )},
          { key: 'actions', label: 'Acciones', className: 'text-right', render: (sup: typeof suppliersList[number]) => isAdmin ? (
            <div className="flex justify-end gap-2">
              <Button size="icon" variant="ghost" onClick={() => openEditModal(sup)}>
                <Edit className="size-4" />
              </Button>
              <Button size="icon" variant="ghost" className={sup.isActive ? 'text-red-500' : 'text-emerald-500'} onClick={() => toggleStatus(sup)}>
                {sup.isActive ? <XCircle className="size-4" /> : <CheckCircle className="size-4" />}
              </Button>
            </div>
          ) : null},
        ]}
        data={suppliersList}
        isLoading={isLoading}
        emptyMessage="No hay proveedores registrados."
        keyExtractor={(sup: typeof suppliersList[number]) => sup.id}
      />

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Nombre / Razón Social *</label>
              <Input placeholder="Ej. Distribuidora S.A." value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Teléfono</label>
                <Input placeholder="Ej. 11223344" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Email</label>
                <Input type="email" placeholder="Ej. info@distribuidora.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Dirección</label>
              <Input placeholder="Dirección comercial" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Notas / Observaciones</label>
              <Textarea placeholder="Métodos de envío, condiciones de pago, etc..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={closeModal}>Cancelar</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingSupplier ? 'Guardar Cambios' : 'Registrar Proveedor'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
