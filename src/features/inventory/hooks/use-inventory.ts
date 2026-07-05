import { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
import {
  getInventoryMovements,
  getStockSnapshots,
  transferStock,
} from '#/features/inventory/server.ts'
import { useCurrentBranch } from '#/shared/hooks/use-current-branch.ts'
import { Route as authedRoute } from '#/routes/_authed.tsx'
import type { ProductFormValues } from '../components/product-form.tsx'

type ViewMode = 'products' | 'kardex'

const EMPTY_FORM: ProductFormValues = {
  sku: '',
  barcode: '',
  name: '',
  description: '',
  categoryId: '',
  purchasePrice: '',
  salePrice: '',
  imageUrl: '',
}

export function useInventory() {
  const queryClient = useQueryClient()
  const { session } = authedRoute.useRouteContext()
  const userRole = session.user.role
  const isAdmin = userRole === 'ADMIN'
  const { branchId } = useCurrentBranch()

  // UI state
  const [viewMode, setViewMode] = useState<ViewMode>('products')
  const [selectedCategoryId, setSelectedCategoryId] = useState<
    string | null | undefined
  >(undefined)
  const [searchTerm, setSearchTerm] = useState('')
  const [categorySearchTerm, setCategorySearchTerm] = useState('')
  const trendDays = 30

  // Product modal state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false)
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [showProductForm, setShowProductForm] = useState(false)
  const [form, setForm] = useState<ProductFormValues>(EMPTY_FORM)

  // Category modal state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<any | null>(null)
  const [categoryToDelete, setCategoryToDelete] = useState<any | null>(null)

  // Queries
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ['product-categories-active', branchId],
    queryFn: () => getCategories({ data: { branchId } }),
  })

  const { data: productsList = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products', branchId, searchTerm, selectedCategoryId],
    queryFn: () =>
      getProducts({
        data: {
          search: searchTerm,
          categoryId: selectedCategoryId ?? undefined,
          branchId,
        },
      }),
  })

  const { data: movements = [], isLoading: isLoadingMovements } = useQuery({
    queryKey: ['inventory-movements', branchId],
    queryFn: () => getInventoryMovements({ data: { branchId } }),
    enabled: !!branchId,
  })

  const { data: stockSnapshots = [] } = useQuery({
    queryKey: ['stock-snapshots', branchId, trendDays],
    queryFn: () => getStockSnapshots({ data: { daysBack: trendDays, branchId } }),
    enabled: !!branchId,
  })

  // Set default category
  useEffect(() => {
    if (selectedCategoryId === undefined && categories.length > 0) {
      const active = categories.filter((c: any) => c.isActive)
      if (active.length > 0) {
        setSelectedCategoryId(active[0].id)
      } else {
        setSelectedCategoryId(null)
      }
    }
  }, [categories, selectedCategoryId])

  // Derived data
  const categoryTrends = useMemo(() => {
    const t: Record<string, { totalChange: number; totalPrev: number }> = {}
    for (const snap of stockSnapshots) {
      t[snap.categoryId] ??= { totalChange: 0, totalPrev: 0 }
      t[snap.categoryId].totalChange += snap.change
      t[snap.categoryId].totalPrev += snap.previousStock
    }
    return t
  }, [stockSnapshots])

  const productTrendMap = useMemo(() => {
    const map: Partial<
      Record<
        string,
        {
          change: number
          changePercent: number
          currentStock: number
          previousStock: number
        }
      >
    > = {}
    for (const snap of stockSnapshots) map[snap.productId] = snap
    return map
  }, [stockSnapshots])

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId)

  const activeCategories = useMemo(
    () =>
      categories.filter(
        (c) =>
          c.isActive &&
          c.name.toLowerCase().includes(categorySearchTerm.toLowerCase()),
      ),
    [categories, categorySearchTerm],
  )

  // Mutations
  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
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
      toast.success('Producto actualizado con éxito')
      closeProductModal()
    },
    onError: () => toast.error('Error al actualizar el producto'),
  })

  const adjustMutation = useMutation({
    mutationFn: adjustStock,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-movements'] })
      toast.success('Stock ajustado con éxito')
      setIsAdjustModalOpen(false)
    },
    onError: () => toast.error('Error al ajustar el stock'),
  })

  const transferMutation = useMutation({
    mutationFn: transferStock,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-movements'] })
      toast.success('Transferencia realizada con éxito')
      setIsTransferModalOpen(false)
      setSelectedProduct(null)
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Error al transferir stock'),
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
    mutationFn: (cat: any) =>
      updateCategory({ data: { id: cat.id, name: cat.name, isActive: false } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-categories-active'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Categoría eliminada con éxito')
    },
    onError: () => toast.error('Error al eliminar la categoría'),
  })

  // Handlers
  function openEditModal(prod: any) {
    setSelectedProduct(prod)
    setForm({
      sku: prod.sku,
      barcode: prod.barcode || '',
      name: prod.name,
      description: prod.description || '',
      categoryId: prod.categoryId.toString(),
      purchasePrice: prod.purchasePrice,
      salePrice: prod.salePrice,
      imageUrl: prod.imageUrl || '',
    })
    setIsProductModalOpen(true)
  }

  function closeProductModal() {
    setIsProductModalOpen(false)
    setSelectedProduct(null)
  }

  function openCreateProductModal() {
    setSelectedProduct(null)
    setForm({
      ...EMPTY_FORM,
      categoryId: selectedCategoryId ? selectedCategoryId.toString() : '',
    })
    setShowProductForm(true)
  }

  function openCreateCategoryModal() {
    setEditingCategory(null)
    setIsCategoryModalOpen(true)
  }

  function closeCategoryModal() {
    setIsCategoryModalOpen(false)
    setEditingCategory(null)
  }

  function openEditCategoryModal(cat: any) {
    setEditingCategory(cat)
    setIsCategoryModalOpen(true)
  }

  function handleCategorySubmit(
    data: { name: string; description: string },
    editingId?: number,
  ) {
    if (editingId) {
      updateCategoryMutation.mutate({
        data: {
          id: editingId,
          name: data.name,
          description: data.description || undefined,
        },
      })
    } else {
      createCategoryMutation.mutate({
        data: { name: data.name, description: data.description || undefined },
      })
    }
  }

  function handleProductSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.sku || !form.categoryId || !form.salePrice) return
    const payload = {
      sku: form.sku,
      barcode: form.barcode,
      name: form.name,
      description: form.description,
      categoryId: form.categoryId,
      purchasePrice: form.purchasePrice,
      salePrice: form.salePrice,
      imageUrl: form.imageUrl,
    }
    if (selectedProduct) {
      updateMutation.mutate({
        data: {
          id: selectedProduct.id,
          ...payload,
          isActive: selectedProduct.isActive,
        },
      })
    } else {
      createMutation.mutate({ data: payload })
    }
  }

  function handleAdjustSubmit(data: {
    quantity: number
    movementType: 'MANUAL_ADJUSTMENT' | 'LOSS' | 'RETURN'
    notes: string
    expiryDate?: string
  }) {
    if (!selectedProduct) return
    adjustMutation.mutate({
      data: {
        productId: selectedProduct.id,
        quantity: data.movementType === 'LOSS' ? -data.quantity : data.quantity,
        movementType: data.movementType,
        branchId,
        notes: data.notes,
        ...(data.expiryDate ? { expiryDate: data.expiryDate } : {}),
      },
    })
  }

  function handleTransferSubmit(data: {
    destBranchId: string
    quantity: number
    notes: string
  }) {
    if (!selectedProduct || !branchId) return
    transferMutation.mutate({
      data: {
        productId: selectedProduct.id,
        sourceBranchId: branchId,
        destBranchId: data.destBranchId,
        quantity: data.quantity,
        notes: data.notes,
      },
    })
  }

  function handleCategoryClick(catId: string | null) {
    setSelectedCategoryId(catId)
    setSearchTerm('')
  }

  function handleViewModeChange(mode: ViewMode) {
    setViewMode(mode)
    setSearchTerm('')
  }

  return {
    // State
    viewMode,
    selectedCategoryId,
    selectedCategory,
    searchTerm,
    categorySearchTerm,
    trendDays,
    isAdmin,
    branchId,

    // Product state
    isProductModalOpen,
    isAdjustModalOpen,
    isTransferModalOpen,
    selectedProduct,
    showProductForm,
    form,

    // Category state
    isCategoryModalOpen,
    editingCategory,
    categoryToDelete,

    // Data
    categories,
    activeCategories,
    productsList,
    movements,
    isLoadingCategories,
    isLoadingProducts,
    isLoadingMovements,
    categoryTrends,
    productTrendMap,

    // Mutations pending states
    isCreatingProduct: createMutation.isPending,
    isUpdatingProduct: updateMutation.isPending,
    isAdjustingStock: adjustMutation.isPending,
    isTransferringStock: transferMutation.isPending,
    isCreatingCategory: createCategoryMutation.isPending,
    isUpdatingCategory: updateCategoryMutation.isPending,
    isDeletingCategory: deleteCategoryMutation.isPending,

    // Setters
    setSearchTerm,
    setCategorySearchTerm,
    setForm,
    setShowProductForm,
    setSelectedProduct,
    setIsAdjustModalOpen,
    setIsTransferModalOpen,
    setIsProductModalOpen,
    setCategoryToDelete,

    // Handlers
    handleViewModeChange,
    handleCategoryClick,
    handleProductSubmit,
    handleAdjustSubmit,
    handleTransferSubmit,
    handleCategorySubmit,
    openEditModal,
    openCreateProductModal,
    openCreateCategoryModal,
    openEditCategoryModal,
    closeProductModal,
    closeCategoryModal,
    deleteCategory: (cat: any) => deleteCategoryMutation.mutate(cat),
  }
}
