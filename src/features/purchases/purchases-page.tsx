import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ShoppingCart, Plus, Eye, Trash2, FileText, Calendar, Truck, User, DollarSign } from 'lucide-react'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '#/shared/components/ui/tooltip'
import { toast } from 'sonner'
import { getPurchases, createPurchase } from '#/features/purchases/server.ts'
import { getSuppliers } from '#/features/suppliers/server.ts'
import { getProducts } from '#/features/products/server.ts'
import { Button } from '#/shared/components/ui/button'
import { Input } from '#/shared/components/ui/input'
import { Textarea } from '#/shared/components/ui/textarea'
import { formatDateTime } from '#/shared/lib/formatters.ts'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/shared/components/ui/table'

interface PurchaseFormItem {
  productId: string
  quantity: number
  unitCost: string
}

export function PurchasesPage() {
  const queryClient = useQueryClient()
  const { userRole } = authedRoute.useRouteContext()
  const isAdmin = userRole === 'ADMIN'

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [supplierId, setSupplierId] = useState('')
  const [purchaseNumber, setPurchaseNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [formItems, setFormItems] = useState<PurchaseFormItem[]>([
    { productId: '', quantity: 1, unitCost: '0.00' },
  ])

  const { data: purchasesList = [], isLoading: isLoadingPurchases } = useQuery({
    queryKey: ['purchases'],
    queryFn: () => getPurchases(),
  })

  const { data: suppliersList = [] } = useQuery({
    queryKey: ['suppliers-active'],
    queryFn: () => getSuppliers(),
  })

  const { data: productsList = [] } = useQuery({
    queryKey: ['products-all'],
    queryFn: () => getProducts({ data: {} }),
  })

  const [selectedPurchase, setSelectedPurchase] = useState<
    (typeof purchasesList)[number] | null
  >(null)

  const activeSuppliers = suppliersList.filter(
    (s: (typeof suppliersList)[number]) => s.isActive,
  )
  const activeProducts = productsList.filter(
    (p: (typeof productsList)[number]) => p.isActive,
  )

  const createMutation = useMutation({
    mutationFn: createPurchase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Compra registrada con éxito. Stock actualizado.')
      closeCreateModal()
    },
    onError: (err: Error) =>
      toast.error(err.message || 'Error al registrar la compra'),
  })

  const openCreateModal = () => {
    setSupplierId(activeSuppliers[0]?.id?.toString() || '')
    setPurchaseNumber(`FAC-${Date.now().toString().slice(-6)}`)
    setNotes('')
    setFormItems([
      {
        productId: activeProducts[0]?.id?.toString() || '',
        quantity: 1,
        unitCost: '0.00',
      },
    ])
    setIsCreateOpen(true)
  }

  const closeCreateModal = () => {
    setIsCreateOpen(false)
  }

  const handleAddItem = () => {
    setFormItems((prev) => [
      ...prev,
      {
        productId: activeProducts[0]?.id?.toString() || '',
        quantity: 1,
        unitCost: '0.00',
      },
    ])
  }

  const handleRemoveItem = (index: number) => {
    if (formItems.length === 1) return
    setFormItems((prev) => prev.filter((_, i) => i !== index))
  }

  const handleItemChange = (
    index: number,
    field: keyof PurchaseFormItem,
    value: string | number,
  ) => {
    setFormItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    )
  }

  const calculateTotal = () => {
    return formItems
      .reduce((sum, item) => sum + Number(item.unitCost) * item.quantity, 0)
      .toFixed(2)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (
      !supplierId ||
      !purchaseNumber ||
      formItems.some((item) => !item.productId || item.quantity <= 0)
    ) {
      toast.error('Por favor complete todos los campos requeridos.')
      return
    }

    createMutation.mutate({
      data: {
        supplierId: Number(supplierId),
        purchaseNumber,
        notes,
        items: formItems.map((item) => ({
          productId: Number(item.productId),
          quantity: Number(item.quantity),
          unitCost: item.unitCost,
        })),
      },
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compras de Mercadería"
        description="Registrá la entrada de mercadería de tus proveedores para reponer stock."
        icon={<ShoppingCart className="size-8 text-primary" />}
        action={
          isAdmin && (
            <Button onClick={openCreateModal}>
              <Plus className="size-4" /> Registrar Compra
            </Button>
          )
        }
      />

      <TooltipProvider delayDuration={200}>
      <DataTable
        columns={[
          {
            key: 'purchaseNumber',
            label: (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-default">N° Factura</span>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Número de factura o remito del proveedor</p>
                </TooltipContent>
              </Tooltip>
            ),
            render: (p: (typeof purchasesList)[number]) => (
              <span className="inline-flex items-center gap-1.5 font-mono text-sm font-semibold">
                <FileText className="size-3 text-muted-foreground" />
                {p.purchaseNumber}
              </span>
            ),
          },
          {
            key: 'date',
            label: 'Fecha',
            render: (p: (typeof purchasesList)[number]) => (
              <span className="inline-flex items-center gap-1.5 text-xs">
                <Calendar className="size-3 text-muted-foreground" />
                {formatDateTime(p.purchasedAt)}
              </span>
            ),
          },
          {
            key: 'supplier',
            label: 'Proveedor',
            render: (p: (typeof purchasesList)[number]) => (
              <span className="inline-flex items-center gap-1.5 font-medium">
                <Truck className="size-3 text-muted-foreground" />
                {p.supplier.name}
              </span>
            ),
          },
          {
            key: 'createdBy',
            label: 'Registrada por',
            render: (p: (typeof purchasesList)[number]) => (
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <User className="size-3 text-muted-foreground" />
                {p.createdBy.name}
              </span>
            ),
          },
          {
            key: 'total',
            label: (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-default">Total Costo</span>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Costo total de la compra</p>
                </TooltipContent>
              </Tooltip>
            ),
            render: (p: (typeof purchasesList)[number]) => (
              <span className="inline-flex items-center gap-1.5 font-semibold text-primary">
                <DollarSign className="size-3 text-muted-foreground" />
                ${p.total}
              </span>
            ),
          },
          {
            key: 'actions',
            label: 'Detalles',
            className: 'text-right',
            render: (p: (typeof purchasesList)[number]) => (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setSelectedPurchase(p)}
              >
                <Eye className="size-4" />
              </Button>
            ),
          },
        ]}
        data={purchasesList}
        isLoading={isLoadingPurchases}
        loadingMessage="Cargando compras..."
        emptyMessage="No hay compras registradas."
        keyExtractor={(p: (typeof purchasesList)[number]) => p.id}
      />
      </TooltipProvider>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Registrar Ingreso / Compra de Mercadería</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Proveedor *</label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full h-10 px-3 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                >
                  <option value="" disabled>
                    Seleccione proveedor...
                  </option>
                  {activeSuppliers.map((s: (typeof suppliersList)[number]) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">
                  N° Factura / Remito *
                </label>
                <Input
                  value={purchaseNumber}
                  onChange={(e) => setPurchaseNumber(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2 border-t pt-4">
              <h3 className="text-sm font-semibold flex justify-between items-center">
                Artículos Comprados
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddItem}
                >
                  <Plus className="size-3 mr-1" /> Agregar Fila
                </Button>
              </h3>
              <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
                {formItems.map((item, idx) => (
                  <div key={idx} className="flex gap-3 items-end">
                    <div className="flex-1 space-y-1">
                      {idx === 0 && (
                        <label className="text-xs font-semibold">
                          Producto
                        </label>
                      )}
                      <select
                        value={item.productId}
                        onChange={(e) =>
                          handleItemChange(idx, 'productId', e.target.value)
                        }
                        className="w-full h-10 px-3 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                        required
                      >
                        <option value="" disabled>
                          Seleccione producto...
                        </option>
                        {activeProducts.map(
                          (p: (typeof productsList)[number]) => (
                            <option key={p.id} value={p.id}>
                              {p.name} (Stock: {p.stockCurrent})
                            </option>
                          ),
                        )}
                      </select>
                    </div>
                    <div className="w-24 space-y-1">
                      {idx === 0 && (
                        <label className="text-xs font-semibold">
                          Cantidad
                        </label>
                      )}
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(
                            idx,
                            'quantity',
                            Number(e.target.value),
                          )
                        }
                        required
                      />
                    </div>
                    <div className="w-32 space-y-1">
                      {idx === 0 && (
                        <label className="text-xs font-semibold">
                          Costo Unit. ($)
                        </label>
                      )}
                      <Input
                        type="number"
                        step="0.01"
                        value={item.unitCost}
                        onChange={(e) =>
                          handleItemChange(idx, 'unitCost', e.target.value)
                        }
                        required
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-600 mb-0.5"
                      onClick={() => handleRemoveItem(idx)}
                      disabled={formItems.length === 1}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">
                Notas / Observaciones
              </label>
              <Textarea
                placeholder="Ej. Pago diferido a 30 días, mercadería en buen estado..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            <div className="flex justify-between items-center border-t pt-4">
              <span className="text-lg font-bold">
                Total Costo: ${calculateTotal()}
              </span>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeCreateModal}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  Confirmar Compra
                </Button>
              </DialogFooter>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!selectedPurchase}
        onOpenChange={(open) => !open && setSelectedPurchase(null)}
      >
        <DialogContent className="max-w-md font-mono">
          <DialogHeader>
            <DialogTitle>
              Detalle de Compra {selectedPurchase?.purchaseNumber}
            </DialogTitle>
          </DialogHeader>
          {selectedPurchase && (
            <div className="space-y-4 pt-2 text-xs">
              <div className="grid grid-cols-2 gap-2 border-b pb-3">
                <div>
                  <span className="text-muted-foreground block font-sans">
                    Fecha/Hora:
                  </span>
                  <span>{formatDateTime(selectedPurchase.purchasedAt)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block font-sans">
                    Proveedor:
                  </span>
                  <span>{selectedPurchase.supplier.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block font-sans">
                    Registrada por:
                  </span>
                  <span>{selectedPurchase.createdBy.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block font-sans">
                    Notas:
                  </span>
                  <span className="font-sans block max-w-xs">
                    {selectedPurchase.notes || '-'}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2 font-sans">
                  Artículos Ingresados
                </h4>
                <div className="border rounded-lg overflow-hidden font-sans">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead className="py-2">Prod</TableHead>
                        <TableHead className="py-2 text-center">Cant</TableHead>
                        <TableHead className="py-2 text-right">
                          Costo Unit
                        </TableHead>
                        <TableHead className="py-2 text-right">
                          Subtotal
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedPurchase.items.map(
                        (
                          item: NonNullable<
                            (typeof purchasesList)[number]['items']
                          >[number],
                        ) => (
                          <TableRow key={item.id}>
                            <TableCell className="py-2 font-medium text-xs max-w-[150px] truncate">
                              {item.product.name}
                            </TableCell>
                            <TableCell className="py-2 text-center text-xs">
                              {item.quantity}
                            </TableCell>
                            <TableCell className="py-2 text-right text-xs">
                              ${item.unitCost}
                            </TableCell>
                            <TableCell className="py-2 text-right text-xs font-semibold">
                              ${item.subtotal}
                            </TableCell>
                          </TableRow>
                        ),
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="border-t pt-3 flex justify-between text-base font-bold font-sans">
                <span>Total Factura:</span>
                <span className="text-primary">${selectedPurchase.total}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
