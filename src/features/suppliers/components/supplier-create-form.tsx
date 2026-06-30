import { useState } from 'react'
import { Input } from '#/shared/components/ui/input'
import { Textarea } from '#/shared/components/ui/textarea'
import { Button } from '#/shared/components/ui/button'

interface SupplierCreateFormProps {
  onSubmit: (data: {
    name: string
    phone?: string
    email?: string
    address?: string
    notes?: string
  }) => void
  onBack: () => void
  isPending: boolean
}

export function SupplierCreateForm({
  onSubmit,
  onBack,
  isPending,
}: SupplierCreateFormProps) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return
    onSubmit({
      name,
      phone: phone || undefined,
      email: email || undefined,
      address: address || undefined,
      notes: notes || undefined,
    })
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 max-w-2xl mx-auto w-full">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border dark:border-white/8 border-black/8 p-5 bg-card space-y-4">
          <h3 className="font-bold text-sm">Información del Proveedor</h3>

          <div className="space-y-1">
            <label className="text-sm font-medium">
              Nombre / Razón Social *
            </label>
              <Input
                placeholder="Ej. Distribuidora S.A."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-full"
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
                className="rounded-full"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                placeholder="Ej. info@distribuidora.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-full"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Dirección</label>
              <Input
                placeholder="Dirección comercial"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="rounded-full"
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
                className="rounded-2xl"
              />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="rounded-full"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isPending || !name}
            className="rounded-full"
          >
            {isPending ? 'Registrando...' : 'Registrar Proveedor'}
          </Button>
        </div>
      </form>
    </div>
  )
}
