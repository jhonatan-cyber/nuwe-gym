import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Users,
  Plus,
  Loader2,
  UserCheck,
  XCircle,
  CheckCircle2,
  Clock,
} from 'lucide-react'
import {
  getMemberGuestPasses,
  createGuestPass,
  useGuestPass,
  cancelGuestPass,
  getAvailableGuestPassInfo,
} from '#/features/guest-passes/server.ts'
import { formatDate } from '#/shared/lib/formatters.ts'
import { Button } from '#/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '#/shared/components/ui/dialog'
import { Input } from '#/shared/components/ui/input'
import { Label } from '#/shared/components/ui/label'
import { Badge } from '#/shared/components/ui/badge'
import { toast } from 'sonner'
import { cn } from '#/shared/lib/utils.ts'

const STATUS_MAP = {
  ACTIVE: {
    label: 'Activo',
    color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  },
  USED: {
    label: 'Usado',
    color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  },
  EXPIRED: {
    label: 'Expirado',
    color: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  },
  CANCELLED: {
    label: 'Cancelado',
    color: 'bg-red-500/10 text-red-500 border-red-500/20',
  },
}

interface GuestPassSectionProps {
  memberId: string
}

export function GuestPassSection({ memberId }: GuestPassSectionProps) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [guestDocument, setGuestDocument] = useState('')

  const { data: passes = [], isLoading } = useQuery({
    queryKey: ['member-guest-passes', memberId],
    queryFn: () => getMemberGuestPasses({ data: { memberId } }),
    enabled: !!memberId,
  })

  const { data: info } = useQuery({
    queryKey: ['member-guest-pass-info', memberId],
    queryFn: () => getAvailableGuestPassInfo({ data: { memberId } }),
    enabled: !!memberId,
  })

  const createMutation = useMutation({
    mutationFn: createGuestPass,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-guest-passes', memberId] })
      queryClient.invalidateQueries({ queryKey: ['member-guest-pass-info', memberId] })
      setGuestName('')
      setGuestPhone('')
      setGuestDocument('')
      setOpen(false)
      toast.success('Pase de invitado creado')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const useMutation_ = useMutation({
    mutationFn: useGuestPass,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-guest-passes', memberId] })
      queryClient.invalidateQueries({ queryKey: ['member-guest-pass-info', memberId] })
      toast.success('Invitado marcado como ingresado')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const cancelMutation = useMutation({
    mutationFn: cancelGuestPass,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-guest-passes', memberId] })
      toast.success('Pase cancelado')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const activePasses = passes.filter((p) => p.status === 'ACTIVE')

  return (
    <section>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Users className="size-3.5 text-primary" />
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Pases de invitado
          </h4>
        </div>

        {info?.canCreate && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-[9px] h-6 px-2 gap-1 hover:bg-emerald-500/10 hover:text-emerald-600"
              >
                <Plus className="size-2.5" />
                Nuevo pase
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nuevo pase de invitado</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!guestName.trim()) return
                  createMutation.mutate({
                    data: {
                      memberId,
                      guestName: guestName.trim(),
                      guestPhone: guestPhone.trim() || undefined,
                      guestDocument: guestDocument.trim() || undefined,
                    },
                  })
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="guest-name">Nombre del invitado</Label>
                  <Input
                    id="guest-name"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Ej: Juan Pérez"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guest-phone">Teléfono (opcional)</Label>
                  <Input
                    id="guest-phone"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="+54 11 5555-5555"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guest-document">Documento (opcional)</Label>
                  <Input
                    id="guest-document"
                    value={guestDocument}
                    onChange={(e) => setGuestDocument(e.target.value)}
                    placeholder="DNI / Pasaporte"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={createMutation.isPending || !guestName.trim()}
                >
                  {createMutation.isPending ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    'Crear pase'
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="mt-3 space-y-1.5">
        {isLoading ? (
          <div className="flex items-center justify-center py-4 text-muted-foreground">
            <Loader2 className="size-3 animate-spin" />
          </div>
        ) : passes.length === 0 ? (
          <div className="py-4 rounded-xl border dark:border-white/[0.04] border-black/[0.04] bg-muted/30 text-center text-[10px] text-muted-foreground">
            {info?.canCreate
              ? 'Sin pases de invitado. Creá uno nuevo.'
              : 'El socio no tiene membresía activa.'}
          </div>
        ) : (
          passes.slice(0, 10).map((pass) => {
            const cfg = STATUS_MAP[pass.status]
            return (
              <div
                key={pass.id}
                className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border dark:border-white/[0.04] border-black/[0.04] bg-foreground/[0.015]"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold truncate">
                    {pass.guestName}
                  </p>
                  <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
                    {pass.guestPhone && <span>{pass.guestPhone}</span>}
                    <span>Creado {formatDate(pass.createdAt)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge
                    className={cn(
                      'font-bold text-[9px] py-0.5 px-2 rounded-full',
                      cfg.color,
                    )}
                  >
                    {cfg.label}
                  </Badge>

                  {pass.status === 'ACTIVE' && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          useMutation_.mutate({ data: { passId: pass.id } })
                        }
                        disabled={useMutation_.isPending}
                        className="size-5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 flex items-center justify-center transition-colors"
                        title="Marcar como usado"
                      >
                        <UserCheck className="size-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          cancelMutation.mutate({ data: { passId: pass.id } })
                        }
                        disabled={cancelMutation.isPending}
                        className="size-5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-500 flex items-center justify-center transition-colors"
                        title="Cancelar"
                      >
                        <XCircle className="size-3" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })
        )}

        {passes.length > 10 && (
          <p className="text-[9px] text-center text-muted-foreground">
            +{passes.length - 10} más
          </p>
        )}
      </div>
    </section>
  )
}
