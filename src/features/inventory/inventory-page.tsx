import { ChevronRight, Package, Plus, Search } from 'lucide-react'
import { ModuleLayout } from '#/shared/components/layout/module-layout.tsx'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '#/shared/components/ui/toggle-group'
import { Button } from '#/shared/components/ui/button'
import { SearchInput } from '#/shared/components/search-input'
import { Skeleton } from '#/shared/components/ui/skeleton'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '#/shared/components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '#/shared/components/ui/dialog'
import { LoadingButton } from '#/shared/components/ui/loading-button'
import { useInventory } from './hooks/use-inventory.ts'
import { CategoryCard } from './components/category-card.tsx'
import { ProductPanel } from './components/product-panel.tsx'
import { KardexTable } from './components/kardex-table.tsx'
import { StockAdjustDialog } from './components/stock-adjust-dialog.tsx'
import { StockTransferDialog } from './components/stock-transfer-dialog.tsx'
import { CategoryDialogs } from './components/category-dialogs.tsx'
import { ProductFormFields } from './components/product-form.tsx'

export function InventoryPage() {
  const inv = useInventory()

  return (
    <TooltipProvider>
      <ModuleLayout
        breadcrumb={
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Inventario</span>
            <ChevronRight className="size-3 text-muted-foreground/50" />
            <span className="text-foreground">
              {inv.viewMode === 'products'
                ? inv.selectedCategory
                  ? inv.selectedCategory.name
                  : 'Productos'
                : 'Kardex'}
            </span>
          </div>
        }
        title="Inventario"
        leftPanel={
          <div className="flex flex-col gap-6 z-10 w-full">
            <ToggleGroup
              type="single"
              value={inv.viewMode}
              onValueChange={(v) => {
                if (v) inv.handleViewModeChange(v as 'products' | 'kardex')
              }}
            >
              <ToggleGroupItem value="products">
                <Package className="size-3.5" /> Categorías
              </ToggleGroupItem>
              <ToggleGroupItem value="kardex">
                <Search className="size-3.5" /> Kardex
              </ToggleGroupItem>
            </ToggleGroup>

            {inv.viewMode === 'products' && (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between px-1 mb-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Categorías
                  </p>
                  {inv.isAdmin && (
                    <Tooltip delayDuration={200}>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          onClick={inv.openCreateCategoryModal}
                          size="sm"
                          className="h-6 rounded-full bg-foreground text-primary-foreground hover:bg-foreground/90 transition-colors gap-0.5 text-xs font-bold"
                        >
                          <Plus className="size-4" /> Nuevo
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>Nueva categoría</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>

                <div className="px-1 mb-1">
                  <SearchInput
                    placeholder="Buscar categoría..."
                    value={inv.categorySearchTerm}
                    onChange={(e) => inv.setCategorySearchTerm(e.target.value)}
                  />
                </div>

                {inv.isLoadingCategories ? (
                  <div className="grid grid-cols-2 gap-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="flex flex-col items-center justify-center p-3 rounded-2xl bg-muted/10 border border-border/10 gap-2 h-[104px] animate-pulse"
                      >
                        <Skeleton className="size-8 rounded-xl shrink-0" />
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-4.5 w-12 rounded-full" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-[440px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none">
                    {inv.activeCategories.map((cat) => (
                      <CategoryCard
                        key={cat.id}
                        cat={cat}
                        isSelected={inv.selectedCategoryId === cat.id}
                        catTrend={inv.categoryTrends[cat.id]}
                        trendDays={inv.trendDays}
                        isAdmin={inv.isAdmin}
                        onSelect={inv.handleCategoryClick}
                        onEdit={inv.openEditCategoryModal}
                        onDelete={inv.setCategoryToDelete}
                      />
                    ))}

                    {inv.activeCategories.length === 0 && (
                      <p className="col-span-2 text-xs text-muted-foreground text-center py-4">
                        {inv.categorySearchTerm
                          ? 'No se encontraron categorías'
                          : 'No hay categorías activas'}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {inv.viewMode === 'kardex' && (
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1 mb-1">
                  Filtros
                </p>
                <SearchInput
                  placeholder="Buscar por producto..."
                  value={inv.searchTerm}
                  onChange={(e) => inv.setSearchTerm(e.target.value)}
                />
              </div>
            )}
          </div>
        }
      >
        {inv.viewMode === 'products' && (
          <ProductPanel
            productsList={inv.productsList}
            selectedCategory={inv.selectedCategory}
            selectedCategoryId={inv.selectedCategoryId}
            isLoading={inv.isLoadingProducts}
            searchTerm={inv.searchTerm}
            onSearchChange={inv.setSearchTerm}
            showProductForm={inv.showProductForm}
            form={inv.form}
            categories={inv.categories}
            onFormChange={inv.setForm}
            onSubmit={inv.handleProductSubmit}
            onCancelForm={() => inv.setShowProductForm(false)}
            onCreateProduct={inv.openCreateProductModal}
            onEditProduct={inv.openEditModal}
            onAdjustStock={(prod) => {
              inv.setSelectedProduct(prod)
              inv.setIsAdjustModalOpen(true)
            }}
            onTransferStock={(prod) => {
              inv.setSelectedProduct(prod)
              inv.setIsTransferModalOpen(true)
            }}
            productTrendMap={inv.productTrendMap}
            isAdmin={inv.isAdmin}
            trendDays={inv.trendDays}
            isCreating={inv.isCreatingProduct}
          />
        )}

        {inv.viewMode === 'kardex' && (
          <KardexTable
            movements={inv.movements}
            searchTerm={inv.searchTerm}
            isLoading={inv.isLoadingMovements}
          />
        )}
      </ModuleLayout>

      {/* Product Dialog */}
      <Dialog
        open={inv.isProductModalOpen}
        onOpenChange={(open) => {
          if (!open) inv.closeProductModal()
        }}
      >
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-black">
              {inv.selectedProduct ? 'Editar Producto' : 'Nuevo Producto'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={inv.handleProductSubmit} className="space-y-4">
            <ProductFormFields
              values={inv.form}
              categories={inv.categories}
              onChange={inv.setForm}
            />
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={inv.closeProductModal}
                className="rounded-full"
              >
                Cancelar
              </Button>
              <LoadingButton
                type="submit"
                isLoading={inv.isCreatingProduct || inv.isUpdatingProduct}
                className="rounded-full font-bold"
              >
                {inv.selectedProduct ? 'Guardar Cambios' : 'Crear Producto'}
              </LoadingButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <StockAdjustDialog
        isOpen={inv.isAdjustModalOpen}
        onOpenChange={(open) => {
          inv.setIsAdjustModalOpen(open)
          if (!open) inv.setSelectedProduct(null)
        }}
        productName={inv.selectedProduct?.name || ''}
        isPending={inv.isAdjustingStock}
        onSubmit={inv.handleAdjustSubmit}
      />

      <StockTransferDialog
        isOpen={inv.isTransferModalOpen}
        onOpenChange={(open) => {
          inv.setIsTransferModalOpen(open)
          if (!open) inv.setSelectedProduct(null)
        }}
        productName={inv.selectedProduct?.name || ''}
        isPending={inv.isTransferringStock}
        onSubmit={inv.handleTransferSubmit}
      />

      <CategoryDialogs
        isModalOpen={inv.isCategoryModalOpen}
        editingCategory={inv.editingCategory}
        isPendingCreate={inv.isCreatingCategory}
        isPendingUpdate={inv.isUpdatingCategory}
        categoryToDelete={inv.categoryToDelete}
        isPendingDelete={inv.isDeletingCategory}
        onSubmit={inv.handleCategorySubmit}
        onConfirmDelete={inv.deleteCategory}
        onClose={inv.closeCategoryModal}
        onCloseDelete={() => inv.setCategoryToDelete(null)}
      />
    </TooltipProvider>
  )
}
