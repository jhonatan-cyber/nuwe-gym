import { ShoppingBag } from 'lucide-react'

interface TopProduct {
  id: string
  name: string
  sku: string
  quantitySold: number
}

interface TopProductsProps {
  topProducts: TopProduct[]
}

export function TopProducts({ topProducts }: TopProductsProps) {
  return (
    <div className="bg-card p-5 rounded-4xl border border-border/10 shadow-xl flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-black dark:text-white text-foreground">
            Productos + Vendidos
          </h3>
          <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-widest">
            Top 5 de este mes
          </p>
        </div>
        <div className="size-8 rounded-xl dark:bg-white/5 bg-black/5 flex items-center justify-center">
          <ShoppingBag className="size-4 text-muted-foreground" />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {topProducts.map((prod, index) => (
          <div
            key={prod.id || index}
            className="flex items-center gap-3 p-2.5 rounded-xl bg-muted border border-border/10 dark:hover:bg-white/5 hover:bg-black/5 transition-colors group"
          >
            {/* Rank */}
            <span className="text-[10px] font-black text-muted-foreground w-4 text-center shrink-0">
              {index + 1}
            </span>
            <div className="size-9 rounded-lg dark:bg-white/5 bg-black/5 flex items-center justify-center overflow-hidden border dark:border-white/10 border-black/10 shrink-0">
              <img
                src="/images/gym_product.png"
                alt={prod.name}
                className="size-6 object-contain"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-xs dark:text-white text-foreground truncate">
                {prod.name}
              </h4>
              <p className="text-[9px] text-muted-foreground mt-0.5 truncate">
                {prod.sku}
              </p>
            </div>
            <div className="text-right shrink-0">
              <div className="text-sm font-black dark:text-white text-foreground">
                {prod.quantitySold}
              </div>
              <p className="text-[9px] text-muted-foreground">ventas</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
