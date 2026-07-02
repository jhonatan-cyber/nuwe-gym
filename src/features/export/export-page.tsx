import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  Download,
  FileSpreadsheet,
  Users,
  ShoppingBag,
  CreditCard,
  DoorOpen,
} from 'lucide-react'
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
import { ToggleGroup, ToggleGroupItem } from '#/shared/components/ui/toggle-group'
import { downloadCSV, downloadExcel } from '#/shared/lib/export-utils.ts'
import {
  exportMembers,
  exportSales,
  exportPayments,
  exportCheckIns,
  exportMembersExcel,
  exportSalesExcel,
  exportPaymentsExcel,
  exportCheckInsExcel,
} from '#/features/export/server.ts'

function today() {
  return new Date().toISOString().slice(0, 10)
}

type Format = 'csv' | 'xlsx'

function FormatToggle({ value, onChange }: { value: Format; onChange: (v: Format) => void }) {
  return (
    <ToggleGroup type="single" value={value} onValueChange={(v) => v && onChange(v as Format)}>
      <ToggleGroupItem value="csv" className="text-xs gap-1 px-3">
        <Download className="size-3" /> CSV
      </ToggleGroupItem>
      <ToggleGroupItem value="xlsx" className="text-xs gap-1 px-3">
        <FileSpreadsheet className="size-3" /> Excel
      </ToggleGroupItem>
    </ToggleGroup>
  )
}

function MembersCard() {
  const [status, setStatus] = useState('ALL')
  const [format, setFormat] = useState<Format>('csv')

  const csvMutation = useMutation({
    mutationFn: exportMembers,
    onSuccess: (csv) => {
      downloadCSV(csv, `socios-${today()}.csv`)
      toast.success('Socios exportados')
    },
    onError: () => toast.error('Error al exportar'),
  })

  const xlsxMutation = useMutation({
    mutationFn: exportMembersExcel,
    onSuccess: (b64) => {
      downloadExcel(b64, `socios-${today()}.xlsx`)
      toast.success('Socios exportados')
    },
    onError: () => toast.error('Error al exportar'),
  })

  const mutation = format === 'csv' ? csvMutation : xlsxMutation

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="size-5 text-muted-foreground" />
          Socios
        </CardTitle>
        <CardDescription>Exportar lista completa de socios</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 space-y-1.5">
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
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Formato</label>
            <FormatToggle value={format} onChange={setFormat} />
          </div>
        </div>
        <LoadingButton
          className="w-full"
          onClick={() => {
            if (format === 'csv') {
              csvMutation.mutate({ data: { format: 'csv', status: status as any } })
            } else {
              xlsxMutation.mutate({ data: { status: status as any } })
            }
          }}
          isLoading={mutation.isPending}
          loadingText="Exportando..."
        >
          {format === 'csv' ? <Download className="size-4" /> : <FileSpreadsheet className="size-4" />}
          Exportar {format === 'csv' ? 'CSV' : 'Excel'}
        </LoadingButton>
      </CardContent>
    </Card>
  )
}

function SalesCard() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [format, setFormat] = useState<Format>('csv')

  const csvMutation = useMutation({
    mutationFn: exportSales,
    onSuccess: (csv) => {
      downloadCSV(csv, `ventas-${today()}.csv`)
      toast.success('Ventas exportadas')
    },
    onError: () => toast.error('Error al exportar'),
  })

  const xlsxMutation = useMutation({
    mutationFn: exportSalesExcel,
    onSuccess: (b64) => {
      downloadExcel(b64, `ventas-${today()}.xlsx`)
      toast.success('Ventas exportadas')
    },
    onError: () => toast.error('Error al exportar'),
  })

  const mutation = format === 'csv' ? csvMutation : xlsxMutation

  return (
    <Card>
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
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Hasta</label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end">
          <FormatToggle value={format} onChange={setFormat} />
        </div>
        <LoadingButton
          className="w-full"
          onClick={() => {
            const payload = { startDate: startDate || undefined, endDate: endDate || undefined }
            if (format === 'csv') {
              csvMutation.mutate({ data: { format: 'csv', ...payload } })
            } else {
              xlsxMutation.mutate({ data: payload })
            }
          }}
          isLoading={mutation.isPending}
          loadingText="Exportando..."
        >
          {format === 'csv' ? <Download className="size-4" /> : <FileSpreadsheet className="size-4" />}
          Exportar {format === 'csv' ? 'CSV' : 'Excel'}
        </LoadingButton>
      </CardContent>
    </Card>
  )
}

function PaymentsCard() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [format, setFormat] = useState<Format>('csv')

  const csvMutation = useMutation({
    mutationFn: exportPayments,
    onSuccess: (csv) => {
      downloadCSV(csv, `pagos-${today()}.csv`)
      toast.success('Pagos exportados')
    },
    onError: () => toast.error('Error al exportar'),
  })

  const xlsxMutation = useMutation({
    mutationFn: exportPaymentsExcel,
    onSuccess: (b64) => {
      downloadExcel(b64, `pagos-${today()}.xlsx`)
      toast.success('Pagos exportados')
    },
    onError: () => toast.error('Error al exportar'),
  })

  const mutation = format === 'csv' ? csvMutation : xlsxMutation

  return (
    <Card>
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
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Hasta</label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end">
          <FormatToggle value={format} onChange={setFormat} />
        </div>
        <LoadingButton
          className="w-full"
          onClick={() => {
            const payload = { startDate: startDate || undefined, endDate: endDate || undefined }
            if (format === 'csv') {
              csvMutation.mutate({ data: { format: 'csv', ...payload } })
            } else {
              xlsxMutation.mutate({ data: payload })
            }
          }}
          isLoading={mutation.isPending}
          loadingText="Exportando..."
        >
          {format === 'csv' ? <Download className="size-4" /> : <FileSpreadsheet className="size-4" />}
          Exportar {format === 'csv' ? 'CSV' : 'Excel'}
        </LoadingButton>
      </CardContent>
    </Card>
  )
}

function CheckInsCard() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [format, setFormat] = useState<Format>('csv')

  const csvMutation = useMutation({
    mutationFn: exportCheckIns,
    onSuccess: (csv) => {
      downloadCSV(csv, `ingresos-${today()}.csv`)
      toast.success('Ingresos exportados')
    },
    onError: () => toast.error('Error al exportar'),
  })

  const xlsxMutation = useMutation({
    mutationFn: exportCheckInsExcel,
    onSuccess: (b64) => {
      downloadExcel(b64, `ingresos-${today()}.xlsx`)
      toast.success('Ingresos exportados')
    },
    onError: () => toast.error('Error al exportar'),
  })

  const mutation = format === 'csv' ? csvMutation : xlsxMutation

  return (
    <Card>
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
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Hasta</label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end">
          <FormatToggle value={format} onChange={setFormat} />
        </div>
        <LoadingButton
          className="w-full"
          onClick={() => {
            const payload = { startDate: startDate || undefined, endDate: endDate || undefined }
            if (format === 'csv') {
              csvMutation.mutate({ data: { format: 'csv', ...payload } })
            } else {
              xlsxMutation.mutate({ data: payload })
            }
          }}
          isLoading={mutation.isPending}
          loadingText="Exportando..."
        >
          {format === 'csv' ? <Download className="size-4" /> : <FileSpreadsheet className="size-4" />}
          Exportar {format === 'csv' ? 'CSV' : 'Excel'}
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
          Descargá tus datos en formato CSV o Excel para análisis externo o respaldo.
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
