import { cn } from '#/shared/lib/utils.ts'

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        'relative rounded-md bg-accent/60 overflow-hidden',
        'after:absolute after:inset-0 after:animate-shimmer',
        className,
      )}
      {...props}
    />
  )
}

export { Skeleton }
