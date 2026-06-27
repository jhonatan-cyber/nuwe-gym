import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronRight, Package, Tags, Plus, Edit, Trash2, Search } from 'lucide-react'
import { toast } from 'sonner'
import {
  getProducts, getCategories, createProduct, updateProduct, adjustStock, createCategory, updateCategory,
} from '#/features/products/server.ts'
import { getInventoryMovements, getStockSnapshots } from '#/features/inventory/server.ts'
import { ModuleLayout } from '#/shared/components/layout/module-layout.tsx'
import { ToggleGroup, ToggleGroupItem } from '#/shared/components/ui/toggle-group'
import { Button } from '#/shared/components/ui/button'
import { LoadingButton } from '#/shared/components/ui/loading-button'
import { Badge } from '#/shared/components/ui/badge'
import { SearchInput } from '#/shared/components/search-input'
import { Skeleton } from '#/shared/components/ui/skeleton'
import { EmptyState } from '#/shared/components/ui/empty-state'
import { LoadingSpinner } from '#/shared/components/ui/loading-spinner'
import { ResultsCount } from '#/shared/components/ui/results-count'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '#/shared/components/ui/tooltip'
import { TrendBadge } from '#/shared/components/ui/trend-badge'
import { formatCurrency } from '#/shared/lib/formatters.ts'
import { Route as authedRoute } from '#/routes/_authed.tsx'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '#/shared/components/ui/dialog'
import { ProductCard } from './components/product-card.tsx'
import { KardexTable } from './components/kardex-table.tsx'
import { StockAdjustDialog } from './components/stock-adjust-dialog.tsx'
import { CategoryDialogs } from './components/category-dialogs.tsx'
import { ProductFormFields } from './components/product-form.tsx'
import type { ProductFormValues } from './components/product-form.tsx'

type ViewMode = 'products' | 'kardex'

const EMPTY_FORM: ProductFormValues = {
  sku: '', barcode: '', name: '', description: '', categoryId: '',
  purchasePrice: '', salePrice: '', stockCurrent: '0', stockMinimum: '0', imageUrl: '',
}

export function InventoryPage() {
  const queryClient = useQueryClient()
  const { userRole } = authedRoute.useRouteContext()
  const isAdmin = userRole === 'ADMIN'

  const [viewMode, setViewMode] = useState<ViewMode>('products')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null | undefined>(undefined)
  const [searchTerm, setSearchTerm] = useState('')
  const [categorySearchTerm, setCategorySearchTerm] = useState('')
  const trendDays = 30

  // Product dialogs
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [showProductForm, setShowProductForm] = useState(false)

  // Product form state
  const [form, setForm] = useState<ProductFormValues>(EMPTY_FORM)

  // Category state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<any | null>(null)
  const [categoryToDelete, setCategoryToDelete] = useState<any | null>(null)

  // Queries
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ['product-categories-active'],
    queryFn: () => getCategories(),
  })

  const { data: productsList = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products', searchTerm, selectedCategoryId],
    queryFn: () => getProducts({ data: { search: searchTerm, categoryId: selectedCategoryId ?? undefined } }),
  })

  const { data: allProducts = [], isLoading: isLoadingAllProducts } = useQuery({
    queryKey: ['products-all-count'],
    queryFn: () => getProducts({ data: {} }),
  })

  const { data: movements = [], isLoading: isLoadingMovements } = useQuery({
    queryKey: ['inventory-movements'],
    queryFn: () => getInventoryMovements(),
  })

  const { data: stockSnapshots = [] } = useQuery({
    queryKey: ['stock-snapshots', trendDays],
    queryFn: () => getStockSnapshots({ data: { daysBack: trendDays } }),
  })

  // Derived data
  const productCountByCategory = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const p of allProducts) counts[p.categoryId] = (counts[p.categoryId] || 0) + 1
    return counts
  }, [allProducts])

  const categoryStats = useMemo(() => {
    const stats: Record<string, { avgSalePrice: number; totalStock: number; outOfStock: number; products: { id: string; name: string; stock: number }[] } | undefined> = {}
    for (const p of allProducts) {
      let catStats = stats[p.categoryId]
      if (!catStats) { catStats = { avgSalePrice: 0, totalStock: 0, outOfStock: 0, products: [] }; stats[p.categoryId] = catStats }
      catStats.avgSalePrice += Number(p.salePrice)
      catStats.totalStock += p.stockCurrent
      catStats.products.push({ id: p.id, name: p.name, stock: p.stockCurrent })
      if (p.stockCurrent <= 0) catStats.outOfStock += 1
    }
    for (const catId of Object.keys(stats)) {
      const cs = stats[catId]
      if (cs) cs.avgSalePrice /= (productCountByCategory[catId] || 1)
    }
    return stats
  }, [allProducts, productCountByCategory])

  const allCategoryStats = useMemo(() => {
    let avg = 0, stock = 0, oos = 0
    const prods: { id: string; name: string; stock: number }[] = []
    for (const p of allProducts) {
      avg += Number(p.salePrice); stock += p.stockCurrent
      prods.push({ id: p.id, name: p.name, stock: p.stockCurrent })
      if (p.stockCurrent <= 0) oos += 1
    }
    if (allProducts.length > 0) avg /= allProducts.length
    return { avgSalePrice: avg, totalStock: stock, outOfStock: oos, products: prods }
  }, [allProducts])

  const categoryTrends = useMemo(() => {
    const t: Record<string, { totalChange: number; totalPrev: number }> = {}
    for (const snap of stockSnapshots) {
      t[snap.categoryId] ??= { totalChange: 0, totalPrev: 0 }
      t[snap.categoryId].totalChange += snap.change
      t[snap.categoryId].totalPrev += snap.previousStock
    }
    return t
  }, [stockSnapshots])

  const allTrend = useMemo(() => {
    let change = 0, prev = 0
    for (const snap of stockSnapshots) { change += snap.change; prev += snap.previousStock }
    return { totalChange: change, totalPrev: prev, totalChangePercent: prev > 0 ? Math.round((change / prev) * 100) : 0 }
  }, [stockSnapshots])

  const productTrendMap = useMemo(() => {
    const map: Partial<Record<string, { change: number; changePercent: number; currentStock: number; previousStock: number }>> = {}
    for (const snap of stockSnapshots) map[snap.productId] = snap
    return map
  }, [stockSnapshots])

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId)

  // Mutations
  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['products'] }); queryClient.invalidateQueries({ queryKey: ['products-all-count'] }); toast.success('Producto creado con éxito'); closeProductModal(); setShowProductForm(false) },
    onError: () => toast.error('Error al crear el producto'),
  })

  const updateMutation = useMutation({
    mutationFn: updateProduct,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['products'] }); queryClient.invalidateQueries({ queryKey: ['products-all-count'] }); toast.success('Producto actualizado con éxito'); closeProductModal() },
    onError: () => toast.error('Error al actualizar el producto'),
  })

  const adjustMutation = useMutation({
    mutationFn: adjustStock,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['products'] }); queryClient.invalidateQueries({ queryKey: ['products-all-count'] }); queryClient.invalidateQueries({ queryKey: ['inventory-movements'] }); toast.success('Stock ajustado con éxito'); setIsAdjustModalOpen(false) },
    onError: () => toast.error('Error al ajustar el stock'),
  })

  const createCategoryMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['product-categories-active'] }); toast.success('Categoría creada con éxito'); closeCategoryModal() },
    onError: () => toast.error('Error al crear la categoría'),
  })

  const updateCategoryMutation = useMutation({
    mutationFn: updateCategory,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['product-categories-active'] }); toast.success('Categoría actualizada con éxito'); closeCategoryModal() },
    onError: () => toast.error('Error al actualizar la categoría'),
  })

  const deleteCategoryMutation = useMutation({
    mutationFn: (cat: any) => updateCategory({ data: { id: cat.id, name: cat.name, isActive: false } }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['product-categories-active'] }); queryClient.invalidateQueries({ queryKey: ['products'] }); toast.success('Categoría eliminada con éxito') },
    onError: () => toast.error('Error al eliminar la categoría'),
  })

  // Handlers
  function openEditModal(prod: any) {
    setSelectedProduct(prod)
    setForm({
      sku: prod.sku, barcode: prod.barcode || '', name: prod.name, description: prod.description || '',
      categoryId: prod.categoryId.toString(), purchasePrice: prod.purchasePrice, salePrice: prod.salePrice,
      stockCurrent: prod.stockCurrent.toString(), stockMinimum: prod.stockMinimum.toString(), imageUrl: prod.imageUrl || '',
    })
    setIsProductModalOpen(true)
  }

  function closeProductModal() { setIsProductModalOpen(false); setSelectedProduct(null) }

  function openCreateProductModal() {
    setSelectedProduct(null); setForm(EMPTY_FORM); setShowProductForm(true)
  }

  function openCreateCategoryModal() { setEditingCategory(null); setIsCategoryModalOpen(true) }

  function closeCategoryModal() { setIsCategoryModalOpen(false); setEditingCategory(null) }

  function openEditCategoryModal(cat: any) { setEditingCategory(cat); setIsCategoryModalOpen(true) }

  function handleCategorySubmit(data: { name: string; description: string }, editingId?: number) {
    if (editingId) {
      updateCategoryMutation.mutate({ data: { id: editingId, name: data.name, description: data.description || undefined } })
    } else {
      createCategoryMutation.mutate({ data: { name: data.name, description: data.description || undefined } })
    }
  }

  function handleProductSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.sku || !form.categoryId || !form.salePrice) return
    const payload = {
      sku: form.sku, barcode: form.barcode, name: form.name, description: form.description,
      categoryId: form.categoryId, purchasePrice: form.purchasePrice, salePrice: form.salePrice,
      stockCurrent: Number(form.stockCurrent), stockMinimum: Number(form.stockMinimum), imageUrl: form.imageUrl,
    }
    if (selectedProduct) {
      updateMutation.mutate({ data: { id: selectedProduct.id, ...payload, isActive: selectedProduct.isActive } })
    } else {
      createMutation.mutate({ data: payload })
    }
  }

  function handleAdjustSubmit(data: { quantity: number; movementType: 'MANUAL_ADJUSTMENT' | 'LOSS' | 'RETURN'; notes: string }) {
    if (!selectedProduct) return
    adjustMutation.mutate({ data: { productId: selectedProduct.id, quantity: data.movementType === 'LOSS' ? -data.quantity : data.quantity, movementType: data.movementType, notes: data.notes } })
  }

  function handleCategoryClick(catId: string | null) { setSelectedCategoryId(catId); setSearchTerm('') }

  function renderCategoryButton(cat: any, isSelected: boolean, count: number, catStats: any, catTrend: any, catProducts: any[], maxStock: number) {
    return (
      <Tooltip key={cat.id} delayDuration={300}>
        <TooltipTrigger asChild>
          <button type="button" onClick={() => handleCategoryClick(cat.id)}
            className={`group flex flex-col items-center justify-center p-3 rounded-2xl text-center border transition-all duration-300 min-h-[104px] hover:-translate-y-0.5 hover:shadow-md active:scale-95 ${isSelected ? 'bg-primary/10 border-primary/30 text-primary shadow-sm' : 'bg-muted/20 border-border/30 hover:bg-muted/40 hover:border-border/60 hover:text-foreground'}`}
          >
            <div className={`size-9 rounded-xl flex items-center justify-center shrink-0 mb-2 transition-all duration-300 ${isSelected ? 'bg-primary text-primary-foreground scale-105 shadow-sm' : 'bg-background/80 border border-border/10 text-muted-foreground group-hover:bg-background group-hover:text-foreground group-hover:scale-105 shadow-inner'}`}>
              <Tags className="size-4" />
            </div>
            <p className="text-xs font-black truncate w-full tracking-wide" title={cat.name}>{cat.name}</p>
            <span className={`mt-1.5 px-2 py-0.5 rounded-full text-[8px] font-bold tracking-wider uppercase transition-colors duration-300 ${isSelected ? 'bg-primary/20 text-primary' : 'bg-muted-foreground/10 text-muted-foreground group-hover:bg-muted-foreground/20'}`}>{count} prod</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="bg-popover text-foreground border-border/10 shadow-lg rounded-xl px-4 py-3 max-w-[240px]">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-black">{cat.name}</p>
            <div className="h-px bg-border/10" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground font-bold">Precio Prom.</span>
              <span className="text-xs font-bold text-primary">{formatCurrency(catStats?.avgSalePrice || 0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground font-bold">Stock Total</span>
              <span className="text-xs font-bold">{catStats?.totalStock || 0} uds.</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground font-bold">Agotados</span>
              <span className={`text-xs font-bold ${(catStats?.outOfStock || 0) > 0 ? 'text-red-500' : 'text-emerald-500'}`}>{catStats?.outOfStock || 0}</span>
            </div>
            {catTrend && catTrend.totalChange !== 0 && (
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground font-bold">Tendencia {trendDays}d</span>
                <TrendBadge value={catTrend.totalChange} percent={catTrend.totalPrev > 0 ? Math.round((catTrend.totalChange / catTrend.totalPrev) * 100) : 0} size="sm" showPercent />
              </div>
            )}
            {catProducts.length > 0 && (
              <>
                <div className="h-px bg-border/10" />
                <div className="flex flex-col gap-1">
                  <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Stock por Producto</p>
                  {catProducts.slice(0, 6).map((p: any, i: number) => {
                    const trend = productTrendMap[p.id]
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-[9px] text-muted-foreground truncate w-[70px] shrink-0" title={p.name}>{p.name}</span>
                        <div className="flex-1 h-2 rounded-full bg-muted/50 overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${p.stock <= 0 ? 'bg-red-400' : p.stock <= 5 ? 'bg-amber-400' : 'bg-primary'}`}
                            style={{ width: `${Math.max((p.stock / maxStock) * 100, p.stock > 0 ? 8 : 3)}%` }} />
                        </div>
                        <span className="text-[9px] font-bold tabular-nums w-6 text-right shrink-0">{p.stock}</span>
                        {trend && trend.change !== 0 && <TrendBadge value={trend.change} size="sm" className="text-[8px] px-1 py-0" />}
                      </div>
                    )
                  })}
                  {catProducts.length > 6 && <p className="text-[9px] text-muted-foreground font-bold">+{catProducts.length - 6} más</p>}
                </div>
              </>
            )}
          </div>
          {isAdmin && <div className="h-px bg-border/10 mt-2 mb-1" />}
          {isAdmin && (
            <div className="flex items-center gap-1 justify-end">
              <span role="button" tabIndex={0} onClick={() => openEditCategoryModal(cat)}
                className="size-7 rounded-lg flex items-center justify-center hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                <Edit className="size-3.5" />
              </span>
              <span role="button" tabIndex={0} onClick={() => setCategoryToDelete(cat)}
                className="size-7 rounded-lg flex items-center justify-center hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors cursor-pointer">
                <Trash2 className="size-3.5" />
              </span>
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <TooltipProvider>
      <ModuleLayout
        breadcrumb={
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Inventario</span>
            <ChevronRight className="size-3 text-muted-foreground/50" />
            <span className="text-foreground">{viewMode === 'products' ? (selectedCategory ? selectedCategory.name : 'Productos') : 'Kardex'}</span>
          </div>
        }
        title="Inventario"
        leftPanel={
          <div className="flex flex-col gap-6 z-10 w-full">
            <ToggleGroup type="single" value={viewMode} onValueChange={(v) => { if (v) { setViewMode(v as ViewMode); setSearchTerm('') } }}>
              <ToggleGroupItem value="products"><Package className="size-3.5" /> Productos</ToggleGroupItem>
              <ToggleGroupItem value="kardex"><Search className="size-3.5" /> Kardex</ToggleGroupItem>
            </ToggleGroup>

            {viewMode === 'products' && (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between px-1 mb-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Categorías</p>
                  {isAdmin && (
                    <Tooltip delayDuration={200}>
                      <TooltipTrigger asChild>
                        <Button type="button" onClick={openCreateCategoryModal} size="icon" className="size-5 rounded-lg bg-foreground text-primary-foreground hover:bg-foreground/90 transition-colors">
                          <Plus className="size-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom"><p>Nueva categoría</p></TooltipContent>
                    </Tooltip>
                  )}
                </div>

                <div className="px-1 mb-1">
                  <SearchInput placeholder="Buscar categoría..." value={categorySearchTerm} onChange={(e) => setCategorySearchTerm(e.target.value)} />
                </div>

                {isLoadingAllProducts || isLoadingCategories ? (
                  <div className="grid grid-cols-2 gap-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex flex-col items-center justify-center p-3 rounded-2xl bg-muted/10 border border-border/10 gap-2 h-[104px] animate-pulse">
                        <Skeleton className="size-8 rounded-xl shrink-0" />
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-4.5 w-12 rounded-full" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-[440px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none">
                    <Tooltip delayDuration={300}>
                      <TooltipTrigger asChild>
                        <button type="button" onClick={() => handleCategoryClick(null)}
                          className={`group flex flex-col items-center justify-center p-3 rounded-2xl text-center border transition-all duration-300 min-h-[104px] hover:-translate-y-0.5 hover:shadow-md active:scale-95 ${selectedCategoryId === null ? 'bg-primary/10 border-primary/30 text-primary shadow-sm' : 'bg-muted/20 border-border/30 hover:bg-muted/40 hover:border-border/60 hover:text-foreground'}`}
                        >
                          <div className={`size-9 rounded-xl flex items-center justify-center shrink-0 mb-2 transition-all duration-300 ${selectedCategoryId === null ? 'bg-primary text-primary-foreground scale-105 shadow-sm' : 'bg-background/80 border border-border/10 text-muted-foreground group-hover:bg-background group-hover:text-foreground group-hover:scale-105 shadow-inner'}`}>
                            <Package className="size-4" />
                          </div>
                          <p className="text-xs font-black truncate w-full tracking-wide">Todos</p>
                          <span className={`mt-1.5 px-2 py-0.5 rounded-full text-[8px] font-bold tracking-wider uppercase transition-colors duration-300 ${selectedCategoryId === null ? 'bg-primary/20 text-primary' : 'bg-muted-foreground/10 text-muted-foreground group-hover:bg-muted-foreground/20'}`}>{allProducts.length} prod</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="bg-popover text-foreground border-border/10 shadow-lg rounded-xl px-4 py-3 max-w-[240px]">
                        <div className="flex flex-col gap-2">
                          <p className="text-xs font-black">Resumen Total</p>
                          <div className="h-px bg-border/10" />
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-muted-foreground font-bold">Precio Prom.</span>
                            <span className="text-xs font-bold text-primary">{formatCurrency(allCategoryStats.avgSalePrice)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-muted-foreground font-bold">Stock Total</span>
                            <span className="text-xs font-bold">{allCategoryStats.totalStock} uds.</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-muted-foreground font-bold">Agotados</span>
                            <span className={`text-xs font-bold ${allCategoryStats.outOfStock > 0 ? 'text-red-500' : 'text-emerald-500'}`}>{allCategoryStats.outOfStock}</span>
                          </div>
                          {allTrend.totalChange !== 0 && (
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-muted-foreground font-bold">Tendencia {trendDays}d</span>
                              <TrendBadge value={allTrend.totalChange} percent={allTrend.totalChangePercent} size="sm" showPercent />
                            </div>
                          )}
                          {allCategoryStats.products.length > 0 && (
                            <>
                              <div className="h-px bg-border/10" />
                              <div className="flex flex-col gap-1">
                                <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Stock por Producto</p>
                                {(() => {
                                  const maxStock = Math.max(...allCategoryStats.products.map((p) => p.stock), 1)
                                  return allCategoryStats.products.slice(0, 6).map((p, i) => {
                                    const trend = productTrendMap[p.id]
                                    return (
                                      <div key={i} className="flex items-center gap-2">
                                        <span className="text-[9px] text-muted-foreground truncate w-[70px] shrink-0" title={p.name}>{p.name}</span>
                                        <div className="flex-1 h-2 rounded-full bg-muted/50 overflow-hidden">
                                          <div className={`h-full rounded-full transition-all ${p.stock <= 0 ? 'bg-red-400' : p.stock <= 5 ? 'bg-amber-400' : 'bg-primary'}`}
                                            style={{ width: `${Math.max((p.stock / maxStock) * 100, p.stock > 0 ? 8 : 3)}%` }} />
                                        </div>
                                        <span className="text-[9px] font-bold tabular-nums w-6 text-right shrink-0">{p.stock}</span>
                                        {trend && trend.change !== 0 && <TrendBadge value={trend.change} size="sm" className="text-[8px] px-1 py-0" />}
                                      </div>
                                    )
                                  })
                                })()}
                                {allCategoryStats.products.length > 6 && <p className="text-[9px] text-muted-foreground font-bold">+{allCategoryStats.products.length - 6} más</p>}
                              </div>
                            </>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>

                    {categories.filter((c) => c.isActive).filter((c) => c.name.toLowerCase().includes(categorySearchTerm.toLowerCase())).map((cat) => {
                      const isSelected = selectedCategoryId === cat.id
                      const count = productCountByCategory[cat.id] || 0
                      const cs = categoryStats[cat.id]
                      const ct = categoryTrends[cat.id]
                      const catProds = cs?.products || []
                      const maxStock = catProds.length > 0 ? Math.max(...catProds.map((p: any) => p.stock), 1) : 1
                      return renderCategoryButton(cat, isSelected, count, cs, ct, catProds, maxStock)
                    })}

                    {categories.filter((c) => c.isActive).filter((c) => c.name.toLowerCase().includes(categorySearchTerm.toLowerCase())).length === 0 && (
                      <p className="col-span-2 text-xs text-muted-foreground text-center py-4">
                        {categorySearchTerm ? 'No se encontraron categorías' : 'No hay categorías activas'}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {viewMode === 'kardex' && (
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1 mb-1">Filtros</p>
                <SearchInput placeholder="Buscar por producto..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
            )}
          </div>
        }
      >
        {viewMode === 'products' && (
          <div className="bg-card rounded-4xl border border-border/10 shadow-xl p-5 flex flex-col gap-4 min-h-[60vh]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                {showProductForm ? (
                  <p className="text-sm font-black tracking-tight">Nuevo Producto</p>
                ) : (
                  <>
                    <ResultsCount count={productsList.length} label="producto" />
                    {selectedCategory && (
                      <Badge variant="outline" className="font-bold text-[10px] border-primary/20 text-primary shrink-0">{selectedCategory.name}</Badge>
                    )}
                  </>
                )}
              </div>
              {!showProductForm && (
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <Button size="sm" className="h-8 rounded-xl text-xs font-bold gap-1 shrink-0" onClick={openCreateProductModal}>
                      <Plus className="size-3.5" /> Producto
                    </Button>
                  )}
                  <div className="w-56 shrink-0">
                    <SearchInput placeholder="Buscar por nombre, SKU..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
                </div>
              )}
            </div>

            {showProductForm ? (
              <form onSubmit={handleProductSubmit} className="flex flex-col gap-4 p-1">
                <ProductFormFields values={form} categories={categories} onChange={setForm} />
                <div className="flex items-center gap-2 pt-2 border-t border-border/10">
                  <Button type="button" variant="outline" onClick={() => setShowProductForm(false)} className="rounded-xl">Cancelar</Button>
                  <LoadingButton type="submit" isLoading={createMutation.isPending} className="rounded-xl font-bold">Crear Producto</LoadingButton>
                </div>
              </form>
            ) : isLoadingProducts ? (
              <LoadingSpinner size="md" label="Cargando productos..." />
            ) : productsList.length === 0 ? (
              <EmptyState icon={Package} title={searchTerm ? 'No se encontraron productos' : selectedCategory ? 'No hay productos en esta categoría' : 'No hay productos registrados'} description={isAdmin && !searchTerm ? 'Creá tu primer producto.' : undefined} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {productsList.map((prod) => (
                  <ProductCard key={prod.id} product={prod} trend={productTrendMap[prod.id]} isAdmin={isAdmin} trendDays={trendDays}
                    onEdit={openEditModal} onAdjust={() => { setSelectedProduct(prod); setIsAdjustModalOpen(true) }} />
                ))}
              </div>
            )}
          </div>
        )}

        {viewMode === 'kardex' && <KardexTable movements={movements} searchTerm={searchTerm} isLoading={isLoadingMovements} />}
      </ModuleLayout>

      {/* Product Dialog */}
      <Dialog open={isProductModalOpen} onOpenChange={(open) => { if (!open) closeProductModal() }}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-black">{selectedProduct ? 'Editar Producto' : 'Nuevo Producto'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleProductSubmit} className="space-y-4">
            <ProductFormFields values={form} categories={categories} onChange={setForm} showStock={!selectedProduct} />
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={closeProductModal} className="rounded-xl">Cancelar</Button>
              <LoadingButton type="submit" isLoading={createMutation.isPending || updateMutation.isPending} className="rounded-xl font-bold">
                {selectedProduct ? 'Guardar Cambios' : 'Crear Producto'}
              </LoadingButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <StockAdjustDialog isOpen={isAdjustModalOpen} onOpenChange={(open) => { setIsAdjustModalOpen(open); if (!open) setSelectedProduct(null) }}
        productName={selectedProduct?.name || ''} isPending={adjustMutation.isPending} onSubmit={handleAdjustSubmit} />

      <CategoryDialogs
        isModalOpen={isCategoryModalOpen}
        editingCategory={editingCategory}
        isPendingCreate={createCategoryMutation.isPending}
        isPendingUpdate={updateCategoryMutation.isPending}
        categoryToDelete={categoryToDelete}
        isPendingDelete={deleteCategoryMutation.isPending}
        onSubmit={handleCategorySubmit}
        onConfirmDelete={(cat) => deleteCategoryMutation.mutate(cat)}
        onClose={closeCategoryModal}
        onCloseDelete={() => setCategoryToDelete(null)}
      />
    </TooltipProvider>
  )
}
