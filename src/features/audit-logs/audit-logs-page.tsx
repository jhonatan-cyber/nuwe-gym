import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ScrollText, Search, ChevronLeft, ChevronRight, Filter } from 'lucide-react'
import { getAuditLogs, getAuditSummary } from '#/features/audit-logs/server.ts'
import type { AuditLogRow } from '#/features/audit-logs/server.ts'
import { Button } from '#/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '#/shared/components/ui/card'
import { Input } from '#/shared/components/ui/input'
import { Badge } from '#/shared/components/ui/badge'
import { Skeleton } from '#/shared/components/ui/skeleton'
import { PageHeader } from '#/shared/components/page-header'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/shared/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/shared/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '#/shared/components/ui/dialog'

const ACTION_OPTIONS = [
  { value: '', label: 'Todas las acciones' },
  { value: 'CREATE', label: 'Creación' },
  { value: 'UPDATE', label: 'Actualización' },
  { value: 'DELETE', label: 'Eliminación' },
  { value: 'LOGIN', label: 'Inicio de sesión' },
  { value: 'LOGOUT', label: 'Cierre de sesión' },
  { value: 'EXPORT', label: 'Exportación' },
  { value: 'PRINT', label: 'Impresión' },
  { value: 'RENEW', label: 'Renovación' },
  { value: 'FREEZE', label: 'Congelamiento' },
  { value: 'RESUME', label: 'Reanudación' },
]

const ENTITY_OPTIONS = [
  { value: '', label: 'Todas las entidades' },
  { value: 'MEMBER', label: 'Socio' },
  { value: 'SUBSCRIPTION', label: 'Suscripción' },
  { value: 'PLAN', label: 'Plan' },
  { value: 'PAYMENT', label: 'Pago' },
  { value: 'PRODUCT', label: 'Producto' },
  { value: 'CATEGORY', label: 'Categoría' },
  { value: 'SUPPLIER', label: 'Proveedor' },
  { value: 'PURCHASE', label: 'Compra' },
  { value: 'SALE', label: 'Venta' },
  { value: 'CHECK_IN', label: 'Check-in' },
  { value: 'CASH_REGISTER', label: 'Caja' },
  { value: 'INVENTORY', label: 'Inventario' },
  { value: 'USER', label: 'Usuario' },
  { value: 'SETTING', label: 'Configuración' },
  { value: 'CLASS', label: 'Clase' },
  { value: 'SCHEDULE', label: 'Horario' },
  { value: 'BOOKING', label: 'Reserva' },
  { value: 'TRAINER', label: 'Entrenador' },
  { value: 'NOTIFICATION', label: 'Notificación' },
  { value: 'FREEZE', label: 'Congelamiento' },
]

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-emerald-500/10 text-emerald-600 border-none',
  UPDATE: 'bg-blue-500/10 text-blue-600 border-none',
  DELETE: 'bg-red-500/10 text-red-600 border-none',
  LOGIN: 'bg-violet-500/10 text-violet-600 border-none',
  LOGOUT: 'bg-gray-500/10 text-gray-600 border-none',
  EXPORT: 'bg-amber-500/10 text-amber-600 border-none',
  PRINT: 'bg-cyan-500/10 text-cyan-600 border-none',
  RENEW: 'bg-indigo-500/10 text-indigo-600 border-none',
  FREEZE: 'bg-sky-500/10 text-sky-600 border-none',
  RESUME: 'bg-teal-500/10 text-teal-600 border-none',
}

function formatTimestamp(date: Date | string | null) {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function AuditLogsPage() {
  const [page, setPage] = useState(1)
  const [actionFilter, setActionFilter] = useState('')
  const [entityFilter, setEntityFilter] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedLog, setSelectedLog] = useState<AuditLogRow | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const filters = { action: actionFilter, entityType: entityFilter, userId: userSearch, dateFrom, dateTo, page, pageSize: 25 }

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['audit-summary'],
    queryFn: () => getAuditSummary(),
    refetchInterval: 30_000,
  })

  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: () => getAuditLogs({ data: filters }),
  })

  const logs = logsData?.logs ?? []
  const total = logsData?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / 25))

  function handleRowClick(log: AuditLogRow) {
    setSelectedLog(log)
    setDetailOpen(true)
  }

  function handleSearch() {
    setPage(1)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Auditoría"
        description="Registro detallado de todas las acciones realizadas en el sistema"
        icon={<ScrollText className="size-8 text-primary" />}
      />

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card className="transition-all duration-200 hover:shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Hoy</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-3xl font-bold">{(statsData as { today: number } | undefined)?.today ?? 0}</p>
            )}
          </CardContent>
        </Card>
        <Card className="transition-all duration-200 hover:shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Esta semana</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-3xl font-bold">{(statsData as { week: number } | undefined)?.week ?? 0}</p>
            )}
          </CardContent>
        </Card>
        <Card className="transition-all duration-200 hover:shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Este mes</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-3xl font-bold">{(statsData as { month: number } | undefined)?.month ?? 0}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="transition-all duration-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="size-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Acción</label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Entidad</label>
              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENTITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Usuario</label>
              <Input
                placeholder="ID del usuario"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="h-9 w-40"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Desde</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-9 w-40"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Hasta</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-9 w-40"
              />
            </div>
            <Button onClick={handleSearch} size="sm" className="h-9">
              <Search className="size-4 mr-1" />
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="transition-all duration-200">
        <CardContent className="p-0">
          {logsLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ScrollText className="size-12 mb-3 opacity-30" />
              <p className="text-lg font-medium">No hay registros de auditoría</p>
              <p className="text-sm">No se encontraron acciones que coincidan con los filtros.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-44">Fecha y hora</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Acción</TableHead>
                  <TableHead>Entidad</TableHead>
                  <TableHead className="max-w-md">Descripción</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log: AuditLogRow) => (
                  <TableRow
                    key={log.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleRowClick(log)}
                  >
                    <TableCell className="text-xs">
                      {formatTimestamp(log.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{log.userName ?? '-'}</div>
                      {log.userRole && (
                        <div className="text-xs text-muted-foreground">{log.userRole}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-xs font-semibold ${ACTION_COLORS[log.action] ?? ''}`}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{log.entityType}</div>
                      {log.entityId != null && (
                        <div className="text-xs text-muted-foreground">ID: {log.entityId}</div>
                      )}
                    </TableCell>
                    <TableCell className="max-w-md truncate text-sm">
                      {log.description}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {log.ipAddress ?? '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Página {page} de {totalPages} ({total} registros)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="size-4 mr-1" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
              <ChevronRight className="size-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalle del registro de auditoría</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">ID</p>
                  <p>{selectedLog.id}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Fecha y hora</p>
                  <p>{formatTimestamp(selectedLog.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Usuario</p>
                  <p>{selectedLog.userName ?? '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Rol</p>
                  <p>{selectedLog.userRole ?? '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Acción</p>
                  <Badge className={`text-xs font-semibold ${ACTION_COLORS[selectedLog.action] ?? ''}`}>
                    {selectedLog.action}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Entidad</p>
                  <p>{selectedLog.entityType}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">ID de entidad</p>
                  <p>{selectedLog.entityId != null ? String(selectedLog.entityId) : '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Dirección IP</p>
                  <p className="font-mono">{selectedLog.ipAddress ?? '-'}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Descripción</p>
                <p className="bg-muted rounded-lg p-3">{selectedLog.description}</p>
              </div>
              {selectedLog.details && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Detalles (JSON)</p>
                  <pre className="bg-muted rounded-lg p-3 text-xs overflow-auto max-h-64">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
