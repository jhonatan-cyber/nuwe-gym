import { Building2 } from 'lucide-react'
import { formatCurrency } from '#/shared/lib/formatters.ts'

interface Package {
  id: number
  name: string
  price: string | number
  durationDays: number
  type?: string
  description?: string | null
}

interface Step2Props {
  packages: Package[]
  selectedPackageId: number | null
  error?: string
  onSelect: (id: number) => void
}

export function Step2PackageSelect({ packages, selectedPackageId, error, onSelect }: Step2Props) {
  return (
    <div>
      <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white mb-1">
        Selección de Paquete
      </h2>
      <p className="text-[11px] font-semibold text-gray-400 dark:text-white/40 uppercase tracking-widest mb-6">
        Elegí el paquete de beneficios
      </p>
      {packages.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm font-bold text-gray-400 dark:text-white/40">No hay paquetes activos disponibles.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {packages.map((pkg) => {
            const isSelected = selectedPackageId === pkg.id
            return (
              <button
                key={pkg.id}
                type="button"
                onClick={() => onSelect(pkg.id)}
                className={`relative flex items-start gap-4 p-5 rounded-2xl border-2 text-left transition-all duration-200 ${
                  isSelected
                    ? 'bg-gray-900/5 border-gray-900 dark:bg-white/5 dark:border-white shadow-sm'
                    : 'bg-gray-50 border-gray-200 hover:border-gray-300 dark:bg-white/[0.02] dark:border-white/10 dark:hover:border-white/20'
                }`}
              >
                <div
                  className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                    isSelected ? 'border-gray-900 dark:border-white' : 'border-gray-300 dark:border-white/20'
                  }`}
                >
                  {isSelected && <div className="size-2.5 rounded-full bg-gray-900 dark:bg-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-black text-base text-gray-900 dark:text-white">{pkg.name}</h3>
                    <span className="text-xl font-black text-gray-900 dark:text-white shrink-0">
                      {formatCurrency(Number(pkg.price))}
                    </span>
                  </div>
                  {pkg.description && (
                    <p className="text-xs text-gray-500 dark:text-white/60 mt-1 line-clamp-2">{pkg.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-white/10 px-2.5 py-0.5 text-[10px] font-bold text-gray-500 dark:text-white/60 border border-gray-200 dark:border-white/10">
                      <Building2 className="size-3" />
                      {pkg.durationDays} días
                    </span>
                    {pkg.type !== 'PACKAGE' && (
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold text-primary border border-primary/20 uppercase tracking-wide">
                        {pkg.type === 'PROMOTION' ? 'Promoción' : 'Especial'}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
      {error && <p className="text-[10px] font-semibold text-destructive mt-2">{error}</p>}
    </div>
  )
}
