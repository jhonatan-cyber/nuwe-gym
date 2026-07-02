import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Smartphone, Monitor, Laptop, Tablet, ShieldCheck, ShieldX, Trash2, Activity } from 'lucide-react'
import { toast } from 'sonner'
import { getUserDevices, toggleTrustDevice, removeDevice } from '#/features/users/device-server.ts'
import { Button } from '#/shared/components/ui/button'
import { Badge } from '#/shared/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '#/shared/components/ui/card'
import { formatRelativeTime } from '#/shared/lib/formatters.ts'
import { cn } from '#/shared/lib/utils.ts'

export function DevicesSection() {
  const queryClient = useQueryClient()

  const { data: devices = [], isLoading } = useQuery({
    queryKey: ['user-devices'],
    queryFn: () => getUserDevices(),
  })

  const trustMutation = useMutation({
    mutationFn: toggleTrustDevice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-devices'] })
      toast.success('Confianza del dispositivo actualizada')
    },
    onError: () => toast.error('Error al actualizar dispositivo'),
  })

  const removeMutation = useMutation({
    mutationFn: removeDevice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-devices'] })
      toast.success('Dispositivo eliminado')
    },
    onError: () => toast.error('Error al eliminar dispositivo'),
  })

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile': return Smartphone
      case 'tablet': return Tablet
      default: return Monitor
    }
  }

  return (
    <Card className="rounded-4xl border border-border/10 shadow-xl overflow-hidden bg-card">
      <CardHeader className="border-b dark:border-white/5 border-black/5 bg-muted/10 px-6 py-5">
        <CardTitle className="flex items-center gap-2 text-lg font-black tracking-tight">
          <Activity className="size-4 text-primary" />
          Dispositivos ({devices.length})
        </CardTitle>
        <CardDescription>
          Dispositivos que iniciaron sesión en tu cuenta.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground animate-pulse">
            Cargando dispositivos...
          </div>
        ) : devices.length === 0 ? (
          <div className="py-8 rounded-2xl border dark:border-white/4 border-black/4 bg-muted/40 text-center text-sm text-muted-foreground">
            Sin dispositivos registrados.
          </div>
        ) : (
          <div className="space-y-2">
            {devices.map((device) => {
              const Icon = getDeviceIcon(device.deviceType ?? 'desktop')
              return (
                <div
                  key={device.id}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors',
                    device.isCurrent
                      ? 'dark:border-emerald-500/20 border-emerald-500/20 bg-emerald-500/5'
                      : 'dark:border-white/6 border-black/6 bg-foreground/2',
                  )}
                >
                  <div className="size-8 rounded-lg bg-foreground/5 border border-foreground/10 flex items-center justify-center shrink-0">
                    <Icon className="size-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold truncate">
                        {device.name || (device.browser ? `${device.browser} · ${device.os}` : 'Dispositivo desconocido')}
                      </p>
                      {device.isCurrent && (
                        <Badge className="text-[9px] font-bold py-0.5 px-2 rounded-full bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shrink-0">
                          Actual
                        </Badge>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {device.os && device.browser ? `${device.os} · ${device.browser}` : ''}
                      {device.ipAddress && ` · IP: ${device.ipAddress}`}
                      {device.lastUsedAt && ` · ${formatRelativeTime(device.lastUsedAt)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className={cn(
                        device.isTrusted ? 'text-emerald-500' : 'text-muted-foreground',
                      )}
                      onClick={() =>
                        trustMutation.mutate({
                          data: { deviceId: device.id, trusted: !device.isTrusted },
                        })
                      }
                      disabled={trustMutation.isPending}
                    >
                      {device.isTrusted ? (
                        <ShieldCheck className="size-3.5" />
                      ) : (
                        <ShieldX className="size-3.5" />
                      )}
                    </Button>
                    {!device.isCurrent && (
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => removeMutation.mutate({ data: { deviceId: device.id } })}
                        disabled={removeMutation.isPending}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
