import type { LucideIcon } from 'lucide-react'

type StatVariant = 'default' | 'emerald' | 'orange' | 'foreground'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  variant?: StatVariant
}

const variantStyles: Record<
  StatVariant,
  { value: string; iconBox: string; icon: string }
> = {
  default: {
    value: 'text-2xl font-black tracking-tight',
    iconBox:
      'dark:bg-white/5 bg-black/5 dark:group-hover:bg-white/10 group-hover:bg-black/10',
    icon: 'text-muted-foreground group-hover:scale-110',
  },
  emerald: {
    value: 'text-2xl font-black text-emerald-500 tracking-tight',
    iconBox: 'bg-emerald-500/10',
    icon: 'text-emerald-500 group-hover:rotate-12',
  },
  orange: {
    value: 'text-2xl font-black text-orange-500 tracking-tight',
    iconBox: 'bg-orange-500/10',
    icon: 'text-orange-500 group-hover:rotate-12',
  },
  foreground: {
    value: 'text-2xl font-black text-foreground tracking-tight',
    iconBox: 'bg-foreground/10',
    icon: 'text-foreground group-hover:-rotate-12',
  },
}

export function StatCard({
  label,
  value,
  icon: Icon,
  variant = 'default',
}: StatCardProps) {
  const styles = variantStyles[variant]
  return (
    <div className="relative overflow-hidden bg-muted/60 p-4.5 rounded-[1.25rem] border border-border/10 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between group">
      <div className="space-y-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">
          {label}
        </p>
        <p className={styles.value}>{value}</p>
      </div>
      <div
        className={`size-10 rounded-xl flex items-center justify-center group-hover:scale-105 transition-all duration-300 shrink-0 ${styles.iconBox}`}
      >
        <Icon
          className={`size-5 transition-transform duration-300 ${styles.icon}`}
        />
      </div>
    </div>
  )
}
