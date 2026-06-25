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
} from 'lucide-react'
import { toast } from 'sonner'
import { getProducts, getCategories } from '#/features/products/server.ts'
import { getMembers } from '#/features/members/server.ts'
import { createSale } from '#/features/sales/server.ts'
import { getCurrentCashSession } from '#/features/cash-register/server.ts'
import { Button } from '#/shared/components/ui/button'
import { LoadingButton } from '#/shared/components/ui/loading-button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '#/shared/components/ui/card'
import { Input } from '#/shared/components/ui/input'
import { Badge } from '#/shared/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '#/shared/components/ui/dialog'

interface CartItem {
  id: number
  name: string
  salePrice: string
  quantity: number
  stockCurrent: number
}

export function POSPage() {
  const queryClient = useQueryClient()

  const [cart, setCart] = useState<CartItem[]>([])
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
    queryKey: ['current-cash-session'],
    queryFn: () => getCurrentCashSession(),
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['product-categories-active'],
    queryFn: () => getCategories(),
  })

  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products', debouncedProductSearch, categoryIdFilter],
    queryFn: () =>
      getProducts({
        data: {
          search: debouncedProductSearch,
          categoryId: categoryIdFilter ? Number(categoryIdFilter) : undefined,
        },
      }),
  })

  const { data: members = [] } = useQuery({
    queryKey: ['members-search', debouncedMemberSearch],
    queryFn: () => getMembers({ data: { search: debouncedMemberSearch } }),
    enabled: debouncedMemberSearch.length >= 2,
  })

  const saleMutation = useMutation({
    mutationFn: createSale,
    onSuccess: (data) => {
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

  const updateQuantity = (id: number, delta: number) => {
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

  const removeFromCart = (id: number) => {
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
        items: cart.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          unitPrice: item.salePrice,
        })),
      },
    })
  }

  if (isLoadingSession) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Verificando estado de la caja...
      </div>
    )
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

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
        <div className="lg:col-span-2 flex flex-col gap-4 overflow-hidden h-full">
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
              <div className="text-center py-12 text-muted-foreground">
                Cargando catálogo...
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No hay productos disponibles.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
                {products
                  .filter((p: (typeof products)[number]) => p.isActive)
                  .map((prod: (typeof products)[number]) => {
                    const isOutOfStock = prod.stockCurrent <= 0
                    return (
                      <Card
                        key={prod.id}
                        onClick={() => !isOutOfStock && addToCart(prod)}
                        className={`cursor-pointer overflow-hidden border transition-all duration-200 hover:shadow-md hover:border-primary/40 flex flex-col justify-between ${
                          isOutOfStock
                            ? 'opacity-60 cursor-not-allowed bg-muted/40'
                            : ''
                        }`}
                      >
                        <div className="p-3">
                          {prod.imageUrl ? (
                            <div className="aspect-square w-full rounded-md bg-muted overflow-hidden mb-2">
                              <img
                                src={prod.imageUrl}
                                alt={prod.name}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="aspect-square w-full rounded-md bg-primary/5 text-primary flex items-center justify-center mb-2 text-2xl font-bold">
                              {prod.name.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <h3 className="font-semibold text-sm line-clamp-2 min-h-8 mb-1 leading-snug">
                            {prod.name}
                          </h3>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Stock: {prod.stockCurrent}</span>
                            {prod.stockCurrent <= prod.stockMinimum && (
                              <Badge
                                variant="destructive"
                                className="py-0 px-1 text-[10px] bg-amber-500/10 text-amber-600 border-none font-bold"
                              >
                                Bajo
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="p-3 border-t bg-muted/30 flex items-center justify-between">
                          <span className="font-bold text-primary text-base">
                            ${prod.salePrice}
                          </span>
                          {!isOutOfStock && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-7 rounded-full bg-primary/10 text-primary hover:bg-primary/20"
                            >
                              <Plus className="size-4" />
                            </Button>
                          )}
                        </div>
                      </Card>
                    )
                  })}
              </div>
            )}
          </div>
        </div>

        <Card className="lg:col-span-1 flex flex-col h-full overflow-hidden shadow-lg border-primary/10">
          <CardHeader className="py-4 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <ShoppingBag className="size-5 text-primary" /> Carrito de Compras
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                <ShoppingBag className="size-12 stroke-[1.5]" />
                <p className="text-sm">El carrito está vacío</p>
                <p className="text-xs text-center px-4">
                  Hacé click en los productos del catálogo para sumarlos.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0"
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <h4 className="text-sm font-semibold truncate leading-tight">
                        {item.name}
                      </h4>
                      <span className="text-xs text-muted-foreground block">
                        ${item.salePrice} c/u
                      </span>
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
                ))}
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
                  placeholder="Buscar socio por Nombre o DNI..."
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
              <Input
                type="number"
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
                  <span>GymManager POS</span>
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
