import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '#/shared/lib/utils.ts'

interface TrendBadgeProps {
  value: number
  percent?: number
  size?: 'sm' | 'md'
  showIcon?: boolean
  showPercent?: boolean
  className?: string
}

export function TrendBadge({
  value,
  percent,
  size = 'sm',
  showIcon = true,
  showPercent = false,
  className,
}: TrendBadgeProps) {
  if (value === 0) return null

  const isPositive = value > 0

  const iconSize = size === 'sm' ? 'size-2.5' : 'size-3'
  const Icon = isPositive ? TrendingUp : TrendingDown

  const colorClass = isPositive
    ? 'bg-emerald-500/10 text-emerald-600'
    : 'bg-red-500/10 text-red-600'

  const sizeClass = size === 'sm'
    ? 'text-[8px] px-1.5 py-0 gap-0.5'
    : 'text-xs px-2 py-0.5 gap-1'

  const formattedValue = `${isPositive ? '+' : ''}${value}`
  const formattedPercent = showPercent && percent !== undefined
    ? ` (${percent > 0 ? '+' : ''}${percent}%)`
    : ''

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border-none font-bold shrink-0',
        colorClass,
        sizeClass,
        className,
      )}
    >
      {showIcon && <Icon className={iconSize} />}
      {formattedValue}
      {showPercent && formattedPercent}
    </span>
  )
}
