import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Download, Users, ShoppingBag, CreditCard, DoorOpen } from 'lucide-react'
import { toast } from 'sonner'

import { LoadingButton } from '#/shared/components/ui/loading-button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/shared/components/ui/card'
import { Input } from '#/shared/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/shared/components/ui/select'
import { downloadCSV } from '#/shared/lib/export-utils.ts'
import {
  exportMembers,
  exportSales,
  exportPayments,
  exportCheckIns,
} from '#/features/export/server.ts'

function today() {
  return new Date().toISOString().slice(0, 10)
}

function MembersCard() {
  const [status, setStatus] = useState('ALL')

  const mutation = useMutation({
    mutationFn: exportMembers,
    onSuccess: (csv) => {
      downloadCSV(csv, `socios-${today()}.csv`)
      toast.success('Socios exportados correctamente')
    },
    onError: () => toast.error('Error al exportar socios'),
  })

  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="size-5 text-muted-foreground" />
          Socios
        </CardTitle>
        <CardDescription>Exportar lista completa de socios</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Estado</label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos</SelectItem>
              <SelectItem value="ACTIVE">Activos</SelectItem>
              <SelectItem value="INACTIVE">Inactivos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <LoadingButton
          className="w-full transition-all duration-200"
          onClick={() =>
            mutation.mutate({ data: { format: 'csv', status: status as 'ACTIVE' | 'INACTIVE' | 'ALL' } })
          }
          isLoading={mutation.isPending}
          loadingText="Exportando..."
        >
          <Download className="size-4" />
          Exportar CSV
        </LoadingButton>
      </CardContent>
    </Card>
  )
}

function SalesCard() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const mutation = useMutation({
    mutationFn: exportSales,
    onSuccess: (csv) => {
      downloadCSV(csv, `ventas-${today()}.csv`)
      toast.success('Ventas exportadas correctamente')
    },
    onError: () => toast.error('Error al exportar ventas'),
  })

  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingBag className="size-5 text-muted-foreground" />
          Ventas
        </CardTitle>
        <CardDescription>Exportar ventas completadas</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Desde</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Hasta</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
        <LoadingButton
          className="w-full transition-all duration-200"
          onClick={() =>
            mutation.mutate({
              data: {
                format: 'csv',
                startDate: startDate || undefined,
                endDate: endDate || undefined,
              },
            })
          }
          isLoading={mutation.isPending}
          loadingText="Exportando..."
        >
          <Download className="size-4" />
          Exportar CSV
        </LoadingButton>
      </CardContent>
    </Card>
  )
}

function PaymentsCard() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const mutation = useMutation({
    mutationFn: exportPayments,
    onSuccess: (csv) => {
      downloadCSV(csv, `pagos-${today()}.csv`)
      toast.success('Pagos exportados correctamente')
    },
    onError: () => toast.error('Error al exportar pagos'),
  })

  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="size-5 text-muted-foreground" />
          Pagos
        </CardTitle>
        <CardDescription>Exportar pagos de membresías</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Desde</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Hasta</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
        <LoadingButton
          className="w-full transition-all duration-200"
          onClick={() =>
            mutation.mutate({
              data: {
                format: 'csv',
                startDate: startDate || undefined,
                endDate: endDate || undefined,
              },
            })
          }
          isLoading={mutation.isPending}
          loadingText="Exportando..."
        >
          <Download className="size-4" />
          Exportar CSV
        </LoadingButton>
      </CardContent>
    </Card>
  )
}

function CheckInsCard() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const mutation = useMutation({
    mutationFn: exportCheckIns,
    onSuccess: (csv) => {
      downloadCSV(csv, `ingresos-${today()}.csv`)
      toast.success('Ingresos exportados correctamente')
    },
    onError: () => toast.error('Error al exportar ingresos'),
  })

  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DoorOpen className="size-5 text-muted-foreground" />
          Ingresos
        </CardTitle>
        <CardDescription>Exportar registros de check-in</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Desde</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Hasta</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
        <LoadingButton
          className="w-full transition-all duration-200"
          onClick={() =>
            mutation.mutate({
              data: {
                format: 'csv',
                startDate: startDate || undefined,
                endDate: endDate || undefined,
              },
            })
          }
          isLoading={mutation.isPending}
          loadingText="Exportando..."
        >
          <Download className="size-4" />
          Exportar CSV
        </LoadingButton>
      </CardContent>
    </Card>
  )
}

export function ExportPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Exportar Datos</h1>
        <p className="text-muted-foreground">
          Descargá tus datos en formato CSV para análisis externo o respaldo.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <MembersCard />
        <SalesCard />
        <PaymentsCard />
        <CheckInsCard />
      </div>
    </div>
  )
}
