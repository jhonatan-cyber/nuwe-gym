import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '#/shared/components/ui/dialog'
import { ToggleGroup, ToggleGroupItem } from '#/shared/components/ui/toggle-group'
import { Skeleton } from '#/shared/components/ui/skeleton'
import { Badge } from '#/shared/components/ui/badge'
import { cn } from '#/shared/lib/utils.ts'
import { getEmployee } from '#/features/employees/server.ts'
import { EMPLOYEE_STATUS_LABELS, EMPLOYEE_STATUS_COLORS } from '#/features/employees/types.ts'
import { PerformanceSection } from './performance-section.tsx'
import { ContractsSection } from './contracts-section.tsx'
import { DocumentsSection } from './documents-section.tsx'
import { Briefcase, TrendingUp, FileText, User, CalendarDays, DollarSign, Phone, Mail, Building2, Banknote } from 'lucide-react'
import { formatDate } from '#/shared/lib/formatters.ts'

interface EmployeeDetailDialogProps {
  employeeId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Tab = 'info' | 'performance' | 'contracts' | 'documents'

export function EmployeeDetailDialog({ employeeId, open, onOpenChange }: EmployeeDetailDialogProps) {
  const [activeTab, setActiveTab] = useState<Tab>('info')

  const { data: employee, isLoading } = useQuery({
    queryKey: ['employee', employeeId],
    queryFn: () => getEmployee({ data: { id: employeeId! } }),
    enabled: !!employeeId,
  })

  const infoRows = employee
    ? [
        { icon: Briefcase, label: 'Cargo', value: employee.position },
        { icon: Building2, label: 'Departamento', value: employee.department || '—' },
        { icon: DollarSign, label: 'Salario', value: employee.baseSalary && Number(employee.baseSalary) > 0 ? `$${Number(employee.baseSalary).toLocaleString()}` : '—' },
        { icon: Banknote, label: 'Frecuencia', value: employee.paymentFrequency === 'MONTHLY' ? 'Mensual' : employee.paymentFrequency === 'BIWEEKLY' ? 'Quincenal' : 'Semanal' },
        { icon: CalendarDays, label: 'Ingreso', value: formatDate(new Date(employee.hireDate)) },
        { icon: Phone, label: 'Teléfono', value: employee.phone || '—' },
        { icon: Mail, label: 'Email', value: employee.email || '—' },
        { icon: User, label: 'Documento', value: employee.documentNumber || '—' },
        { icon: User, label: 'Contacto emergencia', value: employee.emergencyContactName ? `${employee.emergencyContactName} (${employee.emergencyContactPhone ?? ''})` : '—' },
      ]
    : []

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onOpenChange(v); setActiveTab('info') }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-black flex items-center gap-2">
                {employee?.fullName ?? 'Cargando...'}
                {employee && (
                  <Badge variant="outline" className={cn('text-[9px] font-bold uppercase', EMPLOYEE_STATUS_COLORS[employee.status as keyof typeof EMPLOYEE_STATUS_COLORS])}>
                    {EMPLOYEE_STATUS_LABELS[employee.status as keyof typeof EMPLOYEE_STATUS_LABELS]}
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription>
                {employee && <span className="font-mono text-xs">{employee.employeeCode}</span>}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3 p-4">
            <Skeleton className="h-5 w-48 rounded-lg" />
            <Skeleton className="h-9 w-full rounded-2xl" />
            <Skeleton className="h-9 w-full rounded-2xl" />
          </div>
        ) : !employee ? (
          <p className="text-sm text-muted-foreground text-center py-8">Empleado no encontrado.</p>
        ) : (
          <div className="space-y-6">
            <ToggleGroup type="single" value={activeTab} onValueChange={(v) => v && setActiveTab(v as Tab)}>
              <ToggleGroupItem value="info"><User className="size-3.5" /> Info</ToggleGroupItem>
              <ToggleGroupItem value="performance"><TrendingUp className="size-3.5" /> Desempeño</ToggleGroupItem>
              <ToggleGroupItem value="contracts"><FileText className="size-3.5" /> Contratos</ToggleGroupItem>
              <ToggleGroupItem value="documents"><FileText className="size-3.5" /> Documentos</ToggleGroupItem>
            </ToggleGroup>

            {activeTab === 'info' && (
              <div className="grid grid-cols-2 gap-3">
                {infoRows.map((row, i) => (
                  <div key={i} className="flex items-center gap-2 p-3 rounded-xl bg-background/50 border border-border/10">
                    <row.icon className="size-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold uppercase text-muted-foreground">{row.label}</p>
                      <p className="text-xs font-semibold truncate">{row.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'performance' && <PerformanceSection employeeId={employee.id} />}
            {activeTab === 'contracts' && <ContractsSection employeeId={employee.id} />}
            {activeTab === 'documents' && <DocumentsSection employeeId={employee.id} />}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
