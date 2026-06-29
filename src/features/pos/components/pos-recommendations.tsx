import { useQuery } from '@tanstack/react-query'
import { ShoppingBag } from 'lucide-react'
import { getRecommendations } from '#/features/analytics/server.ts'
import { formatCurrency } from '#/shared/lib/formatters.ts'

interface POSRecommendationsProps {
  currentProductId: string | null
  onAddToCart: (productId: string) => void
}

export function POSRecommendations({
  currentProductId,
  onAddToCart,
}: POSRecommendationsProps) {
  const { data: recommendations = [] } = useQuery({
    queryKey: ['product-recommendations', currentProductId],
    queryFn: () =>
      getRecommendations({ data: { productId: currentProductId!, limit: 4 } }),
    enabled: !!currentProductId,
  })

  if (recommendations.length === 0) return null

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
        <ShoppingBag className="size-3" />
        Quienes compraron esto tambien compraron
      </p>
      <div className="grid grid-cols-2 gap-2">
        {recommendations.map((rec) => (
          <button
            key={rec.productId}
            type="button"
            onClick={() => onAddToCart(rec.productId)}
            className="text-left p-2.5 rounded-xl border dark:border-white/[0.06] border-black/[0.06] hover:bg-foreground/[0.03] transition-colors"
          >
            <p className="text-xs font-bold truncate">{rec.productName}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {formatCurrency(Number(rec.productPrice))}
            </p>
            <p className="text-[8px] text-muted-foreground/50 mt-1">
              {rec.score}% coincidencia
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}
