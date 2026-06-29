import { Activity, Smartphone, Monitor, XCircle } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/shared/components/ui/card'
import { Badge } from '#/shared/components/ui/badge'
import { Button } from '#/shared/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '#/shared/components/ui/tooltip'
import { formatDateTime, formatRelativeTime } from '#/shared/lib/formatters.ts'
import { cn } from '#/shared/lib/utils.ts'

function parseUserAgent(ua: string | null): {
  browser: string
  os: string
  isMobile: boolean
} {
  if (!ua) return { browser: '\u2014', os: '\u2014', isMobile: false }
  const isMobile = /mobile|android|iphone|ipad/i.test(ua)
  let browser = '\u2014'
  if (ua.includes('Chrome')) browser = 'Chrome'
  else if (ua.includes('Firefox')) browser = 'Firefox'
  else if (ua.includes('Safari')) browser = 'Safari'
  else if (ua.includes('Edge')) browser = 'Edge'
  let os = '\u2014'
  if (ua.includes('Windows')) os = 'Windows'
  else if (ua.includes('Mac')) os = 'macOS'
  else if (ua.includes('Linux')) os = 'Linux'
  else if (ua.includes('Android')) os = 'Android'
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS'
  return { browser, os, isMobile }
}

interface SessionsTabProps {
  userSessions: any[]
  activeSessions: any[]
  onRevoke: (sessionId: string) => void
}

export function SessionsTab({
  userSessions,
  activeSessions,
  onRevoke,
}: SessionsTabProps) {
  return (
    <Card className="rounded-4xl border border-border/10 shadow-xl overflow-hidden bg-card">
      <CardHeader className="border-b dark:border-white/5 border-black/5 bg-muted/10 px-6 py-5">
        <CardTitle className="flex items-center gap-2 text-lg font-black tracking-tight">
          <Activity className="size-4 text-primary" />
          Sesiones ({activeSessions.length} activas)
        </CardTitle>
        <CardDescription>
          Dispositivos y navegadores donde iniciaste sesión.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        {userSessions.length === 0 ? (
          <div className="py-8 rounded-2xl border dark:border-white/4 border-black/4 bg-muted/40 text-center text-sm text-muted-foreground">
            Sin sesiones registradas.
          </div>
        ) : (
          <TooltipProvider delayDuration={200}>
            <div className="space-y-2">
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
                        IP: {session.ipAddress || '\u2014'}
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
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 shrink-0"
                            onClick={() => onRevoke(session.id)}
                          >
                            <XCircle className="size-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Cerrar sesión</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                )
              })}
            </div>
          </TooltipProvider>
        )}
      </CardContent>
    </Card>
  )
}
