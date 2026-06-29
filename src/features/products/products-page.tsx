import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Package,
  Plus,
  Edit,
  ArrowUpDown,
  Search,
  AlertTriangle,
  Barcode,
  Tags,
  DollarSign,
  Box,
} from 'lucide-react'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '#/shared/components/ui/tooltip'
import { toast } from 'sonner'
import {
  getProducts,
  getCategories,
  createProduct,
  updateProduct,
  adjustStock,
} from '#/features/products/server.ts'
import { useCurrentBranch } from '#/shared/hooks/use-current-branch.ts'
import { Button } from '#/shared/components/ui/button'
import { LoadingButton } from '#/shared/components/ui/loading-button'
import { Input } from '#/shared/components/ui/input'
import { Textarea } from '#/shared/components/ui/textarea'
import { Badge } from '#/shared/components/ui/badge'
import { PageHeader } from '#/shared/components/page-header'
import { DataTable } from '#/shared/components/data-table'
import { Route as authedRoute } from '#/routes/_authed.tsx'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '#/shared/components/ui/dialog'

export function ProductsPage() {
  const queryClient = useQueryClient()
  const { userRole } = authedRoute.useRouteContext()
  const isAdmin = userRole === 'ADMIN'

  const [searchTerm, setSearchTerm] = useState('')
  const [categoryIdFilter, setCategoryIdFilter] = useState<string>('')

  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false)

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

  const [adjustQty, setAdjustQty] = useState('1')
  const [adjustType, setAdjustType] = useState<
    'MANUAL_ADJUSTMENT' | 'LOSS' | 'RETURN'
  >('MANUAL_ADJUSTMENT')
  const [adjustNotes, setAdjustNotes] = useState('')

  const { data: categories = [] } = useQuery({
    queryKey: ['product-categories-active'],
    queryFn: () => getCategories(),
  })

  const { branchId } = useCurrentBranch()

  const { data: productsList = [], isLoading } = useQuery({
    queryKey: ['products', branchId, searchTerm, categoryIdFilter],
    queryFn: () =>
      getProducts({
        data: {
          search: searchTerm,
          categoryId: categoryIdFilter ? Number(categoryIdFilter) : undefined,
          branchId,
        },
      }),
    enabled: !!branchId,
  })

  const [selectedProduct, setSelectedProduct] = useState<
    (typeof productsList)[number] | null
  >(null)

  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Producto creado con éxito')
      closeProductModal()
    },
    onError: () => toast.error('Error al crear el producto'),
  })

  const updateMutation = useMutation({
    mutationFn: updateProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Producto actualizado con éxito')
      closeProductModal()
    },
    onError: () => toast.error('Error al actualizar el producto'),
  })

  const adjustMutation = useMutation({
    mutationFn: adjustStock,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Stock ajustado con éxito')
      closeAdjustModal()
    },
    onError: () => toast.error('Error al ajustar el stock'),
  })

  const openCreateModal = () => {
    setSelectedProduct(null)
    setSku(`PROD-${Date.now().toString().slice(-6)}`)
    setBarcode('')
    setName('')
    setDescription('')
    setCategoryId(categories[0]?.id?.toString() || '')
    setPurchasePrice('0')
    setSalePrice('0')
    setStockCurrent('0')
    setStockMinimum('0')
    setImageUrl('')
    setIsProductModalOpen(true)
  }

  const openEditModal = (prod: (typeof productsList)[number]) => {
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

  const closeProductModal = () => {
    setIsProductModalOpen(false)
    setSelectedProduct(null)
  }

  const openAdjustModal = (prod: (typeof productsList)[number]) => {
    setSelectedProduct(prod)
    setAdjustQty('1')
    setAdjustType('MANUAL_ADJUSTMENT')
    setAdjustNotes('')
    setIsAdjustModalOpen(true)
  }

  const closeAdjustModal = () => {
    setIsAdjustModalOpen(false)
    setSelectedProduct(null)
  }

  const handleProductSubmit = (e: React.FormEvent) => {
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
      branchId,
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

  const handleAdjustSubmit = (e: React.FormEvent) => {
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Productos / Inventario"
        description="Gestioná el stock de bebidas, suplementos y accesorios del buffet."
        icon={<Package className="size-8 text-primary" />}
        action={
          isAdmin && (
            <Button onClick={openCreateModal}>
              <Plus className="size-4" /> Nuevo Producto
            </Button>
          )
        }
      />

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-sm">
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
          className="w-full md:w-56 h-10 px-3 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Todas las categorías</option>
          {categories.map((cat: (typeof categories)[number]) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <TooltipProvider delayDuration={200}>
        <DataTable
          columns={[
            {
              key: 'sku',
              label: (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-default">SKU</span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Stock Keeping Unit (código interno)</p>
                  </TooltipContent>
                </Tooltip>
              ),
              render: (prod: (typeof productsList)[number]) => (
                <span className="inline-flex items-center gap-1.5 font-mono text-xs">
                  <Barcode className="size-3 text-muted-foreground" />
                  {prod.sku}
                </span>
              ),
            },
            {
              key: 'product',
              label: 'Producto',
              render: (prod: (typeof productsList)[number]) => (
                <div className="flex flex-col">
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <Package className="size-3 text-muted-foreground" />
                    {prod.name}
                  </span>
                  {prod.barcode && (
                    <span className="text-xs text-muted-foreground">
                      Código: {prod.barcode}
                    </span>
                  )}
                </div>
              ),
            },
            {
              key: 'category',
              label: 'Categoría',
              render: (prod: (typeof productsList)[number]) => (
                <span className="inline-flex items-center gap-1.5">
                  <Tags className="size-3 text-muted-foreground" />
                  {prod.category.name}
                </span>
              ),
            },
            {
              key: 'purchasePrice',
              label: (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-default">Precio Compra</span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Costo unitario del producto</p>
                  </TooltipContent>
                </Tooltip>
              ),
              render: (prod: (typeof productsList)[number]) => (
                <span className="inline-flex items-center gap-1.5">
                  <DollarSign className="size-3 text-muted-foreground" />$
                  {prod.purchasePrice}
                </span>
              ),
            },
            {
              key: 'salePrice',
              label: (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-default">Precio Venta</span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Precio al público</p>
                  </TooltipContent>
                </Tooltip>
              ),
              render: (prod: (typeof productsList)[number]) => (
                <span className="inline-flex items-center gap-1.5 font-semibold text-primary">
                  <DollarSign className="size-3 text-muted-foreground" />$
                  {prod.salePrice}
                </span>
              ),
            },
            {
              key: 'stock',
              label: (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-default">Stock Actual</span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Unidades disponibles en inventario</p>
                  </TooltipContent>
                </Tooltip>
              ),
              render: (prod: (typeof productsList)[number]) => {
                const isLowStock = prod.stockCurrent <= prod.stockMinimum
                return (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 font-semibold">
                      <Box className="size-3 text-muted-foreground" />
                      {prod.stockCurrent}
                    </span>
                    {isLowStock && (
                      <Badge
                        variant="destructive"
                        className="flex gap-1 py-0.5 px-1 bg-amber-500/10 text-amber-600 hover:bg-amber-500/10 border-none"
                      >
                        <AlertTriangle className="size-3" />
                        Mín: {prod.stockMinimum}
                      </Badge>
                    )}
                  </div>
                )
              },
            },
            {
              key: 'actions',
              label: 'Acciones',
              className: 'text-right',
              render: (prod: (typeof productsList)[number]) => (
                <div className="flex justify-end gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    title="Ajustar Stock"
                    onClick={() => openAdjustModal(prod)}
                  >
                    <ArrowUpDown className="size-4" />
                  </Button>
                  {isAdmin && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => openEditModal(prod)}
                    >
                      <Edit className="size-4" />
                    </Button>
                  )}
                </div>
              ),
            },
          ]}
          data={productsList}
          isLoading={isLoading}
          loadingMessage="Cargando productos..."
          emptyMessage="No se encontraron productos."
          keyExtractor={(prod: (typeof productsList)[number]) => prod.id}
        />
      </TooltipProvider>

      <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedProduct ? 'Editar Producto' : 'Nuevo Producto'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleProductSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">SKU *</label>
                <Input
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Código de barras</label>
                <Input
                  placeholder="Escanear o ingresar"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Nombre *</label>
              <Input
                placeholder="Nombre del producto"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Categoría *</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full h-10 px-3 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                required
              >
                <option value="" disabled>
                  Seleccione categoría...
                </option>
                {categories.map((cat: (typeof categories)[number]) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Precio Compra *</label>
                <Input
                  type="number"
                  step="0.01"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Precio Venta *</label>
                <Input
                  type="number"
                  step="0.01"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  required
                />
              </div>
            </div>
            {!selectedProduct && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Stock Inicial</label>
                  <Input
                    type="number"
                    value={stockCurrent}
                    onChange={(e) => setStockCurrent(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Stock Mínimo</label>
                  <Input
                    type="number"
                    value={stockMinimum}
                    onChange={(e) => setStockMinimum(e.target.value)}
                  />
                </div>
              </div>
            )}
            {selectedProduct && (
              <div className="space-y-1">
                <label className="text-sm font-medium">Stock Mínimo</label>
                <Input
                  type="number"
                  value={stockMinimum}
                  onChange={(e) => setStockMinimum(e.target.value)}
                />
              </div>
            )}
            <div className="space-y-1">
              <label className="text-sm font-medium">URL de Imagen</label>
              <Input
                placeholder="http://..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Descripción</label>
              <Textarea
                placeholder="Breve descripción del producto..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={closeProductModal}
              >
                Cancelar
              </Button>
              <LoadingButton
                type="submit"
                isLoading={createMutation.isPending || updateMutation.isPending}
              >
                {selectedProduct ? 'Guardar Cambios' : 'Crear Producto'}
              </LoadingButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isAdjustModalOpen} onOpenChange={setIsAdjustModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustar Stock - {selectedProduct?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdjustSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Cantidad</label>
                <Input
                  type="number"
                  min="1"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Tipo de Ajuste</label>
                <select
                  value={adjustType}
                  onChange={(e) =>
                    setAdjustType(
                      e.target.value as 'MANUAL_ADJUSTMENT' | 'LOSS' | 'RETURN',
                    )
                  }
                  className="w-full h-10 px-3 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                >
                  <option value="MANUAL_ADJUSTMENT">Entrada Manual</option>
                  <option value="LOSS">Salida / Pérdida</option>
                  <option value="RETURN">Devolución</option>
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">
                Notas / Justificación *
              </label>
              <Textarea
                placeholder="Ej. Rotura, conteo mensual, vencimiento..."
                value={adjustNotes}
                onChange={(e) => setAdjustNotes(e.target.value)}
                required
                rows={3}
              />
            </div>
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={closeAdjustModal}
              >
                Cancelar
              </Button>
              <LoadingButton type="submit" isLoading={adjustMutation.isPending}>
                Registrar Ajuste
              </LoadingButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
