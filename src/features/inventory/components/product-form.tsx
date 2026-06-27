import { Input } from '#/shared/components/ui/input'
import { Textarea } from '#/shared/components/ui/textarea'

interface ProductFormValues {
  sku: string
  barcode: string
  name: string
  description: string
  categoryId: string
  purchasePrice: string
  salePrice: string
  stockCurrent: string
  stockMinimum: string
  imageUrl: string
}

interface ProductFormFieldsProps {
  values: ProductFormValues
  categories: Array<{ id: string; name: string }>
  onChange: (values: ProductFormValues) => void
  showStock?: boolean
}

export type { ProductFormValues }

export function ProductFormFields({ values, categories, onChange, showStock = true }: ProductFormFieldsProps) {
  function set<TKey extends keyof ProductFormValues>(key: TKey, val: ProductFormValues[TKey]) {
    onChange({ ...values, [key]: val })
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-bold">SKU *</label>
          <Input value={values.sku} onChange={(e) => set('sku', e.target.value)} required className="rounded-xl" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-bold">Código de barras</label>
          <Input placeholder="Escanear o ingresar" value={values.barcode} onChange={(e) => set('barcode', e.target.value)} className="rounded-xl" />
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-sm font-bold">Nombre *</label>
        <Input placeholder="Nombre del producto" value={values.name} onChange={(e) => set('name', e.target.value)} required className="rounded-xl" />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-bold">Categoría *</label>
        <select
          value={values.categoryId}
          onChange={(e) => set('categoryId', e.target.value)}
          className="w-full h-10 px-3 border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring text-sm"
          required
        >
          <option value="" disabled>Seleccione categoría...</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-bold">Precio Compra *</label>
          <Input type="number" step="0.01" value={values.purchasePrice} onChange={(e) => set('purchasePrice', e.target.value)} required className="rounded-xl" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-bold">Precio Venta *</label>
          <Input type="number" step="0.01" value={values.salePrice} onChange={(e) => set('salePrice', e.target.value)} required className="rounded-xl" />
        </div>
      </div>
      {showStock && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-bold">Stock Inicial</label>
            <Input type="number" value={values.stockCurrent} onChange={(e) => set('stockCurrent', e.target.value)} className="rounded-xl" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-bold">Stock Mínimo</label>
            <Input type="number" value={values.stockMinimum} onChange={(e) => set('stockMinimum', e.target.value)} className="rounded-xl" />
          </div>
        </div>
      )}
      {!showStock && (
        <div className="space-y-1">
          <label className="text-sm font-bold">Stock Mínimo</label>
          <Input type="number" value={values.stockMinimum} onChange={(e) => set('stockMinimum', e.target.value)} className="rounded-xl" />
        </div>
      )}
      <div className="space-y-1">
        <label className="text-sm font-bold">URL de Imagen</label>
        <Input placeholder="http://..." value={values.imageUrl} onChange={(e) => set('imageUrl', e.target.value)} className="rounded-xl" />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-bold">Descripción</label>
        <Textarea placeholder="Breve descripción del producto..." value={values.description} onChange={(e) => set('description', e.target.value)} rows={2} className="rounded-xl" />
      </div>
    </>
  )
}
