import { Package, Plus } from 'lucide-react'
import { Button } from '#/shared/components/ui/button'
import { LoadingButton } from '#/shared/components/ui/loading-button'
import { Badge } from '#/shared/components/ui/badge'
import { SearchInput } from '#/shared/components/search-input'
import { LoadingSpinner } from '#/shared/components/ui/loading-spinner'
import { EmptyState } from '#/shared/components/ui/empty-state'
import { ResultsCount } from '#/shared/components/ui/results-count'
import { ProductCard } from './product-card.tsx'
import { ProductFormFields } from './product-form.tsx'
import type { ProductFormValues } from './product-form.tsx'

interface ProductPanelProps {
  productsList: any[]
  selectedCategory: any
  selectedCategoryId: string | null | undefined
  isLoading: boolean
  searchTerm: string
  onSearchChange: (term: string) => void
  showProductForm: boolean
  form: ProductFormValues
  categories: any[]
  onFormChange: (form: ProductFormValues) => void
  onSubmit: (e: React.FormEvent) => void
  onCancelForm: () => void
  onCreateProduct: () => void
  onEditProduct: (prod: any) => void
  onAdjustStock: (prod: any) => void
  onTransferStock: (prod: any) => void
  productTrendMap: Record<string, any>
  isAdmin: boolean
  trendDays: number
  isCreating: boolean
}

export function ProductPanel({
  productsList,
  selectedCategory,
  selectedCategoryId,
  isLoading,
  searchTerm,
  onSearchChange,
  showProductForm,
  form,
  categories,
  onFormChange,
  onSubmit,
  onCancelForm,
  onCreateProduct,
  onEditProduct,
  onAdjustStock,
  onTransferStock,
  productTrendMap,
  isAdmin,
  trendDays,
  isCreating,
}: ProductPanelProps) {
  return (
    <div className="bg-card rounded-4xl border border-border/10 shadow-xl p-5 flex flex-col gap-4 min-h-[60vh]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {showProductForm ? (
            <p className="text-sm font-black tracking-tight">
              Nuevo Producto
            </p>
          ) : (
            <>
              <ResultsCount
                count={productsList.length}
                label="producto"
              />
              {selectedCategory && (
                <Badge
                  variant="outline"
                  className="font-bold text-[10px] border-primary/20 text-primary shrink-0"
                >
                  {selectedCategory.name}
                </Badge>
              )}
            </>
          )}
        </div>
        {!showProductForm && (
          <div className="flex items-center gap-2">
            {isAdmin && selectedCategoryId && (
              <Button
                size="sm"
                className="h-8 rounded-full text-xs font-bold gap-1 shrink-0"
                onClick={onCreateProduct}
              >
                <Plus className="size-3.5" /> Producto
              </Button>
            )}
            <div className="w-56 shrink-0">
              <SearchInput
                placeholder="Buscar por nombre, SKU..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {showProductForm ? (
        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-4 p-1"
        >
          <ProductFormFields
            values={form}
            categories={categories}
            onChange={onFormChange}
          />
          <div className="flex items-center gap-2 pt-2 border-t border-border/10">
            <Button
              type="button"
              variant="outline"
              onClick={onCancelForm}
              className="rounded-full"
            >
              Cancelar
            </Button>
            <LoadingButton
              type="submit"
              isLoading={isCreating}
              className="rounded-full font-bold"
            >
              Crear Producto
            </LoadingButton>
          </div>
        </form>
      ) : isLoading ? (
        <LoadingSpinner size="md" label="Cargando productos..." />
      ) : productsList.length === 0 ? (
        <EmptyState
          icon={Package}
          title={
            searchTerm
              ? 'No se encontraron productos'
              : selectedCategory
                ? 'No hay productos en esta categoría'
                : 'No hay productos registrados'
          }
          description={
            isAdmin && !searchTerm
              ? 'Creá tu primer producto.'
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {productsList.map((prod) => (
            <ProductCard
              key={prod.id}
              product={prod}
              trend={productTrendMap[prod.id]}
              isAdmin={isAdmin}
              trendDays={trendDays}
              onEdit={onEditProduct}
                onAdjust={() => onAdjustStock(prod)}
                onTransfer={() => onTransferStock(prod)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
