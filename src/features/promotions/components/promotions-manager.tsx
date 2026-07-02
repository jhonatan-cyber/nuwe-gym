import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Loader2, Megaphone, ToggleLeft, ToggleRight } from 'lucide-react'
import { getPromotions, createPromotion, togglePromotion } from '#/features/promotions/server.ts'
import { Button } from '#/shared/components/ui/button'
import { Input } from '#/shared/components/ui/input'
import { Label } from '#/shared/components/ui/label'
import { Badge } from '#/shared/components/ui/badge'

import { toast } from 'sonner'
import { formatDate } from '#/shared/lib/formatters.ts'

export function PromotionsManager() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [discountPercent, setDiscountPercent] = useState('')
  const [autoApply, setAutoApply] = useState(false)
  const [condMinPurchases, setCondMinPurchases] = useState('')
  const [condMaxPurchases, setCondMaxPurchases] = useState('')

  const { data: promoList, isLoading } = useQuery({
    queryKey: ['promotions'],
    queryFn: () => getPromotions({}),
  })

  const create = useMutation({
    mutationFn: () => createPromotion({
      data: {
        name,
        description: desc || undefined,
        type: 'DISCOUNT',
        discountPercent: Number(discountPercent),
        conditions: {
          ...(condMinPurchases ? { minPurchases: Number(condMinPurchases) } : {}),
          ...(condMaxPurchases ? { maxPurchases: Number(condMaxPurchases) } : {}),
        },
        autoApply,
      },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] })
      setShowForm(false); setName(''); setDesc(''); setDiscountPercent('')
      setCondMinPurchases(''); setCondMaxPurchases(''); setAutoApply(false)
      toast.success('Promoción creada')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const toggle = useMutation({
    mutationFn: (vars: { id: string; isActive: boolean }) => togglePromotion({ data: vars }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['promotions'] }),
    onError: (e: Error) => toast.error(e.message),
  })

  const isExpired = (endDate: string | Date | null) =>
    endDate ? new Date(endDate) < new Date() : false

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {promoList?.length ?? 0} promociones
        </p>
        <Button size="xs" variant="outline" className="rounded-xl text-xs gap-1"
          onClick={() => setShowForm(!showForm)}>
          <Plus className="size-3" /> {showForm ? 'Cancelar' : 'Nueva promo'}
        </Button>
      </div>

      {showForm && (
        <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-muted/30">
          <div className="space-y-1">
            <Label className="text-[10px]">Nombre *</Label>
            <Input value={name} onChange={e => setName(e.target.value)}
              placeholder="Bienvenida" className="rounded-xl text-xs h-8" />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px]">Dto % *</Label>
            <Input type="number" min={0} max={100} value={discountPercent}
              onChange={e => setDiscountPercent(e.target.value)}
              placeholder="10" className="rounded-xl text-xs h-8" />
          </div>
          <div className="space-y-1 col-span-2">
            <Label className="text-[10px]">Descripción</Label>
            <Input value={desc} onChange={e => setDesc(e.target.value)}
              placeholder="10% de descuento en primera compra" className="rounded-xl text-xs h-8" />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px]">Mín compras</Label>
            <Input type="number" min={0} value={condMinPurchases}
              onChange={e => setCondMinPurchases(e.target.value)}
              placeholder="0" className="rounded-xl text-xs h-8" />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px]">Máx compras</Label>
            <Input type="number" min={0} value={condMaxPurchases}
              onChange={e => setCondMaxPurchases(e.target.value)}
              placeholder="0=∞" className="rounded-xl text-xs h-8" />
          </div>
          <div className="flex items-center gap-2 col-span-2">
            <input type="checkbox" id="auto" checked={autoApply}
              onChange={e => setAutoApply(e.target.checked)}
              className="size-3.5 rounded border-border/10 accent-primary" />
            <Label htmlFor="auto" className="text-xs">Auto-aplicar en ventas</Label>
          </div>
          <Button size="xs" className="rounded-xl col-span-2 text-xs"
            disabled={!name || !discountPercent || create.isPending}
            onClick={() => create.mutate()}>
            {create.isPending ? <Loader2 className="size-3 animate-spin" /> : <Megaphone className="size-3" />}
            Crear promoción
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center gap-2 py-4 text-xs text-muted-foreground">
          <Loader2 className="size-3 animate-spin" /> Cargando...
        </div>
      ) : promoList?.length === 0 ? (
        <p className="text-xs text-muted-foreground py-4 text-center">Sin promociones todavía</p>
      ) : (
        <div className="space-y-1">
          {promoList?.map(p => {
            const expired = isExpired(p.endDate)
            const conds = (p.conditions ?? {}) as Record<string, unknown>
            return (
              <div key={p.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-muted/30 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-bold">{p.name}</span>
                  <span className="text-primary font-bold">{p.discountPercent}%</span>
                  {p.description && <span className="text-muted-foreground truncate hidden sm:inline">· {p.description}</span>}
                  {conds.minPurchases !== undefined && <span className="text-muted-foreground/50">· desde compra #{Number(conds.minPurchases) + 1}</span>}
                  {p.endDate && <span className="text-muted-foreground/50">· hasta {formatDate(p.endDate)}</span>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {p.autoApply && <Badge variant="outline" className="rounded-xl text-[10px] px-2 py-0 text-primary">Auto</Badge>}
                  <Badge variant={p.isActive && !expired ? 'default' : 'outline'}
                    className={`rounded-xl text-[10px] px-2 py-0 ${expired ? 'text-muted-foreground' : ''}`}>
                    {expired ? 'Expirada' : p.isActive ? 'Activa' : 'Inactiva'}
                  </Badge>
                  <button onClick={() => toggle.mutate({ id: p.id, isActive: !p.isActive })}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    disabled={expired}>
                    {p.isActive && !expired
                      ? <ToggleRight className="size-4 text-emerald-500" />
                      : <ToggleLeft className="size-4" />}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
