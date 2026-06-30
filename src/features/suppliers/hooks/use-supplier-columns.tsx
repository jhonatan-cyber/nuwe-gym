import {
  Phone,
  Mail,
  MapPin,
  Eye,
  Edit2,
  Trash2,
} from 'lucide-react'
import { Button } from '#/shared/components/ui/button'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '#/shared/components/ui/tooltip'
import { Badge } from '#/shared/components/ui/badge'
import type { Supplier } from '#/features/suppliers/types.ts'
import { cn } from '#/shared/lib/utils.ts'

interface UseSupplierColumnsProps {
  handleDeleteSupplier: (supplier: Supplier) => void
  setViewSupplierId: (id: string | null) => void
  setEditingSupplier: (supplier: Supplier | null) => void
}

export function useSupplierColumns({
  handleDeleteSupplier,
  setViewSupplierId,
  setEditingSupplier,
}: UseSupplierColumnsProps) {
  return [
    {
      key: 'name',
      label: 'Proveedor',
      sortable: true,
      sortValue: (sup: Supplier) => sup.name,
      render: (sup: Supplier) => (
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 ring-2 ring-foreground/10">
            <span className="text-xs font-bold text-primary">
              {sup.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm dark:text-white text-foreground leading-tight truncate">
              {sup.name}
            </p>
            {sup.email && (
              <p className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                <Mail className="size-2.5" />
                {sup.email}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      label: (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-default">Teléfono</span>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Número de contacto del proveedor</p>
          </TooltipContent>
        </Tooltip>
      ),
      sortable: true,
      sortValue: (sup: Supplier) => sup.phone || '',
      className: 'hidden sm:table-cell',
      headerClassName: 'hidden sm:table-cell',
      render: (sup: Supplier) => (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex items-center gap-1.5 text-xs text-foreground/70 cursor-default">
              <Phone className="size-3 text-muted-foreground" />
              {sup.phone || '-'}
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>{sup.phone || 'Sin teléfono'}</p>
          </TooltipContent>
        </Tooltip>
      ),
    },
    {
      key: 'address',
      label: (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-default">Dirección</span>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Dirección comercial del proveedor</p>
          </TooltipContent>
        </Tooltip>
      ),
      sortable: true,
      sortValue: (sup: Supplier) => sup.address || '',
      className: 'hidden md:table-cell',
      headerClassName: 'hidden md:table-cell',
      render: (sup: Supplier) => (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex items-center gap-1.5 text-xs text-foreground/70 max-w-[180px] truncate cursor-default">
              <MapPin className="size-3 text-muted-foreground shrink-0" />
              <span className="truncate">{sup.address || '-'}</span>
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[300px]">
            <p>{sup.address || 'Sin dirección registrada'}</p>
          </TooltipContent>
        </Tooltip>
      ),
    },
    {
      key: 'status',
      label: 'Estado',
      sortable: true,
      sortValue: (sup: Supplier) => (sup.isActive ? 1 : 0),
      render: (sup: Supplier) => (
        <Badge
          className={cn(
            'border font-semibold',
            sup.isActive
              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/15 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30'
              : 'bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/15 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30',
          )}
        >
          {sup.isActive ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
    {
      key: 'created',
      label: 'Registro',
      sortable: true,
      sortValue: (sup: Supplier) => new Date(sup.createdAt).getTime(),
      className: 'hidden lg:table-cell',
      headerClassName: 'hidden lg:table-cell',
      render: (sup: Supplier) => (
        <span className="text-xs text-muted-foreground">
          {new Date(sup.createdAt).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      className: 'text-right',
      render: (sup: Supplier) => (
        <div className="flex justify-end gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setViewSupplierId(sup.id)}
              >
                <Eye className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Ver detalle</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setEditingSupplier(sup)}
              >
                <Edit2 className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Editar proveedor</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={() => handleDeleteSupplier(sup)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Eliminar proveedor</p>
            </TooltipContent>
          </Tooltip>
        </div>
      ),
    },
  ]
}
