import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CreditCard, DollarSign, Wallet } from 'lucide-react'
import { getMembershipPayments } from '#/features/membership-payments/server.ts'
import { Card, CardContent } from '#/shared/components/ui/card'
import { Badge } from '#/shared/components/ui/badge'
import { PageHeader } from '#/shared/components/page-header'
import { SearchInput } from '#/shared/components/search-input'
import { DataTable } from '#/shared/components/data-table'
import { formatDateTime } from '#/shared/lib/formatters.ts'

export function MembershipPaymentsPage() {
  const [searchTerm, setSearchTerm] = useState('')

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const { data: paymentsList = [], isLoading } = useQuery({
    queryKey: ['membership-payments'],
    queryFn: () => getMembershipPayments(),
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

      <DataTable
        columns={[
          {
            key: 'date',
            label: 'Fecha / Hora',
            render: (pay: (typeof filteredPayments)[number]) => (
              <span className="text-xs">{formatDateTime(pay.createdAt)}</span>
            ),
          },
          {
            key: 'member',
            label: 'Socio',
            render: (pay: (typeof filteredPayments)[number]) => (
              <span className="font-medium">{pay.member.fullName}</span>
            ),
          },
          {
            key: 'plan',
            label: 'Paquete',
            render: (pay: (typeof filteredPayments)[number]) =>
              pay.subscription.package?.name || pay.subscription.plan?.name || 'N/A',
          },
          {
            key: 'method',
            label: 'Método de Pago',
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
            label: 'Monto',
            render: (pay: (typeof filteredPayments)[number]) => (
              <span className="font-semibold text-primary">
                ${Number(pay.amount).toFixed(2)}
              </span>
            ),
          },
          {
            key: 'receivedBy',
            label: 'Recibido por',
            render: (pay: (typeof filteredPayments)[number]) => (
              <span className="text-xs text-muted-foreground">
                {pay.createdBy.name}
              </span>
            ),
          },
          {
            key: 'notes',
            label: 'Notas',
            render: (pay: (typeof filteredPayments)[number]) => (
              <span className="text-xs text-muted-foreground max-w-[120px] truncate">
                {pay.notes || '-'}
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
    </div>
  )
}
