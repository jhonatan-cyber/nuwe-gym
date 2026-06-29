import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  CreditCard,
  DollarSign,
  Wallet,
  Calendar,
  Users,
  Package,
  User,
  FileText,
} from 'lucide-react'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '#/shared/components/ui/tooltip'
import { getMembershipPayments } from '#/features/membership-payments/server.ts'
import { useCurrentBranch } from '#/shared/hooks/use-current-branch.ts'
import { Card, CardContent } from '#/shared/components/ui/card'
import { Badge } from '#/shared/components/ui/badge'
import { PageHeader } from '#/shared/components/page-header'
import { SearchInput } from '#/shared/components/search-input'
import { DataTable } from '#/shared/components/data-table'
import { formatDateTime } from '#/shared/lib/formatters.ts'

export function MembershipPaymentsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const { branchId } = useCurrentBranch()

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const { data: paymentsList = [], isLoading } = useQuery({
    queryKey: ['membership-payments', branchId],
    queryFn: () => getMembershipPayments({ data: { branchId: branchId ?? undefined } }),
    enabled: !!branchId,
  })

  const filteredPayments = paymentsList.filter(
    (pay: (typeof paymentsList)[number]) => {
      const memberName = pay.member.fullName.toLowerCase()
      return memberName.includes(searchTerm.toLowerCase())
    },
  )

  const totalCollected = filteredPayments.reduce(
    (sum, pay) => sum + Number(pay.amount),
    0,
  )

  const paymentMethodsTotal = filteredPayments.reduce(
    (acc: Record<string, number>, pay: (typeof paymentsList)[number]) => {
      const method = pay.paymentMethod
      acc[method] = (acc[method] || 0) + Number(pay.amount)
      return acc
    },
    {},
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Historial de Pagos de Cuotas"
        description="Listado de pagos de membresías y suscripciones registradas en el sistema."
        icon={<CreditCard className="size-8 text-primary" />}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg text-primary">
              <DollarSign className="size-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">
                Recaudación Total
              </p>
              <h3 className="text-2xl font-bold text-primary">
                ${totalCollected.toFixed(2)}
              </h3>
            </div>
          </CardContent>
        </Card>

        {Object.entries(paymentMethodsTotal).map(
          ([method, total]: [string, number]) => (
            <Card key={method}>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-muted rounded-lg">
                  <Wallet className="size-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">
                    {method}
                  </p>
                  <h3 className="text-2xl font-bold">${total.toFixed(2)}</h3>
                </div>
              </CardContent>
            </Card>
          ),
        )}
      </div>

      <div className="flex gap-4 items-center">
        <SearchInput
          placeholder="Buscar por nombre de socio..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="max-w-sm"
        />
      </div>

      <TooltipProvider delayDuration={200}>
        <DataTable
          columns={[
            {
              key: 'date',
              label: (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-default">Fecha / Hora</span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Fecha y hora en que se registró el pago</p>
                  </TooltipContent>
                </Tooltip>
              ),
              sortable: true,
              sortValue: (pay: (typeof filteredPayments)[number]) =>
                pay.createdAt.getTime(),
              render: (pay: (typeof filteredPayments)[number]) => (
                <span className="inline-flex items-center gap-1.5 text-xs">
                  <Calendar className="size-3 text-muted-foreground" />
                  {formatDateTime(pay.createdAt)}
                </span>
              ),
            },
            {
              key: 'member',
              label: 'Socio',
              sortable: true,
              sortValue: (pay: (typeof filteredPayments)[number]) =>
                pay.member.fullName,
              render: (pay: (typeof filteredPayments)[number]) => (
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <Users className="size-3 text-muted-foreground" />
                  {pay.member.fullName}
                </span>
              ),
            },
            {
              key: 'plan',
              label: (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-default">Paquete</span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Plan o paquete de suscripción asociado al pago</p>
                  </TooltipContent>
                </Tooltip>
              ),
              sortable: true,
              sortValue: (pay: (typeof filteredPayments)[number]) =>
                pay.subscription.package?.name ||
                pay.subscription.plan?.name ||
                '',
              render: (pay: (typeof filteredPayments)[number]) => (
                <span className="inline-flex items-center gap-1.5">
                  <Package className="size-3 text-muted-foreground" />
                  {pay.subscription.package?.name ||
                    pay.subscription.plan?.name ||
                    'N/A'}
                </span>
              ),
            },
            {
              key: 'method',
              label: (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-default">Método de Pago</span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Método utilizado para realizar el pago</p>
                  </TooltipContent>
                </Tooltip>
              ),
              sortable: true,
              sortValue: (pay: (typeof filteredPayments)[number]) =>
                pay.paymentMethod,
              render: (pay: (typeof filteredPayments)[number]) => (
                <Badge
                  variant="outline"
                  className="flex w-fit items-center gap-1"
                >
                  <Wallet className="size-3" /> {pay.paymentMethod}
                </Badge>
              ),
            },
            {
              key: 'amount',
              label: (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-default">Monto</span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Monto pagado por la cuota</p>
                  </TooltipContent>
                </Tooltip>
              ),
              sortable: true,
              sortValue: (pay: (typeof filteredPayments)[number]) =>
                Number(pay.amount),
              render: (pay: (typeof filteredPayments)[number]) => (
                <span className="inline-flex items-center gap-1.5 font-semibold text-primary">
                  <DollarSign className="size-3 text-muted-foreground" />$
                  {Number(pay.amount).toFixed(2)}
                </span>
              ),
            },
            {
              key: 'receivedBy',
              label: (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-default">Recibido por</span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Usuario que registró el pago en el sistema</p>
                  </TooltipContent>
                </Tooltip>
              ),
              sortable: true,
              sortValue: (pay: (typeof filteredPayments)[number]) =>
                pay.createdBy.name,
              render: (pay: (typeof filteredPayments)[number]) => (
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <User className="size-3 text-muted-foreground" />
                  {pay.createdBy.name}
                </span>
              ),
            },
            {
              key: 'notes',
              label: 'Notas',
              sortable: true,
              sortValue: (pay: (typeof filteredPayments)[number]) =>
                pay.notes || '',
              render: (pay: (typeof filteredPayments)[number]) => (
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground max-w-[120px] truncate">
                  <FileText className="size-3 text-muted-foreground shrink-0" />
                  <span className="truncate">{pay.notes || '-'}</span>
                </span>
              ),
            },
          ]}
          data={filteredPayments}
          isLoading={isLoading}
          loadingMessage="Cargando pagos..."
          emptyMessage="No se encontraron pagos."
          keyExtractor={(pay: (typeof filteredPayments)[number]) => pay.id}
        />
      </TooltipProvider>
    </div>
  )
}
