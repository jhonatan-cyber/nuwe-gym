import { PackageIcon, Edit2, Power, PowerOff, Trash2 } from 'lucide-react'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '#/shared/components/ui/tooltip'
import { Button } from '#/shared/components/ui/button'
import { Badge } from '#/shared/components/ui/badge'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '#/shared/components/ui/alert-dialog'
import { formatCurrency } from '#/shared/lib/formatters.ts'
import { getDurationLabel, getTypeIcon, getTypeLabel } from '../utils.ts'
import type { Package } from '../types.ts'

interface PackageCardProps {
  pkg: Package
  isReadOnly: boolean
  onEdit: (pkg: Package) => void
  onToggleActive: (pkg: Package) => void
  onDelete: (id: string) => void
}

export function PackageCard({
  pkg,
  isReadOnly,
  onEdit,
  onToggleActive,
  onDelete,
}: PackageCardProps) {
  const TypeIcon = getTypeIcon(pkg.type)

  return (
    <div className="group relative rounded-2xl border dark:border-white/6 border-black/6 overflow-hidden transition-all duration-200 hover:shadow-lg hover:scale-[1.01] bg-card">
      <div className="relative aspect-16/10 overflow-hidden dark:bg-white/2 bg-black/2">
        {pkg.imageBase64 ? (
          <img
            src={pkg.imageBase64}
            alt={pkg.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <PackageIcon
              className="size-12 text-muted-foreground/30"
              strokeWidth={1}
            />
          </div>
        )}
        <div className="absolute top-3 left-3">
          <Badge className="bg-foreground/80 text-primary-foreground backdrop-blur-md border-none text-[10px] font-bold uppercase tracking-wider gap-1">
            <TypeIcon className="size-3" />
            {getTypeLabel(pkg.type)}
          </Badge>
        </div>
        {!pkg.isActive && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
            <Badge variant="secondary" className="font-bold">
              Inactivo
            </Badge>
          </div>
        )}
        {!isReadOnly && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-1.5">
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onEdit(pkg)}
                    className="rounded-xl bg-white/90 text-black hover:bg-white dark:bg-black/90 dark:text-white dark:hover:bg-black"
                  >
                    <Edit2 className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Editar paquete</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onToggleActive(pkg)}
                    className={`rounded-xl ${pkg.isActive ? 'bg-emerald-500/90 text-white hover:bg-emerald-500' : 'bg-muted/90 text-muted-foreground hover:bg-muted'}`}
                  >
                    {pkg.isActive ? (
                      <Power className="size-3.5" />
                    ) : (
                      <PowerOff className="size-3.5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>
                    {pkg.isActive ? 'Desactivar paquete' : 'Activar paquete'}
                  </p>
                </TooltipContent>
              </Tooltip>
              <AlertDialog>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="rounded-xl"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Eliminar paquete</p>
                  </TooltipContent>
                </Tooltip>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Eliminar paquete</AlertDialogTitle>
                    <AlertDialogDescription>
                      ¿Estas seguro de eliminar este paquete? Esta accion no se
                      puede deshacer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel asChild>
                      <Button variant="outline">Cancelar</Button>
                    </AlertDialogCancel>
                    <AlertDialogAction asChild>
                      <Button
                        variant="destructive"
                        onClick={() => onDelete(pkg.id)}
                      >
                        Eliminar
                      </Button>
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </TooltipProvider>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-1.5">
          <h3 className="font-black text-sm tracking-tight truncate">
            {pkg.name}
          </h3>
          {pkg.isActive ? (
            <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] font-bold shrink-0">
              Activo
            </Badge>
          ) : (
            <Badge
              variant="secondary"
              className="text-[10px] font-bold shrink-0"
            >
              Inactivo
            </Badge>
          )}
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-muted-foreground">
            Precio: {formatCurrency(Number(pkg.price))}
          </p>
          <p className="text-xs font-bold text-muted-foreground">
            Tiempo: {getDurationLabel(pkg.durationDays)}
          </p>
        </div>
        {pkg.items.length > 0 && (
          <div className="mt-3 pt-3 border-t dark:border-white/5 border-black/5">
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
              Beneficios
            </p>
            <ul className="space-y-1">
              {pkg.items.slice(0, 3).map((item, idx) => (
                <li
                  key={idx}
                  className="text-[11px] text-muted-foreground flex items-center gap-1.5"
                >
                  <span className="size-1 rounded-full bg-foreground/40 shrink-0" />
                  <span className="truncate">{item.description}</span>
                </li>
              ))}
              {pkg.items.length > 3 && (
                <li className="text-[10px] text-muted-foreground font-semibold">
                  +{pkg.items.length - 3} mas
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
