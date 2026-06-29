import { Zap } from 'lucide-react'
import { Button } from '#/shared/components/ui/button'
import { LoadingButton } from '#/shared/components/ui/loading-button'
import { Input } from '#/shared/components/ui/input'
import { Textarea } from '#/shared/components/ui/textarea'
import { Label } from '#/shared/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/shared/components/ui/select'
import type { TrainerWithDetails } from '#/features/trainers/types.ts'

interface TrainerFormProps {
  editingTrainer: TrainerWithDetails | null
  userId: string
  onUserIdChange: (v: string) => void
  specialty: string
  onSpecialtyChange: (v: string) => void
  bio: string
  onBioChange: (v: string) => void
  commissionRate: string
  onCommissionRateChange: (v: string) => void
  selectedUser: any
  trainerUsers: any[]
  isCreating: boolean
  isUpdating: boolean
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
}

export function TrainerForm({
  editingTrainer,
  userId,
  onUserIdChange,
  specialty,
  onSpecialtyChange,
  bio,
  onBioChange,
  commissionRate,
  onCommissionRateChange,
  selectedUser,
  trainerUsers,
  isCreating,
  isUpdating,
  onSubmit,
  onCancel,
}: TrainerFormProps) {
  return (
    <div className="w-full max-w-lg bg-card/60 border border-border/10 rounded-4xl shadow-xl overflow-hidden flex flex-col min-h-[580px]">
      <form onSubmit={onSubmit} className="flex-1 p-6 flex flex-col">
        <div className="flex-1 min-h-0 overflow-y-auto space-y-5">
          {!editingTrainer && (
            <div className="grid gap-2">
              <Label htmlFor="userId">Usuario</Label>
              <Select value={userId} onValueChange={onUserIdChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar usuario" />
                </SelectTrigger>
                <SelectContent>
                  {trainerUsers.map((u: any) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {!editingTrainer && selectedUser && (
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/45 border border-border/10 animate-in fade-in slide-in-from-top-1 duration-300">
              {selectedUser.image ? (
                <img
                  src={selectedUser.image}
                  alt={selectedUser.name}
                  className="size-16 rounded-full object-cover border border-primary/20 shrink-0"
                />
              ) : (
                <div className="size-16 rounded-full bg-linear-to-br from-primary/10 to-primary/5 border border-primary/10 flex items-center justify-center font-black text-sm uppercase shrink-0 text-primary tracking-wider shadow-inner">
                  {selectedUser.name
                    .split(' ')
                    .map((n: string) => n[0])
                    .slice(0, 2)
                    .join('')}
                </div>
              )}
              <div className="space-y-1 min-w-0">
                <p className="font-bold text-sm leading-tight text-foreground truncate">
                  {selectedUser.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {selectedUser.email}
                </p>
                {(selectedUser.phone || selectedUser.documentNumber) && (
                  <p className="text-[10px] text-muted-foreground/80 font-medium">
                    {selectedUser.phone && `Tel: ${selectedUser.phone}`}
                    {selectedUser.phone &&
                      selectedUser.documentNumber &&
                      ' \u2022 '}
                    {selectedUser.documentNumber &&
                      `CI: ${selectedUser.documentNumber}`}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="specialty">Especialidad</Label>
            <Input
              id="specialty"
              value={specialty}
              onChange={(e) => {
                const val = e.target.value
                onSpecialtyChange(
                  val ? val.charAt(0).toUpperCase() + val.slice(1) : '',
                )
              }}
              placeholder="Ej: Musculación, Yoga, Spinning"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="bio">Biografía</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => {
                const val = e.target.value
                onBioChange(
                  val ? val.charAt(0).toUpperCase() + val.slice(1) : '',
                )
              }}
              placeholder="Breve descripción del entrenador"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="commissionRate">Comisión (%)</Label>
            <Input
              id="commissionRate"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={commissionRate}
              onChange={(e) => onCommissionRateChange(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 mt-auto">
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={onCancel}
          >
            Cancelar
          </Button>
          <LoadingButton
            type="submit"
            className="rounded-full font-bold"
            isLoading={isCreating || isUpdating}
          >
            Guardar
          </LoadingButton>
        </div>
      </form>
    </div>
  )
}

export function TrainerFormSidebar() {
  return (
    <>
      <img
        src="/logo-ligth.png"
        alt="Logo Gym"
        className="w-full mx-auto opacity-90 dark:hidden block"
      />
      <img
        src="/logo-dark.png"
        alt="Logo Gym"
        className="w-full mx-auto opacity-90 hidden dark:block"
      />
      <div className="flex items-start gap-3 p-3 rounded-2xl dark:bg-white/2 bg-black/2 border dark:border-white/5 border-black/5">
        <Zap className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Completá los datos para crear un nuevo entrenador o asignarlo
          a un usuario existente.
        </p>
      </div>
    </>
  )
}
