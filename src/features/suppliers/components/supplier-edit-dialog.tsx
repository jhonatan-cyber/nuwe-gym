import type { Supplier } from '#/features/suppliers/types.ts'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '#/shared/components/ui/dialog'
import { Input } from '#/shared/components/ui/input'
import { Textarea } from '#/shared/components/ui/textarea'
import { Button } from '#/shared/components/ui/button'
import { useState, useEffect } from 'react'

interface SupplierEditDialogProps {
  supplier: Supplier | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: {
    id: string
    name: string
    phone?: string
    email?: string
    address?: string
    notes?: string
    isActive: boolean
  }) => void
  isPending: boolean
}

export function SupplierEditDialog({
  supplier,
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: SupplierEditDialogProps) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (supplier && open) {
      setName(supplier.name)
      setPhone(supplier.phone || '')
      setEmail(supplier.email || '')
      setAddress(supplier.address || '')
      setNotes(supplier.notes || '')
    }
  }, [supplier, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!supplier || !name) return
    onSubmit({
      id: supplier.id,
      name,
      phone: phone || undefined,
      email: email || undefined,
      address: address || undefined,
      notes: notes || undefined,
      isActive: supplier.isActive,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Proveedor</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">
              Nombre / Razón Social *
            </label>
            <Input
              placeholder="Ej. Distribuidora S.A."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Teléfono</label>
              <Input
                placeholder="Ej. 11223344"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                placeholder="Ej. info@distribuidora.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Dirección</label>
            <Input
              placeholder="Dirección comercial"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">
              Notas / Observaciones
            </label>
            <Textarea
              placeholder="Métodos de envío, condiciones de pago, etc..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              Guardar Cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
