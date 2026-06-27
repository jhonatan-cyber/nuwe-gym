interface ResultsCountProps {
  count: number
  label: string
}

export function ResultsCount({ count, label }: ResultsCountProps) {
  return (
    <div className="flex items-center justify-between mb-5">
      <p className="text-sm font-black tracking-tight">
        {count} {label}
        {count !== 1 ? 's' : ''}
      </p>
    </div>
  )
}
