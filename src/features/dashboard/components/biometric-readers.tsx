import { Link } from '@tanstack/react-router'
import { Wifi, ChevronRight } from 'lucide-react'
import { Badge } from '#/shared/components/ui/badge.tsx'

export function BiometricReaders() {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
        Lectores Biométricos
      </p>
      <div className="bg-muted p-4 rounded-2xl border border-border/10 space-y-3">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
            <Wifi className="size-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-sm dark:text-white text-foreground">
                NORTE
              </h4>
              <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] px-1.5 py-0">
                v3.1.2
              </Badge>
            </div>
            <p className="text-[9px] text-muted-foreground truncate">
              SenseFace 3A · 192.168.1.201
            </p>
          </div>
        </div>
        {/* Barra de progreso */}
        <div className="space-y-1">
          <div className="flex justify-between text-[9px] text-muted-foreground">
            <span>Capacidad del canal</span>
            <span className="font-bold text-emerald-400">80%</span>
          </div>
          <div className="h-1.5 w-full dark:bg-white/10 bg-black/10 rounded-full overflow-hidden">
            <div className="h-full bg-linear-to-r from-emerald-400 to-emerald-500 rounded-full w-4/5 transition-all" />
          </div>
        </div>
        <Link
          to="/settings"
          className="text-[10px] text-amber-500 hover:text-amber-400 font-semibold flex items-center gap-1 transition-colors"
        >
          Configurar lector <ChevronRight className="size-3" />
        </Link>
      </div>
    </div>
  )
}
