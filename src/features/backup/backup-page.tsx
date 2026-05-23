import { useState, useRef } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  Download,
  Upload,
  Database,
  Clock,
  FileJson,
  AlertTriangle,
  Loader2,
  Save,
  Table,
  HardDrive,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '#/shared/components/ui/button'
import { LoadingButton } from '#/shared/components/ui/loading-button'
import { PageHeader } from '#/shared/components/page-header'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/shared/components/ui/card'
import { Badge } from '#/shared/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/shared/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/shared/components/ui/dialog'
import { Skeleton } from '#/shared/components/ui/skeleton'
import {
  exportDatabase,
  importDatabase,
  getBackupInfo,
  saveBackupSettings,
  getBackupSettings,
} from '#/features/backup/server.ts'

function downloadJSON(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const TABLE_LABELS: Record<string, string> = {
  settings: 'Configuración',
  branches: 'Sucursales',
  userBranches: 'Sucursales de usuarios',
  users: 'Usuarios',
  members: 'Socios',
  membershipPlans: 'Planes',
  subscriptions: 'Suscripciones',
  membershipPayments: 'Pagos',
  productCategories: 'Categorías',
  products: 'Productos',
  suppliers: 'Proveedores',
  purchases: 'Compras',
  purchaseItems: 'Items de compras',
  sales: 'Ventas',
  saleItems: 'Items de ventas',
  checkIns: 'Check-ins',
  cashRegisterSessions: 'Sesiones de caja',
  cashMovements: 'Movimientos de caja',
  inventoryMovements: 'Movimientos de inventario',
  notifications: 'Notificaciones',
  classes: 'Clases',
  classSchedules: 'Horarios',
  classBookings: 'Reservas',
  trainerProfiles: 'Entrenadores',
  trainerAssignments: 'Asignaciones',
  trainerAvailability: 'Disponibilidad',
  membershipFreezes: 'Congelamientos',
  auditLogs: 'Auditoría',
}

function ExportSection() {
  const { data: info, isLoading } = useQuery({
    queryKey: ['backup-info'],
    queryFn: () => getBackupInfo(),
  })

  const mutation = useMutation({
    mutationFn: () => exportDatabase({ data: {} }),
    onSuccess: (result) => {
      const dateStr = new Date().toISOString().slice(0, 10)
      downloadJSON(result, `backup-gymmanager-${dateStr}.json`)
      toast.success('Backup exportado correctamente')
    },
    onError: () => toast.error('Error al exportar backup'),
  })

  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="size-5 text-muted-foreground" />
          Exportar Backup
        </CardTitle>
        <CardDescription>
          Descargá un archivo JSON con todos los datos del sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        ) : info ? (
          <div className="rounded-lg border p-3 space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <HardDrive className="size-4" />
              <span>Tamaño estimado: {info.dbSize ?? 'Desconocido'}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Table className="size-4" />
              <span>{Object.keys(info.counts).length} tablas</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Database className="size-4" />
              <span>
                {Object.values(info.counts).reduce((a, b) => a + b, 0).toLocaleString()} registros
                totales
              </span>
            </div>
          </div>
        ) : null}

        <LoadingButton
          className="w-full"
          onClick={() => mutation.mutate()}
          isLoading={mutation.isPending}
          loadingText="Exportando..."
        >
          <Download className="size-4" />
          Exportar Backup
        </LoadingButton>
      </CardContent>
    </Card>
  )
}

function ImportSection() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<Record<string, number> | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const mutation = useMutation({
    mutationFn: (data: Parameters<typeof importDatabase>[0]) => importDatabase(data),
    onSuccess: (counts) => {
      const lines = Object.entries(counts)
        .filter(([, c]) => c > 0)
        .map(([table, c]) => `${TABLE_LABELS[table] ?? table}: ${c}`)
        .join('\n')
      toast.success(`Backup importado correctamente\n${lines}`, { duration: 6000 })
      setFile(null)
      setPreview(null)
      if (fileRef.current) fileRef.current.value = ''
    },
    onError: (err: Error) => toast.error(`Error al importar: ${err.message}`),
  })

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) {
      setFile(null)
      setPreview(null)
      return
    }
    setFile(f)

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string)
        if (!json.data || typeof json.data !== 'object') {
          toast.error('Formato de backup inválido')
          setPreview(null)
          return
        }
        const counts: Record<string, number> = {}
        for (const [key, arr] of Object.entries(json.data)) {
          if (Array.isArray(arr)) counts[key] = arr.length
        }
        setPreview(counts)
      } catch {
        toast.error('El archivo no es un JSON válido')
        setPreview(null)
      }
    }
    reader.readAsText(f)
  }

  function handleImport() {
    setConfirmOpen(false)
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string)
        mutation.mutate({ data: json })
      } catch {
        toast.error('Error al leer el archivo')
      }
    }
    reader.readAsText(file)
  }

  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="size-5 text-muted-foreground" />
          Importar Backup
        </CardTitle>
        <CardDescription>
          Restaurá datos desde un archivo JSON de backup
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          ref={fileRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
        />

        {preview && (
          <div className="rounded-lg border p-3 space-y-1.5">
            <p className="text-sm font-medium flex items-center gap-1.5">
              <FileJson className="size-4" />
              Vista previa
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              {Object.entries(preview).map(([table, count]) => (
                <div key={table} className="flex justify-between">
                  <span className="text-muted-foreground">{TABLE_LABELS[table] ?? table}</span>
                  <Badge variant="outline" className="text-xs font-mono">
                    {count}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button
          className="w-full"
          variant="destructive"
          disabled={!file || mutation.isPending}
          onClick={() => setConfirmOpen(true)}
        >
          {mutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Upload className="size-4" />
          )}
          {mutation.isPending ? 'Importando...' : 'Importar Backup'}
        </Button>

        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="size-5 text-destructive" />
                ¿Confirmar importación?
              </DialogTitle>
              <DialogDescription>
                Esta acción reemplazará TODOS los datos existentes con los datos del backup.
                Esta operación no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            {preview && (
              <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
                <p className="font-medium">Se importarán:</p>
                {Object.entries(preview).filter(([, c]) => c > 0).map(([table, c]) => (
                  <div key={table} className="flex justify-between text-xs">
                    <span>{TABLE_LABELS[table] ?? table}</span>
                    <span className="font-mono">{c.toLocaleString()} registros</span>
                  </div>
                ))}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmOpen(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleImport}>
                Sí, importar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

function AutoBackupSection() {
  const { data: backupSettings, isLoading } = useQuery({
    queryKey: ['backup-settings'],
    queryFn: () => getBackupSettings(),
  })

  const [enabled, setEnabled] = useState(false)
  const [frequency, setFrequency] = useState('weekly')
  const [loaded, setLoaded] = useState(false)

  const mutation = useMutation({
    mutationFn: (data: Parameters<typeof saveBackupSettings>[0]) => saveBackupSettings(data),
    onSuccess: () => {
      toast.success('Preferencias de backup guardadas')
    },
    onError: () => toast.error('Error al guardar preferencias'),
  })

  if (!loaded && backupSettings) {
    setEnabled(backupSettings.backupEnabled ?? false)
    setFrequency(backupSettings.backupFrequency ?? 'weekly')
    setLoaded(true)
  }

  function handleSave() {
    mutation.mutate({
      data: { backupEnabled: enabled, backupFrequency: frequency as 'daily' | 'weekly' | 'monthly' },
    })
  }

  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="size-5 text-muted-foreground" />
          Backup Automático
        </CardTitle>
        <CardDescription>
          Configurá backups programados (requiere configuración manual de cron)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Backup automático</label>
              <Button
                variant={enabled ? 'default' : 'outline'}
                size="sm"
                onClick={() => setEnabled(!enabled)}
                className={enabled ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
              >
                {enabled ? 'Activado' : 'Desactivado'}
              </Button>
            </div>

            {enabled && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Frecuencia</label>
                <Select value={frequency} onValueChange={setFrequency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Diario</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <LoadingButton className="w-full" onClick={handleSave} isLoading={mutation.isPending} loadingText="Guardando...">
              <Save className="size-4" />
              Guardar preferencias
            </LoadingButton>

            <p className="text-xs text-muted-foreground">
              Nota: Esta configuración solo almacena la preferencia. Para que los backups
              automáticos funcionen, se debe configurar una tarea cron en el servidor.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export function BackupPage() {
  const { data: info } = useQuery({
    queryKey: ['backup-info'],
    queryFn: () => getBackupInfo(),
  })

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Backup / Restore"
        description="Exportá e importá respaldos completos de la base de datos"
        icon={<Database className="size-8 text-primary" />}
      />

      {info && (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
          {Object.entries(info.counts)
            .filter(([, c]) => c > 0)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 8)
            .map(([table, c]) => (
              <Card key={table} className="transition-all duration-200 hover:shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground truncate">
                    {TABLE_LABELS[table] ?? table}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{c.toLocaleString()}</p>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <ExportSection />
        <ImportSection />
      </div>

      <AutoBackupSection />
    </div>
  )
}
