import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ShoppingBag,
  Search,
  Plus,
  Minus,
  Trash2,
  Tag,
  Landmark,
  Check,
  AlertTriangle,
  Package,
} from 'lucide-react'
import { toast } from 'sonner'
import { getProducts, getCategories } from '#/features/products/server.ts'
import { POSRecommendations } from './components/pos-recommendations.tsx'
import { getMembers } from '#/features/members/server.ts'
import { createSale } from '#/features/sales/server.ts'
import { getCurrentCashSession } from '#/features/cash-register/server.ts'
import { useCurrentBranch } from '#/shared/hooks/use-current-branch.ts'
import { Button } from '#/shared/components/ui/button'
import { LoadingButton } from '#/shared/components/ui/loading-button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '#/shared/components/ui/card'
import { Input } from '#/shared/components/ui/input'
import { NumericInput } from '#/shared/components/ui/numeric-input'
import { Badge } from '#/shared/components/ui/badge'
import { LoadingSpinner } from '#/shared/components/ui/loading-spinner'
import { EmptyState } from '#/shared/components/ui/empty-state'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '#/shared/components/ui/dialog'

interface CartItem {
  id: string
  name: string
  salePrice: string
  quantity: number
  stockCurrent: number
}

function getStockLevel(stockCurrent: number, stockMinimum: number) {
  if (stockCurrent <= 0) return { level: 'out' as const, label: 'Sin stock', color: 'bg-red-500', textColor: 'text-red-600', bgBadge: 'bg-red-500/10' }
  if (stockCurrent <= stockMinimum * 0.5 && stockMinimum > 0) return { level: 'critical' as const, label: 'Crítico', color: 'bg-red-500', textColor: 'text-red-600', bgBadge: 'bg-red-500/10' }
  if (stockCurrent <= stockMinimum) return { level: 'low' as const, label: 'Bajo', color: 'bg-amber-500', textColor: 'text-amber-600', bgBadge: 'bg-amber-500/10' }
  return { level: 'ok' as const, label: 'Ok', color: 'bg-emerald-500', textColor: 'text-emerald-600', bgBadge: 'bg-emerald-500/10' }
}

export function POSPage() {
  const queryClient = useQueryClient()
  const { branchId } = useCurrentBranch()

  const [cart, setCart] = useState<CartItem[]>([])
  const [activeTab, setActiveTab] = useState<'catalog' | 'cart'>('catalog')
  const [lastProductId, setLastProductId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedProductSearch, setDebouncedProductSearch] = useState('')
  const [categoryIdFilter, setCategoryIdFilter] = useState('')

  const [selectedMemberId, setSelectedMemberId] = useState<string>('')
  const [customerName, setCustomerName] = useState('')
  const [memberSearchTerm, setMemberSearchTerm] = useState('')
  const [debouncedMemberSearch, setDebouncedMemberSearch] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedProductSearch(searchTerm)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedMemberSearch(memberSearchTerm)
    }, 300)
    return () => clearTimeout(timer)
  }, [memberSearchTerm])

  const [paymentMethod, setPaymentMethod] = useState<
    'CASH' | 'QR' | 'TRANSFER' | 'CARD'
  >('CASH')
  const [discount, setDiscount] = useState('0')

  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false)

  const { data: cashSession, isLoading: isLoadingSession } = useQuery({
    queryKey: ['current-cash-session', branchId],
    queryFn: () => getCurrentCashSession({ data: { branchId } }),
    enabled: !!branchId,
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['product-categories-active'],
    queryFn: () => getCategories({ data: {} }),
  })

  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products', branchId, debouncedProductSearch, categoryIdFilter],
    queryFn: () =>
      getProducts({
        data: {
          search: debouncedProductSearch,
          categoryId: categoryIdFilter || undefined,
          branchId,
        },
      }),
    enabled: !!branchId,
  })

  const { data: members = [] } = useQuery({
    queryKey: ['members-search', debouncedMemberSearch],
    queryFn: () => getMembers({ data: { search: debouncedMemberSearch } }),
    enabled: debouncedMemberSearch.length >= 2,
  })

  const saleMutation = useMutation({
    mutationFn: createSale,
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['cash-session-details'] })
      setLastCompletedSale(data)
      setIsSuccessModalOpen(true)

      setCart([])
      setSelectedMemberId('')
      setCustomerName('')
      setMemberSearchTerm('')
      setDiscount('0')
      setPaymentMethod('CASH')
      toast.success('¡Venta realizada con éxito!')
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Error al completar la venta')
    },
  })

  const [lastCompletedSale, setLastCompletedSale] = useState<
    typeof saleMutation.data | null
  >(null)

  const isCashSessionOpen = !!cashSession

  const addToCart = (product: (typeof products)[number]) => {
    if (product.stockCurrent <= 0) {
      toast.error('Producto sin stock disponible.')
      return
    }
    setLastProductId(product.id)

    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id)
      if (existing) {
        if (existing.quantity >= product.stockCurrent) {
          toast.error(
            `No podés agregar más de ${product.stockCurrent} unidades.`,
          )
          return prev
        }
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        )
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          salePrice: product.salePrice,
          quantity: 1,
          stockCurrent: product.stockCurrent,
        },
      ]
    })
  }

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const nextQty = item.quantity + delta
            if (nextQty > item.stockCurrent) {
              toast.error(`Solo hay ${item.stockCurrent} unidades disponibles.`)
              return item
            }
            return { ...item, quantity: nextQty }
          }
          return item
        })
        .filter((item) => item.quantity > 0),
    )
  }

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id))
  }

  const subtotal = cart.reduce(
    (sum, item) => sum + Number(item.salePrice) * item.quantity,
    0,
  )
  const discountVal = Number(discount) || 0
  const total = Math.max(0, subtotal - discountVal)

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error('El carrito está vacío.')
      return
    }

    if (!isCashSessionOpen) {
      toast.error('Debe abrir la caja antes de procesar una venta.')
      return
    }

    saleMutation.mutate({
      data: {
        memberId: selectedMemberId ? Number(selectedMemberId) : undefined,
        customerName: selectedMemberId
          ? undefined
          : customerName || 'Cliente General',
        paymentMethod,
        discount,
        branchId,
        items: cart.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          unitPrice: item.salePrice,
        })),
      },
    })
  }

  if (isLoadingSession) {
    return <LoadingSpinner label="Verificando estado de la caja..." />
  }

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ShoppingBag className="size-8 text-primary" />
            Punto de Venta (POS)
          </h1>
          <p className="text-muted-foreground">
            Buffet y Venta rápida de productos a socios.
          </p>
        </div>
        {!isCashSessionOpen && (
          <Badge
            variant="destructive"
            className="flex gap-1.5 py-1.5 px-3 bg-red-500/10 text-red-600 border-none"
          >
            <Landmark className="size-4" />
            Caja Cerrada (Checkout Desactivado)
          </Badge>
        )}
      </div>

      {/* Selector de pestañas para mobile */}
      <div className="grid grid-cols-2 p-1 bg-muted rounded-xl mb-1 lg:hidden shrink-0 border border-border/10">
        <button
          type="button"
          onClick={() => setActiveTab('catalog')}
          className={`py-2.5 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'catalog'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Catálogo
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('cart')}
          className={`py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'cart'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Carrito
          {cart.length > 0 && (
            <Badge className="bg-primary hover:bg-primary text-primary-foreground h-4 min-w-4 rounded-full flex items-center justify-center p-0.5 text-[9px] font-bold">
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </Badge>
          )}
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
        <div className={`lg:col-span-2 flex flex-col gap-4 overflow-hidden h-full ${activeTab === 'catalog' ? 'flex' : 'hidden lg:flex'}`}>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por Nombre, SKU o Código..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              value={categoryIdFilter}
              onChange={(e) => setCategoryIdFilter(e.target.value)}
              className="w-full md:w-48 h-10 px-3 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Todas las categorías</option>
              {categories.map((cat: (typeof categories)[number]) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 overflow-y-auto pr-1">
            {isLoadingProducts ? (
              <LoadingSpinner size="lg" label="Cargando catálogo..." />
            ) : products.length === 0 ? (
              <EmptyState
                icon={ShoppingBag}
                title="Sin productos"
                description="No hay productos disponibles."
              />
            ) : (
              <>
                {lastProductId && (
                  <POSRecommendations
                    currentProductId={lastProductId}
                    memberId={selectedMemberId || null}
                    onAddToCart={(id) => {
                      const prod = products.find((p: any) => p.id === id)
                      if (prod) addToCart(prod)
                    }}
                  />
                )}
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
                {products
                  .filter((p: (typeof products)[number]) => p.isActive)
                  .map((prod: (typeof products)[number]) => {
                    const isOutOfStock = prod.stockCurrent <= 0
                    const stockInfo = getStockLevel(prod.stockCurrent, prod.stockMinimum)
                    const stockPercent = prod.stockMinimum > 0
                      ? Math.min(100, Math.round((prod.stockCurrent / prod.stockMinimum) * 100))
                      : prod.stockCurrent > 0 ? 100 : 0
                    return (
                      <Card
                        key={prod.id}
                        onClick={() => !isOutOfStock && addToCart(prod)}
                        className={`relative cursor-pointer overflow-hidden border transition-all duration-200 hover:shadow-md hover:border-primary/40 flex flex-col justify-between group ${
                          isOutOfStock
                            ? 'opacity-50 cursor-not-allowed'
                            : stockInfo.level === 'critical'
                              ? 'ring-1 ring-red-500/20'
                              : stockInfo.level === 'low'
                                ? 'ring-1 ring-amber-500/20'
                                : ''
                        }`}
                      >
                        {/* Stock level top bar */}
                        <div className="relative">
                          <div className={`h-1 w-full ${stockInfo.level === 'out' ? 'bg-red-200' : stockInfo.level === 'critical' ? 'bg-red-200' : stockInfo.level === 'low' ? 'bg-amber-200' : 'bg-emerald-200'}`}>
                            <div
                              className={`h-full transition-all duration-500 ${stockInfo.color}`}
                              style={{ width: `${isOutOfStock ? 0 : Math.max(stockPercent, 5)}%` }}
                            />
                          </div>
                        </div>

                        <div className="p-3">
                          {isOutOfStock && (
                            <div className="absolute top-2 right-2 z-10">
                              <Badge className="bg-red-500/90 text-white border-none text-[9px] font-bold py-0.5 px-1.5">
                                AGOTADO
                              </Badge>
                            </div>
                          )}
                          {prod.imageUrl ? (
                            <div className="aspect-square w-full rounded-md bg-muted overflow-hidden mb-2">
                              <img
                                src={prod.imageUrl}
                                alt={prod.name}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className={`aspect-square w-full rounded-md mb-2 flex items-center justify-center text-2xl font-bold ${
                              isOutOfStock
                                ? 'bg-red-500/5 text-red-300'
                                : stockInfo.level === 'critical'
                                  ? 'bg-red-500/5 text-red-400'
                                  : 'bg-primary/5 text-primary'
                            }`}>
                              {prod.name.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <h3 className="font-semibold text-sm line-clamp-2 min-h-8 mb-1.5 leading-snug">
                            {prod.name}
                          </h3>
                          {/* Stock indicator */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground font-bold">Stock</span>
                              <div className="flex items-center gap-1">
                                <span className={`font-bold tabular-nums ${isOutOfStock ? 'text-red-500' : stockInfo.textColor}`}>
                                  {prod.stockCurrent}
                                </span>
                                <span className="text-muted-foreground/50 text-[10px]">
                                  / {prod.stockMinimum} min
                                </span>
                              </div>
                            </div>
                            {/* Progress bar */}
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  isOutOfStock
                                    ? 'bg-red-300'
                                    : stockInfo.level === 'critical'
                                      ? 'bg-red-500'
                                      : stockInfo.level === 'low'
                                        ? 'bg-amber-500'
                                        : 'bg-emerald-500'
                                }`}
                                style={{ width: `${isOutOfStock ? 0 : Math.max(stockPercent, 5)}%` }}
                              />
                            </div>
                            {!isOutOfStock && stockInfo.level !== 'ok' && (
                              <div className="flex items-center gap-1">
                                <AlertTriangle className={`size-3 ${stockInfo.textColor}`} />
                                <span className={`text-[10px] font-bold ${stockInfo.textColor}`}>
                                  {stockInfo.label}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="p-3 border-t bg-muted/30 flex items-center justify-between">
                          <span className="font-bold text-primary text-base">
                            ${prod.salePrice}
                          </span>
                          {!isOutOfStock ? (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-7 rounded-full bg-primary/10 text-primary hover:bg-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-all"
                            >
                              <Plus className="size-4" />
                            </Button>
                          ) : (
                            <div className="size-7 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center">
                              <Package className="size-3.5" />
                            </div>
                          )}
                        </div>
                      </Card>
                    )
                  })}
              </div>
              </>
            )}
          </div>
        </div>

        <Card className={`lg:col-span-1 flex flex-col h-full overflow-hidden shadow-lg border-primary/10 ${activeTab === 'cart' ? 'flex' : 'hidden lg:flex'}`}>
          <CardHeader className="py-4 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <ShoppingBag className="size-5 text-primary" /> Carrito de Compras
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {cart.length === 0 ? (
              <EmptyState
                icon={ShoppingBag}
                title="El carrito está vacío"
                description="Hacé click en los productos del catálogo para sumarlos."
              />
            ) : (
              <div className="space-y-3">
                {cart.map((item) => {
                  const remaining = item.stockCurrent - item.quantity
                  const isLowStock = remaining <= item.stockCurrent * 0.2 || remaining <= 2
                  return (
                    <div
                      key={item.id}
                      className={`flex justify-between items-center border-b pb-2 last:border-0 last:pb-0 ${isLowStock ? 'bg-red-500/5 -mx-2 px-2 rounded-lg' : ''}`}
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-semibold truncate leading-tight">
                            {item.name}
                          </h4>
                          {isLowStock && (
                            <AlertTriangle className="size-3.5 text-amber-500 shrink-0" />
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground block">
                          ${item.salePrice} c/u
                        </span>
                        {isLowStock && (
                          <span className="text-[10px] font-bold text-amber-600 block mt-0.5">
                            Quedan {remaining} uds. disponibles
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center border rounded-md h-8 bg-background">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7 rounded-none"
                            onClick={() => updateQuantity(item.id, -1)}
                          >
                            <Minus className="size-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-semibold">
                            {item.quantity}
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7 rounded-none"
                            onClick={() => updateQuantity(item.id, 1)}
                          >
                            <Plus className="size-3" />
                          </Button>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-red-500 hover:text-red-600 size-8"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>

          <div className="border-t p-4 bg-muted/20 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold block">
                Asociar Socio (Opcional)
              </label>
              <div className="space-y-2">
                <Input
                  placeholder="Buscar socio por Nombre o CI..."
                  value={memberSearchTerm}
                  onChange={(e) => {
                    setMemberSearchTerm(e.target.value)
                    if (!e.target.value) setSelectedMemberId('')
                  }}
                  className="h-8 text-xs"
                />
                {members.length > 0 && memberSearchTerm.length >= 2 && (
                  <div className="border rounded-md max-h-24 overflow-y-auto bg-background text-xs">
                    {members.map((m: (typeof members)[number]) => (
                      <div
                        key={m.id}
                        onClick={() => {
                          setSelectedMemberId(m.id.toString())
                          setMemberSearchTerm(m.fullName)
                        }}
                        className={`p-2 hover:bg-primary/5 cursor-pointer flex justify-between items-center ${
                          selectedMemberId === m.id.toString()
                            ? 'bg-primary/10 font-bold'
                            : ''
                        }`}
                      >
                        <span>{m.fullName}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {m.documentNumber}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {!selectedMemberId && (
                <Input
                  placeholder="Nombre Cliente General (Ej: Juan Perez)"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="h-8 text-xs"
                />
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold block">
                Método de Pago
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['CASH', 'QR', 'TRANSFER', 'CARD'] as const).map((method) => (
                  <Button
                    key={method}
                    type="button"
                    variant={paymentMethod === method ? 'default' : 'outline'}
                    size="sm"
                    className="text-[10px] py-1 h-8"
                    onClick={() => setPaymentMethod(method)}
                  >
                    {method}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center gap-2">
              <span className="text-xs font-semibold flex items-center gap-1">
                <Tag className="size-3 text-muted-foreground" /> Descuento ($):
              </span>
              <NumericInput
                className="w-24 h-8 text-right text-xs"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
              />
            </div>

            <div className="border-t pt-3 space-y-1.5 text-sm">
              <div className="flex justify-between text-muted-foreground text-xs">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {discountVal > 0 && (
                <div className="flex justify-between text-red-500 text-xs">
                  <span>Descuento:</span>
                  <span>-${discountVal.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t pt-1">
                <span>Total a Cobrar:</span>
                <span className="text-primary">${total.toFixed(2)}</span>
              </div>
            </div>

            <LoadingButton
              className="w-full text-base font-bold py-5 mt-2"
              onClick={handleCheckout}
              disabled={cart.length === 0 || !isCashSessionOpen}
              isLoading={saleMutation.isPending}
            >
              {!isCashSessionOpen
                ? 'CAJA CERRADA'
                : `Cobrar $${total.toFixed(2)}`}
            </LoadingButton>
          </div>
        </Card>
      </div>

      <Dialog open={isSuccessModalOpen} onOpenChange={setIsSuccessModalOpen}>
        <DialogContent className="max-w-sm">
          <div className="text-center py-6 space-y-4">
            <div className="size-16 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-500/20">
              <Check className="size-8 stroke-[2.5]" />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-xl font-bold text-center">
                ¡Venta Completada!
              </DialogTitle>
              <DialogDescription className="text-center text-xs">
                El comprobante se registró de forma exitosa.
              </DialogDescription>
            </div>

            {lastCompletedSale && (
              <div className="p-4 bg-muted rounded-lg space-y-2 text-xs text-left max-w-xs mx-auto border font-mono">
                <div className="flex justify-between border-b pb-1.5 font-bold">
                  <span>Trainix</span>
                  <span>{lastCompletedSale.saleNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total cobrado:</span>
                  <span className="font-bold">${lastCompletedSale.total}</span>
                </div>
                <div className="flex justify-between">
                  <span>Método de Pago:</span>
                  <span>{lastCompletedSale.paymentMethod}</span>
                </div>
              </div>
            )}

            <Button
              className="w-full py-4 text-sm font-semibold"
              onClick={() => setIsSuccessModalOpen(false)}
            >
              Aceptar y Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
