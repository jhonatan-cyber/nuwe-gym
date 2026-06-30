import { useQuery } from '@tanstack/react-query'
import { ShoppingBag, Sparkles } from 'lucide-react'
import { getRecommendations, getAIRecommendations } from '#/features/analytics/server.ts'
import { formatCurrency } from '#/shared/lib/formatters.ts'

interface POSRecommendationsProps {
  currentProductId: string | null
  memberId?: string | null
  onAddToCart: (productId: string) => void
}

export function POSRecommendations({
  currentProductId,
  memberId,
  onAddToCart,
}: POSRecommendationsProps) {
  const isAI = !!memberId

  const { data: recommendations = [], isLoading } = useQuery({
    queryKey: ['product-recommendations', currentProductId, memberId],
    queryFn: async () => {
      if (memberId) {
        try {
          return await getAIRecommendations({ data: { memberId, limit: 3 } })
        } catch (err) {
          console.error(err)
        }
      }
      return getRecommendations({ data: { productId: currentProductId!, limit: 4 } })
    },
    enabled: !!currentProductId || !!memberId,
  })

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground animate-pulse py-2">
        <Sparkles className="size-3 text-violet-500 animate-spin" />
        <span>Calculando sugerencias de la IA...</span>
      </div>
    )
  }

  if (recommendations.length === 0) return null

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
        {isAI ? (
          <>
            <Sparkles className="size-3 text-violet-500 animate-pulse" />
            Sugerencia Inteligente de la IA
          </>
        ) : (
          <>
            <ShoppingBag className="size-3" />
            Quienes compraron esto tambien compraron
          </>
        )}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {recommendations.map((rec: any) => (
          <button
            key={rec.productId}
            type="button"
            onClick={() => onAddToCart(rec.productId)}
            className={`text-left p-2.5 rounded-xl border transition-all hover:scale-[1.01] active:scale-95 ${
              isAI
                ? 'border-violet-100 dark:border-violet-950/40 bg-violet-50/5 hover:bg-violet-50/20'
                : 'dark:border-white/[0.06] border-black/[0.06] hover:bg-foreground/[0.03]'
            }`}
          >
            <p className="text-xs font-bold truncate text-zinc-950 dark:text-white">{rec.productName}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {formatCurrency(Number(rec.productPrice))}
            </p>
            <p className="text-[9px] text-violet-600 dark:text-violet-400 mt-1.5 font-medium leading-relaxed">
              {rec.reason}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}
