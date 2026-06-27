import { Link } from '@tanstack/react-router'
import { AlertTriangle, ArrowRight } from 'lucide-react'

interface ExpiringMembershipsBannerProps {
  expiringSoonCount: number
}

export function ExpiringMembershipsBanner({
  expiringSoonCount,
}: ExpiringMembershipsBannerProps) {
  if (expiringSoonCount <= 0) return null

  return (
    <div className="bg-amber-500/8 dark:bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center justify-between animate-in fade-in duration-300">
      <div className="flex items-center gap-3">
        <div className="size-9 rounded-xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
          <AlertTriangle className="size-4" />
        </div>
        <div>
          <p className="font-bold text-amber-600 dark:text-amber-400 text-sm">
            {expiringSoonCount} membresía
            {expiringSoonCount !== 1 ? 's' : ''} próxima
            {expiringSoonCount !== 1 ? 's' : ''} a vencer
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Revisá las renovaciones pendientes para evitar cortes de acceso.
          </p>
        </div>
      </div>
      <Link
        to="/renewals"
        className="shrink-0 flex items-center gap-1 text-xs font-bold text-amber-500 hover:text-amber-600 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl transition-colors"
      >
        Ver <ArrowRight className="size-3" />
      </Link>
    </div>
  )
}
