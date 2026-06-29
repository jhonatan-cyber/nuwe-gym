import type { BranchForm } from '#/features/branches/types.ts'
import { Button } from '#/shared/components/ui/button'
import { Input } from '#/shared/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '#/shared/components/ui/dialog'
import { capitalizeWords } from '#/shared/lib/formatters.ts'
import {
  CountryCodeSelect,
  COUNTRIES,
} from '#/shared/components/ui/country-code-select.tsx'

interface BranchFormDialogProps {
  isOpen: boolean
  editingId: string | null
  form: BranchForm
  isPending: boolean
  onChange: (form: BranchForm) => void
  onSubmit: (e: React.FormEvent) => void
  onClose: () => void
}

export function BranchFormDialog({
  isOpen,
  editingId,
  form,
  isPending,
  onChange,
  onSubmit,
  onClose,
}: BranchFormDialogProps) {

  const sortedCountries = [...COUNTRIES].sort(
    (a, b) => b.code.length - a.code.length,
  )

  const parsePhone = (phoneStr: string) => {
    const trimmed = phoneStr.trim()
    const match = sortedCountries.find((c) => trimmed.startsWith(c.code))
    if (match) {
      return {
        countryCode: match.code,
        localPhone: trimmed.slice(match.code.length).trim(),
      }
    }
    return {
      countryCode: '+591', 
      localPhone: trimmed,
    }
  }

  const { countryCode, localPhone } = parsePhone(form.phone)

  const handleCountryCodeChange = (newCode: string) => {
    onChange({
      ...form,
      phone: `${newCode} ${localPhone}`.trim(),
    })
  }

  const handleLocalPhoneChange = (newLocalPhone: string) => {
    onChange({
      ...form,
      phone: `${countryCode} ${newLocalPhone}`.trim(),
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-[2rem] border-border/10 shadow-xl max-w-md bg-card text-foreground">
        <DialogHeader>
          <DialogTitle className="text-xl font-black">
            {editingId ? 'Editar Sucursal' : 'Nueva Sucursal'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Nombre *
            </label>
            <Input
              placeholder="Ej. Sucursal Centro"
              value={form.name}
              onChange={(e) =>
                onChange({ ...form, name: capitalizeWords(e.target.value) })
              }
              onBlur={() =>
                onChange({ ...form, name: capitalizeWords(form.name).trim() })
              }
              required
              className="rounded-2xl border-border/10 focus-visible:ring-primary"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Dirección
            </label>
            <Input
              placeholder="Ej. Av. Siempre Viva 123"
              value={form.address}
              onChange={(e) =>
                onChange({ ...form, address: capitalizeWords(e.target.value) })
              }
              onBlur={() =>
                onChange({
                  ...form,
                  address: capitalizeWords(form.address).trim(),
                })
              }
              className="rounded-2xl border-border/10 focus-visible:ring-primary"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Teléfono
            </label>
            <div className="flex gap-2">
              <CountryCodeSelect
                value={countryCode}
                onValueChange={handleCountryCodeChange}
                className="h-10 rounded-2xl shrink-0"
              />
              <Input
                placeholder="Ej. 70012345"
                value={localPhone}
                onChange={(e) => handleLocalPhoneChange(e.target.value)}
                className="rounded-2xl border-border/10 focus-visible:ring-primary flex-1"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Email
            </label>
            <Input
              type="email"
              placeholder="Ej. centro@gimnasio.com"
              value={form.email}
              onChange={(e) => onChange({ ...form, email: e.target.value })}
              className="rounded-2xl border-border/10 focus-visible:ring-primary"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Apertura
              </label>
              <Input
                type="time"
                value={form.openingTime}
                onChange={(e) =>
                  onChange({ ...form, openingTime: e.target.value })
                }
                className="rounded-2xl border-border/10 focus-visible:ring-primary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Cierre
              </label>
              <Input
                type="time"
                value={form.closingTime}
                onChange={(e) =>
                  onChange({ ...form, closingTime: e.target.value })
                }
                className="rounded-2xl border-border/10 focus-visible:ring-primary"
              />
            </div>
          </div>
          <DialogFooter className="pt-4 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-full"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending || !form.name}
              className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {editingId ? 'Guardar Cambios' : 'Crear Sucursal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
