import { Globe } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/shared/components/ui/card'
import { formatDateTime } from '#/shared/lib/formatters.ts'
import { cn } from '#/shared/lib/utils.ts'

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  UPDATE: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  DELETE: 'bg-red-500/10 text-red-600 border-red-500/20',
  LOGIN: 'bg-violet-500/10 text-violet-600 border-violet-500/20',
  LOGOUT: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
}

interface ActivityTabProps {
  auditLogs: any[]
}

export function ActivityTab({ auditLogs }: ActivityTabProps) {
  return (
    <Card className="rounded-4xl border border-border/10 shadow-xl overflow-hidden bg-card">
      <CardHeader className="border-b dark:border-white/5 border-black/5 bg-muted/10 px-6 py-5">
        <CardTitle className="flex items-center gap-2 text-lg font-black tracking-tight">
          <Globe className="size-4 text-primary" />
          Actividad reciente
        </CardTitle>
        <CardDescription>
          Registro de acciones realizadas con tu cuenta.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        {auditLogs.length === 0 ? (
          <div className="py-8 rounded-2xl border dark:border-white/4 border-black/4 bg-muted/40 text-center text-sm text-muted-foreground">
            Sin actividad registrada.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative border-l-2 dark:border-white/5 border-black/5 ml-3 pl-6 space-y-5">
              {auditLogs.map((log) => (
                <div key={log.id} className="relative">
                  <div className="absolute left-[-31px] top-0.5 size-4 rounded-full border-2 border-background bg-card flex items-center justify-center">
                    <div className="size-1.5 rounded-full bg-primary" />
                  </div>
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <span className="text-sm font-bold text-foreground">
                        {log.description}
                      </span>
                      <span
                        className={cn(
                          'text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md border text-center self-start sm:self-center',
                          ACTION_COLORS[log.action] ||
                            'bg-muted/10 text-muted-foreground border-muted-20',
                        )}
                      >
                        {log.action}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground font-semibold">
                      <span>{formatDateTime(log.createdAt)}</span>
                      <span className="opacity-30">·</span>
                      <span>IP: {log.ipAddress || '\u2014'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
