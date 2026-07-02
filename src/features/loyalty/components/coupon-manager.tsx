import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Loader2, Tag, ToggleLeft, ToggleRight } from 'lucide-react'
import { getCoupons, createCoupon, toggleCoupon } from '#/features/loyalty/server.ts'
import { Button } from '#/shared/components/ui/button'
import { Input } from '#/shared/components/ui/input'
import { Label } from '#/shared/components/ui/label'
import { Badge } from '#/shared/components/ui/badge'
import { toast } from 'sonner'
import { formatDate } from '#/shared/lib/formatters.ts'

export function CouponManager() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [code, setCode] = useState('')
  const [desc, setDesc] = useState('')
  const [discountPercent, setDiscountPercent] = useState('')
  const [maxUses, setMaxUses] = useState('')

  const { data: couponList, isLoading } = useQuery({
    queryKey: ['coupons'],
    queryFn: () => getCoupons({}),
  })

  const create = useMutation({
    mutationFn: () => createCoupon({
      data: {
        code,
        description: desc || undefined,
        discountPercent: Number(discountPercent),
        maxUses: Number(maxUses || 0),
      },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] })
      setShowForm(false); setCode(''); setDesc(''); setDiscountPercent(''); setMaxUses('')
      toast.success('Cupón creado')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const toggle = useMutation({
    mutationFn: (vars: { id: string; isActive: boolean }) => toggleCoupon({ data: vars }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {couponList?.length ?? 0} cupones registrados
        </p>
        <Button size="xs" variant="outline" className="rounded-xl text-xs gap-1"
          onClick={() => setShowForm(!showForm)}>
          <Plus className="size-3" /> {showForm ? 'Cancelar' : 'Nuevo cupón'}
        </Button>
      </div>

      {showForm && (
        <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-muted/30">
          <div className="space-y-1">
            <Label className="text-[10px]">Código</Label>
            <Input value={code} onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="EJ: BIENVENIDA10" className="rounded-xl text-xs h-8" />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px]">Descripción</Label>
            <Input value={desc} onChange={e => setDesc(e.target.value)}
              placeholder="10% en primera compra" className="rounded-xl text-xs h-8" />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px]">Dto %</Label>
            <Input type="number" min={0} max={100} value={discountPercent}
              onChange={e => setDiscountPercent(e.target.value)}
              placeholder="10" className="rounded-xl text-xs h-8" />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px]">Usos máx (0=∞)</Label>
            <Input type="number" min={0} value={maxUses}
              onChange={e => setMaxUses(e.target.value)}
              placeholder="0" className="rounded-xl text-xs h-8" />
          </div>
          <Button size="xs" className="rounded-xl col-span-2 text-xs" disabled={!code || !discountPercent || create.isPending}
            onClick={() => create.mutate()}>
            {create.isPending ? <Loader2 className="size-3 animate-spin" /> : <Tag className="size-3" />}
            Crear cupón
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center gap-2 py-4 text-xs text-muted-foreground">
          <Loader2 className="size-3 animate-spin" /> Cargando...
        </div>
      ) : couponList?.length === 0 ? (
        <p className="text-xs text-muted-foreground py-4 text-center">Sin cupones todavía</p>
      ) : (
        <div className="space-y-1">
          {couponList?.map(cp => (
            <div key={cp.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-muted/30 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-[11px] font-bold">{cp.code}</code>
                <span className="font-bold">{cp.discountPercent}%</span>
                {cp.description && <span className="text-muted-foreground truncate hidden sm:inline">· {cp.description}</span>}
                {cp.expiresAt && <span className="text-muted-foreground/50">· vence {formatDate(cp.expiresAt)}</span>}
                {cp.maxUses > 0 && (
                  <span className="text-muted-foreground/50">· {cp.usedCount}/{cp.maxUses}</span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={cp.isActive ? 'default' : 'outline'} className="rounded-xl text-[10px] px-2 py-0">
                  {cp.isActive ? 'Activo' : 'Inactivo'}
                </Badge>
                <button onClick={() => toggle.mutate({ id: cp.id, isActive: !cp.isActive })}
                  className="text-muted-foreground hover:text-foreground transition-colors">
                  {cp.isActive ? <ToggleRight className="size-4 text-emerald-500" /> : <ToggleLeft className="size-4" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
