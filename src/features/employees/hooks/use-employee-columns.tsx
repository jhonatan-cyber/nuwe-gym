import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '#/shared/components/ui/tooltip'
import { Button } from '#/shared/components/ui/button'
import { Badge } from '#/shared/components/ui/badge'
import { cn } from '#/shared/lib/utils.ts'
import { Eye, Pencil, Trash2 } from 'lucide-react'
import {
  EMPLOYEE_STATUS_LABELS,
  EMPLOYEE_STATUS_COLORS,
} from '../types.ts'
import type { Employee } from '../types.ts'

interface UseEmployeeColumnsProps {
  onDetail: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string, name: string) => void
}

export function useEmployeeColumns({
  onDetail,
  onEdit,
  onDelete,
}: UseEmployeeColumnsProps) {
  const columns = [
    {
      key: 'fullName',
      label: 'Nombre',
      render: (emp: Employee) => (
        <span className="font-semibold">{emp.fullName}</span>
      ),
    },
    {
      key: 'position',
      label: 'Cargo',
      render: (emp: Employee) => {
        if (emp.userId) {
          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-block cursor-help">
                    <Badge
                      variant="secondary"
                      className="font-semibold px-2 py-0.5"
                    >
                      {emp.position}
                    </Badge>
                  </span>
                </TooltipTrigger>
                <TooltipContent>Con acceso al sistema</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
        }
        return <span>{emp.position}</span>
      },
    },
    {
      key: 'department',
      label: 'Departamento',
      render: (emp: Employee) => emp.department?.name || '—',
    },
    {
      key: 'status',
      label: 'Estado',
      render: (emp: Employee) => (
        <Badge
          variant="outline"
          className={cn(
            'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5',
            EMPLOYEE_STATUS_COLORS[
              emp.status as keyof typeof EMPLOYEE_STATUS_COLORS
            ],
          )}
        >
          {
            EMPLOYEE_STATUS_LABELS[
              emp.status as keyof typeof EMPLOYEE_STATUS_LABELS
            ]
          }
        </Badge>
      ),
    },
    {
      key: 'baseSalary',
      label: 'Salario',
      render: (emp: Employee) => (
        <span className="font-mono text-xs">
          {emp.baseSalary && Number(emp.baseSalary) > 0
            ? `$${Number(emp.baseSalary).toLocaleString()}`
            : '—'}
        </span>
      ),
    },
    {
      key: 'phone',
      label: 'Teléfono',
      render: (emp: Employee) => emp.phone || '—',
    },
    {
      key: 'actions',
      label: 'Acciones',
      className: 'text-right',
      render: (emp: Employee) => (
        <div className="flex justify-end gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="size-8 rounded-full"
            onClick={() => onDetail(emp.id)}
          >
            <Eye className="size-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="size-8 rounded-full"
            onClick={() => onEdit(emp.id)}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="size-8 rounded-full text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(emp.id, emp.fullName)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ]

  return columns
}
