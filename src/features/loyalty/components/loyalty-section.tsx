import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Gift, Plus, Loader2, ShoppingCart, TrendingUp, Award,
  Users, Copy, CheckCircle2, Target, BadgeCheck, Sparkles,
} from 'lucide-react'
import {
  getLoyaltyInfo,
  redeemPoints,
  generateReferralCodeFn,
} from '#/features/loyalty/server.ts'
import { formatDate } from '#/shared/lib/formatters.ts'
import { Button } from '#/shared/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '#/shared/components/ui/dialog'
import { Input } from '#/shared/components/ui/input'
import { Label } from '#/shared/components/ui/label'
import { Badge } from '#/shared/components/ui/badge'
import { toast } from 'sonner'
import { cn } from '#/shared/lib/utils.ts'

const SOURCE_LABELS: Record<string, { label: string; icon: string }> = {
  CHECK_IN: { label: 'Check-in', icon: '📅' },
  PURCHASE: { label: 'Compra', icon: '🛒' },
  REFERRAL: { label: 'Referido', icon: '👤' },
  REDEEM: { label: 'Canje', icon: '🎁' },
  BONUS: { label: 'Bono', icon: '⭐' },
  CHALLENGE: { label: 'Reto', icon: '🎯' },
  BADGE: { label: 'Logro', icon: '🏆' },
}

export function LoyaltySection({ memberId }: { memberId: string }) {
  const queryClient = useQueryClient()
  const [redeemOpen, setRedeemOpen] = useState(false)
  const [ptsInput, setPtsInput] = useState('')
  const [descInput, setDescInput] = useState('')
  const [copied, setCopied] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['loyalty-info', memberId],
    queryFn: () => getLoyaltyInfo({ data: { memberId } }),
  })

  const genRef = useMutation({
    mutationFn: () => generateReferralCodeFn({ data: { memberId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-info', memberId] })
      toast.success('Código de referido generado')
    },
  })

  const redeem = useMutation({
    mutationFn: () => redeemPoints({ data: { memberId, points: Number(ptsInput), description: descInput } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-info', memberId] })
      setRedeemOpen(false); setPtsInput(''); setDescInput('')
      toast.success('Puntos canjeados con éxito')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Código copiado')
  }

  const challengeBar = (current: number, target: number) =>
    Math.min((current / target) * 100, 100)

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold">
          <Gift className="size-3.5 text-primary" />
          Fidelización
        </div>
        {data && data.balance > 0 && (
          <Dialog open={redeemOpen} onOpenChange={setRedeemOpen}>
            <DialogTrigger asChild>
              <Button size="xs" variant="outline" className="rounded-xl text-xs gap-1">
                <ShoppingCart className="size-3" /> Canjear
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader><DialogTitle className="text-base">Canjear puntos</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">Tenés <strong>{data.balance}</strong> pts disponibles</p>
                <div className="space-y-1">
                  <Label className="text-xs">Puntos a canjear</Label>
                  <Input type="number" min={1} max={data.balance} placeholder="Ej: 50"
                    value={ptsInput} onChange={e => setPtsInput(e.target.value)} className="rounded-xl" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Descripción</Label>
                  <Input placeholder="Ej: Descuento en mensualidad"
                    value={descInput} onChange={e => setDescInput(e.target.value)} className="rounded-xl" />
                </div>
                <Button size="sm" className="w-full rounded-xl" disabled={!ptsInput || !descInput || redeem.isPending}
                  onClick={() => redeem.mutate()}>
                  {redeem.isPending ? <Loader2 className="size-3 animate-spin" /> : null}
                  Canjear {ptsInput || '0'} puntos
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 py-4 text-xs text-muted-foreground">
          <Loader2 className="size-3 animate-spin" /> Cargando...
        </div>
      ) : data ? (
        <div className="space-y-3">
          {/* Puntos + Nivel */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/5 text-sm font-bold">
              <TrendingUp className="size-4 text-primary" />
              {data.balance} pts
            </div>
            <Badge className="rounded-xl text-xs px-2.5 py-1"
              style={{ backgroundColor: data.tier.color + '20', color: data.tier.color, borderColor: data.tier.color + '40' }}>
              <Award className="size-3 mr-1" />
              {data.tier.name}
              {data.tier.discountPercent > 0 ? ` · ${data.tier.discountPercent}% dto` : ''}
            </Badge>
          </div>

          {/* Referidos */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Users className="size-3" /> Código de referido
            </div>
            {data.referralCode ? (
              <div className="flex items-center gap-2">
                <code className="px-2.5 py-1 rounded-lg bg-muted text-xs font-mono font-bold tracking-wider">
                  {data.referralCode}
                </code>
                <button onClick={() => copyCode(data.referralCode!)}
                  className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                  {copied ? <CheckCircle2 className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                </button>
                <span className="text-[10px] text-muted-foreground">Compartí este código al registrar nuevos socios</span>
              </div>
            ) : (
              <Button size="xs" variant="outline" className="rounded-xl text-xs"
                onClick={() => genRef.mutate()} disabled={genRef.isPending}>
                {genRef.isPending ? <Loader2 className="size-3 animate-spin" /> : <Plus className="size-3" />}
                Generar código
              </Button>
            )}
          </div>

          {/* Retos activos */}
          {data.challenges.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <Target className="size-3" /> Retos activos
              </div>
              {data.challenges.map(ch => {
                const prog = ch.progress?.progress ?? 0
                const done = ch.progress?.completed ?? false
                return (
                  <div key={ch.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className={cn(done && 'text-emerald-500 font-medium')}>
                        {done ? '✅' : '🎯'} {ch.name}
                      </span>
                      <span className="text-muted-foreground tabular-nums">{prog}/{ch.target}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className={cn(
                        'h-full rounded-full transition-all',
                        done ? 'bg-emerald-500' : 'bg-primary',
                      )} style={{ width: `${challengeBar(prog, ch.target)}%` }} />
                    </div>
                    {ch.description && (
                      <p className="text-[10px] text-muted-foreground">{ch.description}</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Badges */}
          {data.badges.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <BadgeCheck className="size-3" /> Logros obtenidos
              </div>
              <div className="flex flex-wrap gap-1.5">
                {data.badges.map(b => (
                  <Badge key={b.id} variant="outline" className="rounded-xl text-xs gap-1 px-2.5 py-1">
                    {b.icon} {b.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Historial */}
          {data.history.length > 0 ? (
            <div className="space-y-1">
              {data.history.slice(0, 15).map((entry) => {
                const src = SOURCE_LABELS[entry.source] ?? { label: entry.source, icon: '•' }
                return (
                  <div key={entry.id} className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-muted/30 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs shrink-0">{src.icon}</span>
                      <span className="text-muted-foreground truncate">{src.label}</span>
                      {entry.description ? <span className="text-muted-foreground/50 truncate hidden sm:inline">· {entry.description}</span> : null}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`font-bold tabular-nums ${entry.points > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {entry.points > 0 ? '+' : ''}{entry.points}
                      </span>
                      <span className="text-muted-foreground/50">{formatDate(entry.createdAt)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground py-1">
              Sin actividad aún. Ganá puntos con check-ins y compras.
            </p>
          )}
        </div>
      ) : null}
    </section>
  )
}
