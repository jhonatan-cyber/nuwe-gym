interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  label?: string
}

const sizeMap = {
  sm: 'size-5 border-[2px]',
  md: 'size-8 border-[3px]',
  lg: 'size-10 border-[3px]',
}

export function LoadingSpinner({ size = 'md', label }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div
        className={`${sizeMap[size]} rounded-full border-foreground/10 border-t-foreground/80 border-l-foreground/40 animate-spin`}
        style={{ animationDuration: '0.7s' }}
      />
      {label && <p className="text-sm text-muted-foreground animate-pulse">{label}</p>}
    </div>
  )
}
