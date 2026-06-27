import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  User,
  Mail,
  Shield,
  Calendar,
  Activity,
  Globe,
  Monitor,
  Smartphone,
  Clock,
  RefreshCw,
  LogIn,
  LogOut,
  CircleCheck,
  XCircle,
  Key,
  Info,
  Phone,
  MapPin,
  CreditCard,
} from 'lucide-react'
import { getUserById, revokeSession, resetUserPassword } from '#/features/users/server.ts'
import { Button } from '#/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from '#/shared/components/ui/dialog'
import { Badge } from '#/shared/components/ui/badge'
import { Input } from '#/shared/components/ui/input'
import { ConfirmDialog } from '#/shared/components/ui/confirm-dialog'
import {
  Dialog as SubDialog,
  DialogContent as SubDialogContent,
  DialogHeader as SubDialogHeader,
  DialogTitle as SubDialogTitle,
  DialogFooter as SubDialogFooter,
} from '#/shared/components/ui/dialog'
import { cn } from '#/shared/lib/utils.ts'
import { ROLE_LABELS } from '#/features/users/types.ts'

interface UserDetailDialogProps {
  userId: string | null
  onOpenChange: (open: boolean) => void
}

function formatDate(date: Date | string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatDateTime(date: Date | string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatTimeAgo(date: Date | string | null) {
  if (!date) return ''
  const now = new Date()
  const d = new Date(date)
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Ahora'
  if (diffMins < 60) return `Hace ${diffMins}min`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `Hace ${diffHours}h`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `Hace ${diffDays}d`
  return formatDate(date)
}

function parseUserAgent(ua: string | null): { browser: string; os: string; isMobile: boolean } {
  if (!ua) return { browser: '—', os: '—', isMobile: false }
  const isMobile = /mobile|android|iphone|ipad/i.test(ua)
  let browser = '—'
  if (ua.includes('Chrome')) browser = 'Chrome'
  else if (ua.includes('Firefox')) browser = 'Firefox'
  else if (ua.includes('Safari')) browser = 'Safari'
  else if (ua.includes('Edge')) browser = 'Edge'
  let os = '—'
  if (ua.includes('Windows')) os = 'Windows'
  else if (ua.includes('Mac')) os = 'macOS'
  else if (ua.includes('Linux')) os = 'Linux'
  else if (ua.includes('Android')) os = 'Android'
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS'
  return { browser, os, isMobile }
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  UPDATE: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  DELETE: 'bg-red-500/10 text-red-600 border-red-500/20',
  LOGIN: 'bg-violet-500/10 text-violet-600 border-violet-500/20',
  LOGOUT: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
}

export function UserDetailDialog({ userId, onOpenChange }: UserDetailDialogProps) {
  const queryClient = useQueryClient()

  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null)
  const [revokingUserName, setRevokingUserName] = useState<string>('')
  const [isResetPwOpen, setIsResetPwOpen] = useState(false)
  const [newPassword, setNewPassword] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['user-detail', userId],
    queryFn: () => getUserById({ data: userId! }),
    enabled: !!userId,
    refetchOnMount: true,
  })

  const revokeMutation = useMutation({
    mutationFn: revokeSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-detail', userId] })
      setRevokingSessionId(null)
      toast.success('Sesión cerrada correctamente')
    },
    onError: (err: Error) => toast.error(err.message || 'Error al cerrar la sesión'),
  })

  function handleRevokeSession(sessionId: string, userName: string) {
    setRevokingSessionId(sessionId)
    setRevokingUserName(userName)
  }

  const resetPwMutation = useMutation({
    mutationFn: resetUserPassword,
    onSuccess: () => {
      setIsResetPwOpen(false)
      setNewPassword('')
      toast.success('Contraseña reseteada correctamente')
    },
    onError: (err: Error) => toast.error(err.message || 'Error al resetear la contraseña'),
  })

  function handleConfirmRevoke() {
    if (revokingSessionId) {
      revokeMutation.mutate({
        data: {
          sessionId: revokingSessionId,
          userName: revokingUserName,
        },
      })
    }
  }

  function handleOpenResetPw() {
    setNewPassword('')
    setIsResetPwOpen(true)
  }

  function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !newPassword.trim()) return
    resetPwMutation.mutate({ data: { userId: user.id, newPassword: newPassword.trim() } })
  }

  const user = data?.user
  const userSessions = data?.sessions ?? []
  const auditLogs = data?.auditLogs ?? []

  const activeSessions = userSessions.filter(
    (s) => new Date(s.expiresAt) > new Date(),
  )

  return (
    <Dialog
      open={!!userId}
      onOpenChange={(open) => { if (!open) onOpenChange(false) }}
    >
      <DialogContent className="max-w-2xl max-h-[88vh] overflow-x-hidden overflow-y-auto scrollbar-none p-0 gap-0">
        {isLoading ? (
          <div className="py-16 flex items-center justify-center gap-2 text-muted-foreground">
            <RefreshCw className="size-4 animate-spin text-primary" />
            <span className="text-sm">Cargando datos del usuario...</span>
          </div>
        ) : user ? (
          <>
            {/* ── Hero header ── */}
            <div className="relative overflow-hidden px-6 pt-6 pb-5 border-b dark:border-white/[0.05] border-black/[0.05]">
              <div className="absolute inset-0 bg-gradient-to-br from-foreground/[0.03] to-transparent pointer-events-none" />
              <div className="relative flex items-center gap-4">
                {/* Avatar */}
                <div className="size-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10 flex items-center justify-center font-black text-xl uppercase shrink-0 text-primary tracking-wider shadow-inner select-none">
                  {user.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center flex-wrap gap-2 mb-1">
                    <h2 className="text-lg font-black dark:text-white text-foreground tracking-tight leading-none truncate">
                      {user.name}
                    </h2>
                    <Badge
                      className={cn(
                        'font-bold text-[10px] py-0.5 px-2.5 rounded-full select-none shrink-0',
                        'bg-foreground/10 text-foreground border-foreground/20',
                      )}
                    >
                      {ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] || user.role}
                    </Badge>
                  </div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                    {user.email} · Registrado {formatDate(user.createdAt)}
                  </p>
                </div>
                <div className="shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1.5 text-xs h-8"
                    onClick={handleOpenResetPw}
                  >
                    <Key className="size-3.5" />
                    Resetear Contraseña
                  </Button>
                </div>
              </div>
            </div>

            {/* ── Body ── */}
            <div className="px-6 py-5 space-y-6">
              {/* Datos del usuario */}
              <section>
                <SectionTitle icon={User} label="Información" />
                <div className="grid grid-cols-2 gap-x-6 gap-y-4 mt-3">
                  <DataRow icon={User} label="Nombre" value={user.name} />
                  <DataRow icon={CreditCard} label="CI" value={user.documentNumber || '—'} />
                  <DataRow icon={Mail} label="Email" value={user.email} />
                  <DataRow icon={Phone} label="Teléfono" value={user.phone || '—'} />
                  <DataRow icon={MapPin} label="Dirección" value={user.address || '—'} />
                  <DataRow icon={Shield} label="Rol" value={ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] || user.role} />
                  <DataRow icon={Calendar} label="Registro" value={formatDate(user.createdAt)} />
                  <DataRow icon={RefreshCw} label="Última actualización" value={formatDate(user.updatedAt)} />
                  <DataRow icon={CircleCheck} label="Email verificado" value={user.emailVerified ? 'Sí' : 'No'} />
                </div>
              </section>

              {/* Sesiones activas */}
              <section>
                <SectionTitle icon={Activity} label={`Sesiones (${activeSessions.length} activas)`} />
                {userSessions.length === 0 ? (
                  <div className="mt-3 py-8 rounded-2xl border dark:border-white/[0.04] border-black/[0.04] bg-muted/40 text-center text-sm text-muted-foreground">
                    Sin sesiones registradas.
                  </div>
                ) : (
                  <div className="mt-3 space-y-2">
                    {userSessions.map((session) => {
                      const isActive = new Date(session.expiresAt) > new Date()
                      const ua = parseUserAgent(session.userAgent)
                      return (
                        <div
                          key={session.id}
                          className={cn(
                            'flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors',
                            isActive
                              ? 'dark:border-white/[0.06] border-black/[0.06] bg-foreground/[0.02]'
                              : 'dark:border-white/[0.03] border-black/[0.03] bg-muted/30 opacity-60',
                          )}
                        >
                          <div className="size-8 rounded-lg bg-foreground/5 border border-foreground/10 flex items-center justify-center shrink-0">
                            {ua.isMobile ? (
                              <Smartphone className="size-4 text-muted-foreground" />
                            ) : (
                              <Monitor className="size-4 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold truncate">
                                {ua.browser} · {ua.os}
                              </p>
                              <div
                                className={cn(
                                  'size-1.5 rounded-full shrink-0',
                                  isActive ? 'bg-emerald-500' : 'bg-muted-foreground/30',
                                )}
                              />
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                              {formatDateTime(session.createdAt)}
                              <span className="mx-1 opacity-30">·</span>
                              IP: {session.ipAddress || '—'}
                              <span className="mx-1 opacity-30">·</span>
                              {isActive ? (
                                <span className="text-emerald-500 font-semibold">
                                  {formatTimeAgo(session.expiresAt)} expira
                                </span>
                              ) : (
                                <span className="text-muted-foreground">
                                  Expirada {formatTimeAgo(session.expiresAt)}
                                </span>
                              )}
                            </p>
                          </div>
                          <Badge
                            className={cn(
                              'text-[9px] font-bold py-0.5 px-2 rounded-full shrink-0',
                              isActive
                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                : 'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20',
                            )}
                          >
                            {isActive ? 'Activa' : 'Expirada'}
                          </Badge>
                          {isActive && (
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="text-red-500 hover:text-red-600 hover:bg-red-50 shrink-0"
                              onClick={() => handleRevokeSession(session.id, user?.name || '')}
                            >
                              <XCircle className="size-3.5" />
                            </Button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>

              {/* Actividad reciente */}
              <section>
                <SectionTitle icon={Globe} label="Actividad reciente (últimos 50 eventos)" />
                {auditLogs.length === 0 ? (
                  <div className="mt-3 py-8 rounded-2xl border dark:border-white/[0.04] border-black/[0.04] bg-muted/40 text-center text-sm text-muted-foreground">
                    Sin actividad registrada.
                  </div>
                ) : (
                  <div className="mt-3 space-y-1">
                    {auditLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-start gap-3 px-4 py-2.5 rounded-xl hover:bg-foreground/[0.02] transition-colors"
                      >
                        <div className="size-6 rounded-md bg-foreground/5 border border-foreground/10 flex items-center justify-center shrink-0 mt-0.5">
                          {log.action === 'LOGIN' ? (
                            <LogIn className="size-3 text-violet-500" />
                          ) : log.action === 'LOGOUT' ? (
                            <LogOut className="size-3 text-gray-500" />
                          ) : (
                            <Activity className="size-3 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge
                              className={cn(
                                'text-[9px] font-bold py-0 px-1.5 rounded shrink-0',
                                ACTION_COLORS[log.action] || 'bg-muted text-muted-foreground border-none',
                              )}
                            >
                              {log.action}
                            </Badge>
                            <span className="text-xs text-muted-foreground font-medium">
                              {log.entityType}
                              {log.entityId != null ? ` #${log.entityId}` : ''}
                            </span>
                          </div>
                          <p className="text-xs text-foreground/80 mt-0.5 line-clamp-2">
                            {log.description}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            <Clock className="size-2.5 inline mr-0.5" />
                            {formatDateTime(log.createdAt)}
                            {log.ipAddress && (
                              <>
                                <span className="mx-1 opacity-30">·</span>
                                IP: {log.ipAddress}
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </>
        ) : (
          <div className="py-12 text-center text-destructive text-sm">
            Error al cargar el usuario
          </div>
        )}

        <DialogFooter className="px-6 py-4 border-t dark:border-white/[0.05] border-black/[0.05]">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Reset Password Dialog */}
      <SubDialog open={isResetPwOpen} onOpenChange={setIsResetPwOpen}>
        <SubDialogContent>
          <SubDialogHeader>
            <SubDialogTitle>Resetear Contraseña</SubDialogTitle>
          </SubDialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Nueva Contraseña</label>
              <Input
                type="text"
                placeholder="Mín. 6 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>
            <div className="bg-amber-500/10 p-3 rounded-lg flex gap-2 text-xs text-amber-800 border border-amber-500/20">
              <Info className="size-5 shrink-0" />
              <span>
                La contraseña debe tener al menos 6 caracteres.
                Recomendamos generar una contraseña segura y compartirla de forma segura con el usuario.
                Todas las sesiones activas del usuario seguirán vigentes.
              </span>
            </div>
            <SubDialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsResetPwOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={resetPwMutation.isPending || newPassword.trim().length < 6}>
                {resetPwMutation.isPending ? 'Reseteando...' : 'Resetear Contraseña'}
              </Button>
            </SubDialogFooter>
          </form>
        </SubDialogContent>
      </SubDialog>

      <ConfirmDialog
        open={revokingSessionId !== null}
        onOpenChange={(open) => { if (!open) setRevokingSessionId(null) }}
        title="Cerrar Sesión"
        description="¿Estás seguro de que deseas cerrar esta sesión? El usuario deberá volver a iniciar sesión."
        confirmText="Cerrar Sesión"
        variant="destructive"
        onConfirm={handleConfirmRevoke}
      />
    </Dialog>
  )
}

function SectionTitle({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="size-3.5 text-primary" />
      <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </h4>
    </div>
  )
}

function DataRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5 min-w-0">
      <div className="size-6 rounded-md dark:bg-white/5 bg-black/5 border dark:border-white/[0.06] border-black/[0.06] flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="size-3 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground leading-none">
          {label}
        </p>
        <p className="font-semibold text-sm mt-0.5 truncate">{value}</p>
      </div>
    </div>
  )
}
