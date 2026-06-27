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
        className={`${sizeMap[size]} rounded-full border-foreground/20 border-t-foreground animate-spin`}
      />
      {label && <p className="text-sm text-muted-foreground">{label}</p>}
    </div>
  )
}
