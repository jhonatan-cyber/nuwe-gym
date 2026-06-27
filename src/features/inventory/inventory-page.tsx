import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ChevronRight,
  Package,
  Tags,
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  ArrowUpDown,
  ArrowUpRight,
  ArrowDownLeft,
  BarChart3,
  Box,
  ShoppingCart,
  Wrench,
  Minus,
  RotateCcw,
  TrendingDown,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  getProducts,
  getCategories,
  createProduct,
  updateProduct,
  adjustStock,
  createCategory,
  updateCategory,
} from '#/features/products/server.ts'
import { getInventoryMovements, getStockSnapshots } from '#/features/inventory/server.ts'
import { ModuleLayout } from '#/shared/components/layout/module-layout.tsx'
import { ToggleGroup, ToggleGroupItem } from '#/shared/components/ui/toggle-group'
import { Button } from '#/shared/components/ui/button'
import { LoadingButton } from '#/shared/components/ui/loading-button'
import { Input } from '#/shared/components/ui/input'
import { Textarea } from '#/shared/components/ui/textarea'
import { Badge } from '#/shared/components/ui/badge'
import { SearchInput } from '#/shared/components/search-input'
import { Skeleton } from '#/shared/components/ui/skeleton'
import { EmptyState } from '#/shared/components/ui/empty-state'
import { LoadingSpinner } from '#/shared/components/ui/loading-spinner'
import { ResultsCount } from '#/shared/components/ui/results-count'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '#/shared/components/ui/tooltip'
import { TrendBadge } from '#/shared/components/ui/trend-badge'
import { formatCurrency, formatDateTime } from '#/shared/lib/formatters.ts'
import { Route as authedRoute } from '#/routes/_authed.tsx'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '#/shared/components/ui/dialog'
import { ConfirmDialog } from '#/shared/components/ui/confirm-dialog'

type ViewMode = 'products' | 'kardex'

export function InventoryPage() {
  const queryClient = useQueryClient()
  const { userRole } = authedRoute.useRouteContext()
  const isAdmin = userRole === 'ADMIN'

  // ── State ──────────────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<ViewMode>('products')
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null | undefined>(undefined)
  const [searchTerm, setSearchTerm] = useState('')
  const trendDays = 30
  const [categorySearchTerm, setCategorySearchTerm] = useState('')

  // Product dialogs
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [showProductForm, setShowProductForm] = useState(false)

  // Product form state
  const [sku, setSku] = useState('')
  const [barcode, setBarcode] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [salePrice, setSalePrice] = useState('')
  const [stockCurrent, setStockCurrent] = useState('0')
  const [stockMinimum, setStockMinimum] = useState('0')
  const [imageUrl, setImageUrl] = useState('')

  // Adjust stock state
  const [adjustQty, setAdjustQty] = useState('1')
  const [adjustType, setAdjustType] = useState<'MANUAL_ADJUSTMENT' | 'LOSS' | 'RETURN'>('MANUAL_ADJUSTMENT')
  const [adjustNotes, setAdjustNotes] = useState('')

  // Category form state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<any | null>(null)
  const [categoryName, setCategoryName] = useState('')
  const [categoryDescription, setCategoryDescription] = useState('')
  const [categoryToDelete, setCategoryToDelete] = useState<any | null>(null)

  // ── Queries ────────────────────────────────────────────────────────────
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ['product-categories-active'],
    queryFn: () => getCategories(),
  })

  const { data: productsList = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products', searchTerm, selectedCategoryId],
    queryFn: () =>
      getProducts({
        data: {
          search: searchTerm,
          categoryId: selectedCategoryId ?? undefined,
        },
      }),
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

  // ── Product count per category ──────────────────────────────────────────
  const productCountByCategory = useMemo(() => {
    const counts: Record<number, number> = {}
    for (const p of allProducts) {
      counts[p.categoryId] = (counts[p.categoryId] || 0) + 1
    }
    return counts
  }, [allProducts])


  const categoryStats = useMemo(() => {
    const stats: Record<number, { avgSalePrice: number; totalStock: number; outOfStock: number; products: { id: number; name: string; stock: number }[] } | undefined> = {}
    for (const p of allProducts) {
      let catStats = stats[p.categoryId]
      if (!catStats) {
        catStats = { avgSalePrice: 0, totalStock: 0, outOfStock: 0, products: [] }
        stats[p.categoryId] = catStats
      }
      catStats.avgSalePrice += Number(p.salePrice)
      catStats.totalStock += p.stockCurrent
      catStats.products.push({ id: p.id, name: p.name, stock: p.stockCurrent })
      if (p.stockCurrent <= 0) catStats.outOfStock += 1
    }
    for (const catId of Object.keys(stats)) {
      const catStats = stats[Number(catId)]
      if (catStats) {
        const count = productCountByCategory[Number(catId)] || 1
        catStats.avgSalePrice = catStats.avgSalePrice / count
      }
    }
    return stats
  }, [allProducts, productCountByCategory])

  const allCategoryStats = useMemo(() => {
    let avgSalePrice = 0
    let totalStock = 0
    let outOfStock = 0
    const products: { id: number; name: string; stock: number }[] = []
    for (const p of allProducts) {
      avgSalePrice += Number(p.salePrice)
      totalStock += p.stockCurrent
      products.push({ id: p.id, name: p.name, stock: p.stockCurrent })
      if (p.stockCurrent <= 0) outOfStock += 1
    }
    if (allProducts.length > 0) avgSalePrice /= allProducts.length
    return { avgSalePrice, totalStock, outOfStock, products }
  }, [allProducts])

  const categoryTrends = useMemo(() => {
    const trends: Record<number, { totalChange: number; totalPrev: number; productTrends: { name: string; change: number; changePercent: number; current: number; previous: number }[] } | undefined> = {}
    for (const snap of stockSnapshots) {
      let catTrend = trends[snap.categoryId]
      if (!catTrend) {
        catTrend = { totalChange: 0, totalPrev: 0, productTrends: [] }
        trends[snap.categoryId] = catTrend
      }
      catTrend.totalChange += snap.change
      catTrend.totalPrev += snap.previousStock
      catTrend.productTrends.push({
        name: snap.productName,
        change: snap.change,
        changePercent: snap.changePercent,
        current: snap.currentStock,
        previous: snap.previousStock,
      })
    }
    return trends
  }, [stockSnapshots])

  const allTrend = useMemo(() => {
    let totalChange = 0
    let totalPrev = 0
    for (const snap of stockSnapshots) {
      totalChange += snap.change
      totalPrev += snap.previousStock
    }
    const totalChangePercent = totalPrev > 0 ? Math.round((totalChange / totalPrev) * 100) : 0
    return { totalChange, totalPrev, totalChangePercent }
  }, [stockSnapshots])

  const productTrendMap = useMemo(() => {
    const map: Record<number, { change: number; changePercent: number; currentStock: number; previousStock: number } | undefined> = {}
    for (const snap of stockSnapshots) {
      map[snap.productId] = { change: snap.change, changePercent: snap.changePercent, currentStock: snap.currentStock, previousStock: snap.previousStock }
    }
    return map
  }, [stockSnapshots])

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId)

  // ── Mutations ──────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['products-all-count'] })
      toast.success('Producto creado con éxito')
      closeProductModal()
      setShowProductForm(false)
    },
    onError: () => toast.error('Error al crear el producto'),
  })

  const updateMutation = useMutation({
    mutationFn: updateProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['products-all-count'] })
      toast.success('Producto actualizado con éxito')
      closeProductModal()
    },
    onError: () => toast.error('Error al actualizar el producto'),
  })

  const adjustMutation = useMutation({
    mutationFn: adjustStock,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['products-all-count'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-movements'] })
      toast.success('Stock ajustado con éxito')
      closeAdjustModal()
    },
    onError: () => toast.error('Error al ajustar el stock'),
  })

  const createCategoryMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-categories-active'] })
      toast.success('Categoría creada con éxito')
      closeCategoryModal()
    },
    onError: () => toast.error('Error al crear la categoría'),
  })

  const updateCategoryMutation = useMutation({
    mutationFn: updateCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-categories-active'] })
      toast.success('Categoría actualizada con éxito')
      closeCategoryModal()
    },
    onError: () => toast.error('Error al actualizar la categoría'),
  })

  const deleteCategoryMutation = useMutation({
    mutationFn: (cat: any) => updateCategory({ data: { id: cat.id, name: cat.name, isActive: false } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-categories-active'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Categoría eliminada con éxito')
    },
    onError: () => toast.error('Error al eliminar la categoría'),
  })

  // ── Handlers ───────────────────────────────────────────────────────────

  function openEditModal(prod: any) {
    setSelectedProduct(prod)
    setSku(prod.sku)
    setBarcode(prod.barcode || '')
    setName(prod.name)
    setDescription(prod.description || '')
    setCategoryId(prod.categoryId.toString())
    setPurchasePrice(prod.purchasePrice)
    setSalePrice(prod.salePrice)
    setStockCurrent(prod.stockCurrent.toString())
    setStockMinimum(prod.stockMinimum.toString())
    setImageUrl(prod.imageUrl || '')
    setIsProductModalOpen(true)
  }

  function closeProductModal() {
    setIsProductModalOpen(false)
    setSelectedProduct(null)
  }

  function openCreateProductModal() {
    setSelectedProduct(null)
    setSku('')
    setBarcode('')
    setName('')
    setDescription('')
    setCategoryId('')
    setPurchasePrice('')
    setSalePrice('')
    setStockCurrent('0')
    setStockMinimum('0')
    setImageUrl('')
    setShowProductForm(true)
  }

  function openAdjustModal(prod: any) {
    setSelectedProduct(prod)
    setAdjustQty('1')
    setAdjustType('MANUAL_ADJUSTMENT')
    setAdjustNotes('')
    setIsAdjustModalOpen(true)
  }

  function closeAdjustModal() {
    setIsAdjustModalOpen(false)
    setSelectedProduct(null)
  }

  function openCreateCategoryModal() {
    setCategoryName('')
    setCategoryDescription('')
    setIsCategoryModalOpen(true)
  }

  function closeCategoryModal() {
    setIsCategoryModalOpen(false)
    setEditingCategory(null)
  }

  function openEditCategoryModal(cat: any) {
    setEditingCategory(cat)
    setCategoryName(cat.name)
    setCategoryDescription(cat.description || '')
    setIsCategoryModalOpen(true)
  }

  function handleCategorySubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!categoryName) return
    if (editingCategory) {
      updateCategoryMutation.mutate({
        data: {
          id: editingCategory.id,
          name: categoryName,
          description: categoryDescription || undefined,
        },
      })
    } else {
      createCategoryMutation.mutate({
        data: {
          name: categoryName,
          description: categoryDescription || undefined,
        },
      })
    }
  }

  function handleDeleteCategory(cat: any) {
    setCategoryToDelete(cat)
  }

  function handleProductSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !sku || !categoryId || !salePrice) return

    const productPayload = {
      sku,
      barcode,
      name,
      description,
      categoryId: Number(categoryId),
      purchasePrice,
      salePrice,
      stockCurrent: Number(stockCurrent),
      stockMinimum: Number(stockMinimum),
      imageUrl,
    }

    if (selectedProduct) {
      updateMutation.mutate({
        data: {
          id: selectedProduct.id,
          ...productPayload,
          isActive: selectedProduct.isActive,
        },
      })
    } else {
      createMutation.mutate({ data: productPayload })
    }
  }

  function handleAdjustSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedProduct || !adjustQty) return

    const quantity = Number(adjustQty)
    adjustMutation.mutate({
      data: {
        productId: selectedProduct.id,
        quantity: adjustType === 'LOSS' ? -quantity : quantity,
        movementType: adjustType,
        notes: adjustNotes,
      },
    })
  }

  function handleCategoryClick(catId: number | null) {
    setSelectedCategoryId(catId)
    setSearchTerm('')
  }

  // ── Movement badge ─────────────────────────────────────────────────────
  function getMovementBadge(type: string) {
    switch (type) {
      case 'PURCHASE':
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-bold">COMPRA</Badge>
      case 'SALE':
        return <Badge className="bg-blue-500/10 text-blue-600 border-none font-bold">VENTA</Badge>
      case 'MANUAL_ADJUSTMENT':
        return <Badge variant="outline" className="text-muted-foreground font-bold">AJUSTE</Badge>
      case 'LOSS':
        return <Badge className="bg-red-500/10 text-red-600 border-none font-bold">PÉRDIDA</Badge>
      case 'RETURN':
        return <Badge className="bg-teal-500/10 text-teal-600 border-none font-bold">DEVOLUCIÓN</Badge>
      default:
        return <Badge variant="secondary">{type}</Badge>
    }
  }

  function getMovementIcon(type: string) {
    switch (type) {
      case 'PURCHASE':
        return <ShoppingCart className="size-3.5 text-emerald-500" />
      case 'SALE':
        return <Package className="size-3.5 text-blue-500" />
      case 'MANUAL_ADJUSTMENT':
        return <Wrench className="size-3.5 text-muted-foreground" />
      case 'LOSS':
        return <TrendingDown className="size-3.5 text-red-500" />
      case 'RETURN':
        return <RotateCcw className="size-3.5 text-teal-500" />
      default:
        return <ArrowUpDown className="size-3.5" />
    }
  }

  // ── Filtered movements ─────────────────────────────────────────────────
  const filteredMovements = movements.filter((move: any) => {
    const prodName = move.product.name.toLowerCase()
    return prodName.includes(searchTerm.toLowerCase())
  })

  // ── Stock status helper ────────────────────────────────────────────────
  function getStockBadge(product: any) {
    if (product.stockCurrent <= 0) {
      return (
        <Badge className="bg-red-500/10 text-red-600 border-none font-bold gap-0.5">
          <Minus className="size-2.5" /> Agotado
        </Badge>
      )
    }
    if (product.stockCurrent <= product.stockMinimum) {
      return (
        <Badge className="bg-amber-500/10 text-amber-600 border-none font-bold gap-0.5">
          <AlertTriangle className="size-2.5" /> Bajo ({product.stockCurrent})
        </Badge>
      )
    }
    return (
      <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-bold gap-0.5">
        <Box className="size-2.5" /> {product.stockCurrent}
      </Badge>
    )
  }

  // ════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════

  return (
    <TooltipProvider>
    <ModuleLayout
      breadcrumb={
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">Inventario</span>
          <ChevronRight className="size-3 text-muted-foreground/50" />
          <span className="text-foreground">
            {viewMode === 'products' ? (selectedCategory ? selectedCategory.name : 'Productos') : 'Kardex'}
          </span>
        </div>
      }
      title="Inventario"
      leftPanel={
        <div className="flex flex-col gap-6 z-10 w-full">
          {/* ── View Toggle ──────────────────────────────────── */}
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(v) => {
              if (v) {
                setViewMode(v as ViewMode)
                setSearchTerm('')
              }
            }}
          >
            <ToggleGroupItem value="products">
              <Package className="size-3.5" /> Productos
            </ToggleGroupItem>
            <ToggleGroupItem value="kardex">
              <BarChart3 className="size-3.5" /> Kardex
            </ToggleGroupItem>
          </ToggleGroup>

          {/* ── Category list (when in products mode) ────────── */}
          {viewMode === 'products' && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between px-1 mb-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Categorías
                </p>
                {isAdmin && (
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          onClick={openCreateCategoryModal}
                          size="icon"
                          className="size-5 rounded-lg bg-foreground text-primary-foreground hover:bg-foreground/90 transition-colors"
                        >
                          <Plus className="size-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>Nueva categoría</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>

              <div className="px-1 mb-1">
                <SearchInput
                  placeholder="Buscar categoría..."
                  value={categorySearchTerm}
                  onChange={(e) => setCategorySearchTerm(e.target.value)}
                />
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
                <div className="grid grid-cols-2 gap-2 max-h-[440px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {/* All products button */}
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => handleCategoryClick(null)}
                        className={`group flex flex-col items-center justify-center p-3 rounded-2xl text-center border transition-all duration-300 min-h-[104px] hover:-translate-y-0.5 hover:shadow-md active:scale-95 ${
                          selectedCategoryId === null
                            ? 'bg-primary/10 border-primary/30 text-primary shadow-sm'
                            : 'bg-muted/20 border-border/30 hover:bg-muted/40 hover:border-border/60 hover:text-foreground'
                        }`}
                      >
                        <div className={`size-9 rounded-xl flex items-center justify-center shrink-0 mb-2 transition-all duration-300 ${
                          selectedCategoryId === null
                            ? 'bg-primary text-primary-foreground scale-105 shadow-sm'
                            : 'bg-background/80 border border-border/10 text-muted-foreground group-hover:bg-background group-hover:text-foreground group-hover:scale-105 shadow-inner'
                        }`}>
                          <Package className="size-4" />
                        </div>
                        <p className="text-xs font-black truncate w-full tracking-wide">Todos</p>
                        <span className={`mt-1.5 px-2 py-0.5 rounded-full text-[8px] font-bold tracking-wider uppercase transition-colors duration-300 ${
                          selectedCategoryId === null
                            ? 'bg-primary/20 text-primary'
                            : 'bg-muted-foreground/10 text-muted-foreground group-hover:bg-muted-foreground/20'
                        }`}>
                          {allProducts.length} prod
                        </span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-popover text-foreground border-border/10 shadow-lg rounded-xl px-4 py-3 max-w-[240px] [&_svg]:fill-popover">
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
                                  const hasTrend = trend && trend.change !== 0
                                  return (
                                  <div key={i} className="flex items-center gap-2">
                                    <span className="text-[9px] text-muted-foreground truncate w-[70px] shrink-0" title={p.name}>{p.name}</span>
                                    <div className="flex-1 h-2 rounded-full bg-muted/50 overflow-hidden">
                                      <div
                                        className={`h-full rounded-full transition-all ${p.stock <= 0 ? 'bg-red-400' : p.stock <= 5 ? 'bg-amber-400' : 'bg-primary'}`}
                                        style={{ width: `${Math.max((p.stock / maxStock) * 100, p.stock > 0 ? 8 : 3)}%` }}
                                      />
                                    </div>
                                    <span className="text-[9px] font-bold tabular-nums w-6 text-right shrink-0">{p.stock}</span>
                                    {hasTrend && (
                                      <TrendBadge value={trend.change} size="sm" className="text-[8px] px-1 py-0" />
                                    )}
                                  </div>
                                )})
                              })()}
                              {allCategoryStats.products.length > 6 && (
                                <p className="text-[9px] text-muted-foreground font-bold">+{allCategoryStats.products.length - 6} más</p>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>

                  {/* Individual categories */}
                  {categories
                    .filter((c) => c.isActive)
                    .filter((c) => c.name.toLowerCase().includes(categorySearchTerm.toLowerCase()))
                    .map((cat) => {
                      const isSelected = selectedCategoryId === cat.id
                      const count = productCountByCategory[cat.id] || 0
                      const catStats = categoryStats[cat.id]
                      const catTrend = categoryTrends[cat.id]
                      const catProducts = catStats?.products || []
                      const maxStock = catProducts.length > 0 ? Math.max(...catProducts.map((p) => p.stock), 1) : 1
                      return (
                        <Tooltip key={cat.id} delayDuration={300}>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={() => handleCategoryClick(cat.id)}
                              className={`group flex flex-col items-center justify-center p-3 rounded-2xl text-center border transition-all duration-300 min-h-[104px] hover:-translate-y-0.5 hover:shadow-md active:scale-95 ${
                                isSelected
                                  ? 'bg-primary/10 border-primary/30 text-primary shadow-sm'
                                  : 'bg-muted/20 border-border/30 hover:bg-muted/40 hover:border-border/60 hover:text-foreground'
                              }`}
                            >
                              <div className={`size-9 rounded-xl flex items-center justify-center shrink-0 mb-2 transition-all duration-300 ${
                                isSelected
                                  ? 'bg-primary text-primary-foreground scale-105 shadow-sm'
                                  : 'bg-background/80 border border-border/10 text-muted-foreground group-hover:bg-background group-hover:text-foreground group-hover:scale-105 shadow-inner'
                              }`}>
                                <Tags className="size-4" />
                              </div>
                              <p className="text-xs font-black truncate w-full tracking-wide" title={cat.name}>{cat.name}</p>
                              <span className={`mt-1.5 px-2 py-0.5 rounded-full text-[8px] font-bold tracking-wider uppercase transition-colors duration-300 ${
                                isSelected
                                  ? 'bg-primary/20 text-primary'
                                  : 'bg-muted-foreground/10 text-muted-foreground group-hover:bg-muted-foreground/20'
                              }`}>
                                {count} prod
                              </span>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="bg-popover text-foreground border-border/10 shadow-lg rounded-xl px-4 py-3 max-w-[240px] [&_svg]:fill-popover">
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
                                  <TrendBadge
                                    value={catTrend.totalChange}
                                    percent={catTrend.totalPrev > 0 ? Math.round((catTrend.totalChange / catTrend.totalPrev) * 100) : 0}
                                    size="sm"
                                    showPercent
                                  />
                                </div>
                              )}
                              {catStats && catProducts.length > 0 && (
                                <>
                                  <div className="h-px bg-border/10" />
                                  <div className="flex flex-col gap-1">
                                    <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Stock por Producto</p>
                                    {catProducts.slice(0, 6).map((p, i) => {
                                      const trend = productTrendMap[p.id]
                                      const hasTrend = trend && trend.change !== 0
                                      return (
                                        <div key={i} className="flex items-center gap-2">
                                          <span className="text-[9px] text-muted-foreground truncate w-[70px] shrink-0" title={p.name}>{p.name}</span>
                                          <div className="flex-1 h-2 rounded-full bg-muted/50 overflow-hidden">
                                            <div
                                              className={`h-full rounded-full transition-all ${p.stock <= 0 ? 'bg-red-400' : p.stock <= 5 ? 'bg-amber-400' : 'bg-primary'}`}
                                              style={{ width: `${Math.max((p.stock / maxStock) * 100, p.stock > 0 ? 8 : 3)}%` }}
                                            />
                                          </div>
                                          <span className="text-[9px] font-bold tabular-nums w-6 text-right shrink-0">{p.stock}</span>
                                          {hasTrend && (
                                            <TrendBadge value={trend.change} size="sm" className="text-[8px] px-1 py-0" />
                                          )}
                                        </div>
                                      )
                                    })}
                                    {catProducts.length > 6 && (
                                      <p className="text-[9px] text-muted-foreground font-bold">+{catProducts.length - 6} más</p>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                            {isAdmin && (
                              <div className="h-px bg-border/10" />
                            )}
                            {isAdmin && (
                              <div className="flex items-center gap-1 justify-end">
                                <span
                                  role="button"
                                  tabIndex={0}
                                  onClick={() => { setEditingCategory(cat); openEditCategoryModal(cat) }}
                                  className="size-7 rounded-lg flex items-center justify-center hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                >
                                  <Edit className="size-3.5" />
                                </span>
                                <span
                                  role="button"
                                  tabIndex={0}
                                  onClick={() => handleDeleteCategory(cat)}
                                  className="size-7 rounded-lg flex items-center justify-center hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="size-3.5" />
                                </span>
                              </div>
                            )}
                        </TooltipContent>
                      </Tooltip>
                      )
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

          {/* ── Search (kardex mode) ────────────────────────── */}
          {viewMode === 'kardex' && (
            <div className="flex flex-col gap-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1 mb-1">
                Filtros
              </p>
              <SearchInput
                placeholder="Buscar por producto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          )}
        </div>
      }
    >
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* RIGHT PANEL – Content                                             */}
      {/* ═══════════════════════════════════════════════════════════════════ */}

      {/* ── PRODUCTS VIEW ──────────────────────────────────────────────── */}
      {viewMode === 'products' && (
        <div className="bg-card rounded-[2rem] border border-border/10 shadow-xl p-5 flex flex-col gap-4 min-h-[60vh]">
          {/* Header with search */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              {showProductForm ? (
                <p className="text-sm font-black tracking-tight">Nuevo Producto</p>
              ) : (
                <>
                  <ResultsCount count={productsList.length} label='producto' />
                  {selectedCategory && (
                    <Badge variant="outline" className="font-bold text-[10px] border-primary/20 text-primary shrink-0">
                      {selectedCategory.name}
                    </Badge>
                  )}
                </>
              )}
            </div>
            {!showProductForm && (
            <div className="flex items-center gap-2">
              {isAdmin && (
                <Button
                  size="sm"
                  className="h-8 rounded-xl text-xs font-bold gap-1 shrink-0"
                  onClick={openCreateProductModal}
                >
                  <Plus className="size-3.5" /> Producto
                </Button>
              )}
              <div className="w-56 shrink-0">
                <SearchInput
                  placeholder="Buscar por nombre, SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            )}
          </div>

          {showProductForm ? (
            <form onSubmit={handleProductSubmit} className="flex flex-col gap-4 p-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-bold">SKU *</label>
                  <Input value={sku} onChange={(e) => setSku(e.target.value)} required className="rounded-xl" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold">Código de barras</label>
                  <Input placeholder="Escanear o ingresar" value={barcode} onChange={(e) => setBarcode(e.target.value)} className="rounded-xl" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold">Nombre *</label>
                <Input placeholder="Nombre del producto" value={name} onChange={(e) => setName(e.target.value)} required className="rounded-xl" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold">Categoría *</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full h-10 px-3 border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                  required
                >
                  <option value="" disabled>Seleccione categoría...</option>
                  {categories.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-bold">Precio Compra *</label>
                  <Input type="number" step="0.01" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} required className="rounded-xl" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold">Precio Venta *</label>
                  <Input type="number" step="0.01" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} required className="rounded-xl" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-bold">Stock Inicial</label>
                  <Input type="number" value={stockCurrent} onChange={(e) => setStockCurrent(e.target.value)} className="rounded-xl" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold">Stock Mínimo</label>
                  <Input type="number" value={stockMinimum} onChange={(e) => setStockMinimum(e.target.value)} className="rounded-xl" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold">URL de Imagen</label>
                <Input placeholder="http://..." value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="rounded-xl" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold">Descripción</label>
                <Textarea placeholder="Breve descripción del producto..." value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="rounded-xl" />
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-border/10">
                <Button type="button" variant="outline" onClick={() => setShowProductForm(false)} className="rounded-xl">
                  Cancelar
                </Button>
                <LoadingButton
                  type="submit"
                  isLoading={createMutation.isPending}
                  className="rounded-xl font-bold"
                >
                  Crear Producto
                </LoadingButton>
              </div>
            </form>
          ) : isLoadingProducts ? (
            <LoadingSpinner size='md' label='Cargando productos...' />
          ) : productsList.length === 0 ? (
            <EmptyState
              icon={Package}
              title={searchTerm ? 'No se encontraron productos' : selectedCategory ? 'No hay productos en esta categoría' : 'No hay productos registrados'}
              description={isAdmin && !searchTerm ? 'Creá tu primer producto.' : undefined}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {productsList.map((prod) => {
                const trend = productTrendMap[prod.id]
                return (
                  <div
                    key={prod.id}
                    className={`group flex flex-col p-4 rounded-2xl border transition-all duration-200 hover:shadow-md ${
                      !prod.isActive
                        ? 'border-border/5 bg-muted/30 opacity-60'
                        : 'border-border/10 bg-background/50 hover:border-border/20'
                    }`}
                  >
                    {prod.imageUrl ? (
                      <div className="w-full h-32 rounded-xl overflow-hidden mb-3 bg-muted/30">
                        <img
                          src={prod.imageUrl}
                          alt={prod.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-32 rounded-xl mb-3 bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center">
                        <Package className="size-10 text-primary/20" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="text-sm font-black truncate">{prod.name}</h3>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {getStockBadge(prod)}
                          {trend && trend.change !== 0 && (
                            <Tooltip delayDuration={200}>
                              <TooltipTrigger asChild>
                                <TrendBadge value={trend.change} size="sm" className="cursor-default" />
                              </TooltipTrigger>
                              <TooltipContent side="top" className="bg-popover text-foreground border-border/10 shadow-lg rounded-xl px-3 py-2 max-w-[200px]">
                                <div className="flex flex-col gap-1.5">
                                  <p className="text-[10px] font-black">Tendencia {trendDays}d</p>
                                  <div className="h-px bg-border/10" />
                                  <div className="flex items-center justify-between">
                                    <span className="text-[9px] text-muted-foreground font-bold">Stock Anterior</span>
                                    <span className="text-[10px] font-bold tabular-nums">{trend.previousStock} uds.</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-[9px] text-muted-foreground font-bold">Stock Actual</span>
                                    <span className="text-[10px] font-bold tabular-nums">{trend.currentStock} uds.</span>
                                  </div>
                                  <div className="h-px bg-border/10" />
                                  <div className="flex items-center justify-between">
                                    <span className="text-[9px] text-muted-foreground font-bold">Cambio</span>
                                    <TrendBadge value={trend.change} percent={trend.changePercent} size="sm" showPercent />
                                  </div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground font-mono mb-1">
                        SKU: {prod.sku}
                        {prod.barcode && ` · UPC: ${prod.barcode}`}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-semibold mb-2">
                        {prod.category.name}
                      </p>

                      <div className="flex items-baseline gap-3">
                        <div>
                          <p className="text-[9px] text-muted-foreground uppercase font-bold">Venta</p>
                          <p className="text-base font-black text-primary">
                            {formatCurrency(Number(prod.salePrice))}
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] text-muted-foreground uppercase font-bold">Compra</p>
                          <p className="text-sm font-bold text-muted-foreground">
                            {formatCurrency(Number(prod.purchasePrice))}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/5">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-8 rounded-xl text-xs font-bold"
                        onClick={() => openAdjustModal(prod)}
                      >
                        <ArrowUpDown className="size-3" /> Stock
                      </Button>
                      {isAdmin && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 rounded-xl"
                          onClick={() => openEditModal(prod)}
                        >
                          <Edit className="size-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── KARDEX VIEW ─────────────────────────────────────────────────── */}
      {viewMode === 'kardex' && (
        <div className="bg-card rounded-[2rem] border border-border/10 shadow-xl p-5 flex flex-col gap-4 min-h-[60vh]">
          <div className="flex items-center justify-between">
            <ResultsCount count={filteredMovements.length} label='movimiento' />
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
              Historial de Stock
            </p>
          </div>

          {isLoadingMovements ? (
            <LoadingSpinner size='md' label='Cargando movimientos...' />
          ) : filteredMovements.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title={searchTerm ? 'No se encontraron movimientos' : 'No hay movimientos registrados'}
              description='Los movimientos aparecen cuando se ajusta stock, se compra o se vende.'
            />
          ) : (
            /* Kardex table */
            <div className="w-full overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/10">
                    <th className="text-left py-3 px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Fecha</th>
                    <th className="text-left py-3 px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Producto</th>
                    <th className="text-left py-3 px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Tipo</th>
                    <th className="text-center py-3 px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Cant.</th>
                    <th className="text-center py-3 px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Stock Prev.</th>
                    <th className="text-center py-3 px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Stock Post.</th>
                    <th className="text-left py-3 px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Operador</th>
                    <th className="text-left py-3 px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMovements.map((move: any) => {
                    const qty = Number(move.quantity)
                    const isPositive = qty > 0
                    return (
                      <tr
                        key={move.id}
                        className="border-b border-border/5 hover:bg-background/50 transition-colors"
                      >
                        <td className="py-3 px-3 text-xs text-muted-foreground whitespace-nowrap">
                          {formatDateTime(move.createdAt)}
                        </td>
                        <td className="py-3 px-3 font-semibold text-xs">{move.product.name}</td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5">
                            {getMovementIcon(move.movementType)}
                            {getMovementBadge(move.movementType)}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-flex items-center gap-0.5 font-bold text-xs ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                            {isPositive ? <ArrowUpRight className="size-3" /> : <ArrowDownLeft className="size-3" />}
                            {isPositive ? `+${qty}` : qty}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center text-xs text-muted-foreground font-mono">
                          {move.previousStock}
                        </td>
                        <td className="py-3 px-3 text-center text-xs font-mono font-semibold">
                          {move.newStock}
                        </td>
                        <td className="py-3 px-3 text-xs text-muted-foreground">
                          {move.createdBy.name}
                        </td>
                        <td className="py-3 px-3 text-xs text-muted-foreground max-w-[200px] truncate">
                          {move.notes || (move.referenceType ? `${move.referenceType} #${move.referenceId}` : '-')}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* DIALOGS                                                          */}
      {/* ═══════════════════════════════════════════════════════════════════ */}

      {/* ── Product Create/Edit Dialog ──────────────────────────────────── */}
      <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-black">
              {selectedProduct ? 'Editar Producto' : 'Nuevo Producto'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleProductSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-bold">SKU *</label>
                <Input value={sku} onChange={(e) => setSku(e.target.value)} required className="rounded-xl" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold">Código de barras</label>
                <Input placeholder="Escanear o ingresar" value={barcode} onChange={(e) => setBarcode(e.target.value)} className="rounded-xl" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold">Nombre *</label>
              <Input placeholder="Nombre del producto" value={name} onChange={(e) => setName(e.target.value)} required className="rounded-xl" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold">Categoría *</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full h-10 px-3 border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                required
              >
                <option value="" disabled>Seleccione categoría...</option>
                {categories.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-bold">Precio Compra *</label>
                <Input type="number" step="0.01" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} required className="rounded-xl" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold">Precio Venta *</label>
                <Input type="number" step="0.01" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} required className="rounded-xl" />
              </div>
            </div>
            {!selectedProduct && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-bold">Stock Inicial</label>
                  <Input type="number" value={stockCurrent} onChange={(e) => setStockCurrent(e.target.value)} className="rounded-xl" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold">Stock Mínimo</label>
                  <Input type="number" value={stockMinimum} onChange={(e) => setStockMinimum(e.target.value)} className="rounded-xl" />
                </div>
              </div>
            )}
            {selectedProduct && (
              <div className="space-y-1">
                <label className="text-sm font-bold">Stock Mínimo</label>
                <Input type="number" value={stockMinimum} onChange={(e) => setStockMinimum(e.target.value)} className="rounded-xl" />
              </div>
            )}
            <div className="space-y-1">
              <label className="text-sm font-bold">URL de Imagen</label>
              <Input placeholder="http://..." value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="rounded-xl" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold">Descripción</label>
              <Textarea placeholder="Breve descripción del producto..." value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="rounded-xl" />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={closeProductModal} className="rounded-xl">
                Cancelar
              </Button>
              <LoadingButton
                type="submit"
                isLoading={createMutation.isPending || updateMutation.isPending}
                className="rounded-xl font-bold"
              >
                {selectedProduct ? 'Guardar Cambios' : 'Crear Producto'}
              </LoadingButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Adjust Stock Dialog ─────────────────────────────────────────── */}
      <Dialog open={isAdjustModalOpen} onOpenChange={setIsAdjustModalOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-black">Ajustar Stock — {selectedProduct?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdjustSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-bold">Cantidad</label>
                <Input type="number" min="1" value={adjustQty} onChange={(e) => setAdjustQty(e.target.value)} required className="rounded-xl" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold">Tipo de Ajuste</label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as 'MANUAL_ADJUSTMENT' | 'LOSS' | 'RETURN')}
                  className="w-full h-10 px-3 border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                  required
                >
                  <option value="MANUAL_ADJUSTMENT">Entrada Manual</option>
                  <option value="LOSS">Salida / Pérdida</option>
                  <option value="RETURN">Devolución</option>
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold">Notas / Justificación *</label>
              <Textarea
                placeholder="Ej. Rotura, conteo mensual, vencimiento..."
                value={adjustNotes}
                onChange={(e) => setAdjustNotes(e.target.value)}
                required
                rows={3}
                className="rounded-xl"
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={closeAdjustModal} className="rounded-xl">
                Cancelar
              </Button>
              <LoadingButton type="submit" isLoading={adjustMutation.isPending} className="rounded-xl font-bold">
                Registrar Ajuste
              </LoadingButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Category Create/Edit Dialog ─────────────────────────────── */}
      <Dialog open={isCategoryModalOpen} onOpenChange={closeCategoryModal}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-black">
              {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCategorySubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-bold">Nombre de la Categoría *</label>
              <Input
                placeholder="Ej. Suplementos, Accesorios..."
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                required
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold">Descripción</label>
              <Textarea
                placeholder="Breve descripción de la categoría..."
                value={categoryDescription}
                onChange={(e) => setCategoryDescription(e.target.value)}
                rows={3}
                className="rounded-xl"
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={closeCategoryModal} className="rounded-xl">
                Cancelar
              </Button>
              <LoadingButton
                type="submit"
                isLoading={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                className="rounded-xl font-bold"
              >
                {editingCategory ? 'Guardar Cambios' : 'Crear Categoría'}
              </LoadingButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!categoryToDelete}
        onOpenChange={(open) => { if (!open) setCategoryToDelete(null) }}
        title="Eliminar Categoría"
        description={
          <>
            ¿Estás seguro de eliminar <strong className="text-foreground">{categoryToDelete?.name}</strong>? Los productos asociados no se eliminarán, solo la categoría quedará oculta.
          </>
        }
        onConfirm={() => {
          if (categoryToDelete) deleteCategoryMutation.mutate(categoryToDelete)
          setCategoryToDelete(null)
        }}
      />
    </ModuleLayout>
    </TooltipProvider>
  )
}
