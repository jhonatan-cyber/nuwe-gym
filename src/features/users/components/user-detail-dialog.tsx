import type { LucideIcon } from 'lucide-react'
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
  Phone,
  MapPin,
  CreditCard,
} from 'lucide-react'
import { Button } from '#/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
} from '#/shared/components/ui/dialog'
import { Badge } from '#/shared/components/ui/badge'
import { ConfirmDialog } from '#/shared/components/ui/confirm-dialog'
import { cn } from '#/shared/lib/utils.ts'
import { formatDate, formatDateTime, formatRelativeTime } from '#/shared/lib/formatters.ts'
import { ROLE_LABELS } from '#/features/users/types.ts'
import { useUserDetailDialog } from '#/features/users/hooks/use-user-detail-dialog.ts'
import { ResetPasswordDialog } from '#/features/users/components/reset-password-dialog.tsx'

interface UserDetailDialogProps {
  userId: string | null
  onOpenChange: (open: boolean) => void
}

function parseUserAgent(ua: string | null): {
  browser: string
  os: string
  isMobile: boolean
} {
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

export function UserDetailDialog({
  userId,
  onOpenChange,
}: UserDetailDialogProps) {
  const {
    user,
    userSessions,
    activeSessions,
    auditLogs,
    isLoading,
    revokingSessionId,
    setRevokingSessionId,
    isResetPwOpen,
    setIsResetPwOpen,
    newPassword,
    setNewPassword,
    handleRevokeSession,
    handleConfirmRevoke,
    handleOpenResetPw,
    handleResetPassword,
    isRevoking,
    isResettingPw,
  } = useUserDetailDialog({ userId, onOpenChange })

  return (
    <Dialog
      open={!!userId}
      onOpenChange={(open) => {
        if (!open) onOpenChange(false)
      }}
    >
      <DialogContent className="max-w-2xl max-h-[88vh] flex flex-col p-0 gap-0 overflow-hidden">
        {isLoading ? (
          <div className="py-16 flex items-center justify-center gap-2 text-muted-foreground">
            <RefreshCw className="size-4 animate-spin text-primary" />
            <span className="text-sm">Cargando datos del usuario...</span>
          </div>
        ) : user ? (
          <>
            {/* ── Hero header ── */}
            <div className="relative overflow-hidden px-6 pt-6 pb-5 border-b dark:border-white/5 border-black/5 shrink-0">
              <div className="absolute inset-0 bg-linear-to-br from-foreground/3 to-transparent pointer-events-none" />
              <div className="relative flex items-center gap-4">
                {/* Avatar */}
                <div className="size-14 rounded-2xl bg-linear-to-br from-primary/20 to-primary/5 border border-primary/10 flex items-center justify-center font-black text-xl uppercase shrink-0 text-primary tracking-wider shadow-inner select-none">
                  {user.name
                    .split(' ')
                    .filter(Boolean)
                    .map((n: string) => n[0])
                    .slice(0, 2)
                    .join('')}
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
                      {ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] ||
                        user.role}
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
                    className="flex items-center gap-1.5 text-xs h-8 rounded-full"
                    onClick={handleOpenResetPw}
                  >
                    <Key className="size-3.5" />
                    Resetear Contraseña
                  </Button>
                </div>
              </div>
            </div>

            {/* ── Body ── */}
            <div className="flex-1 overflow-x-hidden overflow-y-auto scrollbar-none px-6 py-5 space-y-6">
              {/* Datos del usuario */}
              <section>
                <SectionTitle icon={User} label="Información" />
                <div className="grid grid-cols-2 gap-x-6 gap-y-4 mt-3">
                  <DataRow icon={User} label="Nombre" value={user.name} />
                  <DataRow
                    icon={CreditCard}
                    label="CI"
                    value={user.documentNumber || '—'}
                  />
                  <DataRow icon={Mail} label="Email" value={user.email} />
                  <DataRow
                    icon={Phone}
                    label="Teléfono"
                    value={user.phone || '—'}
                  />
                  <DataRow
                    icon={MapPin}
                    label="Dirección"
                    value={user.address || '—'}
                  />
                  <DataRow
                    icon={Shield}
                    label="Rol"
                    value={
                      ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] ||
                      user.role
                    }
                  />
                  <DataRow
                    icon={Calendar}
                    label="Registro"
                    value={formatDate(user.createdAt)}
                  />
                  <DataRow
                    icon={RefreshCw}
                    label="Última actualización"
                    value={formatDate(user.updatedAt)}
                  />
                  <DataRow
                    icon={CircleCheck}
                    label="Email verificado"
                    value={user.emailVerified ? 'Sí' : 'No'}
                  />
                </div>
              </section>

              {/* Sesiones activas */}
              <section>
                <SectionTitle
                  icon={Activity}
                  label={`Sesiones (${activeSessions.length} activas)`}
                />
                {userSessions.length === 0 ? (
                  <div className="mt-3 py-8 rounded-2xl border dark:border-white/4 border-black/4 bg-muted/40 text-center text-sm text-muted-foreground">
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
                              ? 'dark:border-white/6 border-black/6 bg-foreground/2'
                              : 'dark:border-white/3 border-black/3 bg-muted/30 opacity-60',
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
                                  isActive
                                    ? 'bg-emerald-500'
                                    : 'bg-muted-foreground/30',
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
                                  {formatRelativeTime(session.expiresAt)} expira
                                </span>
                              ) : (
                                <span className="text-muted-foreground">
                                  Expirada {formatRelativeTime(session.expiresAt)}
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
                              disabled={isRevoking}
                              onClick={() =>
                                handleRevokeSession(session.id, user.name)
                              }
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
                <SectionTitle
                  icon={Globe}
                  label="Actividad reciente (últimos 50 eventos)"
                />
                {auditLogs.length === 0 ? (
                  <div className="mt-3 py-8 rounded-2xl border dark:border-white/4 border-black/4 bg-muted/40 text-center text-sm text-muted-foreground">
                    Sin actividad registrada.
                  </div>
                ) : (
                  <div className="mt-3 space-y-1">
                    {auditLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-start gap-3 px-4 py-2.5 rounded-xl hover:bg-foreground/2 transition-colors"
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
                                ACTION_COLORS[log.action] ||
                                  'bg-muted text-muted-foreground border-none',
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

        <div className="px-6 py-4 border-t dark:border-white/5 border-black/5 flex justify-center items-center shrink-0 w-full">
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => onOpenChange(false)}
          >
            Cerrar
          </Button>
        </div>
      </DialogContent>

      <ResetPasswordDialog
        open={isResetPwOpen}
        onOpenChange={setIsResetPwOpen}
        newPassword={newPassword}
        onNewPasswordChange={setNewPassword}
        isPending={isResettingPw}
        onSubmit={handleResetPassword}
      />

      <ConfirmDialog
        open={revokingSessionId !== null}
        onOpenChange={(open) => {
          if (!open) setRevokingSessionId(null)
        }}
        title="Cerrar Sesión"
        description="¿Estás seguro de que deseas cerrar esta sesión? El usuario deberá volver a iniciar sesión."
        confirmText="Cerrar Sesión"
        variant="destructive"
        onConfirm={handleConfirmRevoke}
      />
    </Dialog>
  )
}

interface SectionTitleProps {
  icon: LucideIcon
  label: string
}

function SectionTitle({ icon: Icon, label }: SectionTitleProps) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="size-3.5 text-primary" />
      <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </h4>
    </div>
  )
}

interface DataRowProps {
  icon: LucideIcon
  label: string
  value: string
}

function DataRow({ icon: Icon, label, value }: DataRowProps) {
  return (
    <div className="flex items-start gap-2.5 min-w-0">
      <div className="size-6 rounded-md dark:bg-white/5 bg-black/5 border dark:border-white/6 border-black/6 flex items-center justify-center shrink-0 mt-0.5">
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
