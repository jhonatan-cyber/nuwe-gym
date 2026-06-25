import * as React from 'react'
import { ToggleGroup as ToggleGroupPrimitive } from 'radix-ui'

import { cn } from '#/shared/lib/utils.ts'

const ToggleGroup = React.forwardRef<
  React.ComponentRef<typeof ToggleGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root>
>(({ className, ...props }, ref) => (
  <ToggleGroupPrimitive.Root
    ref={ref}
    className={cn(
      'flex rounded-full border dark:border-white/10 border-black/10 overflow-hidden h-10 p-1 dark:bg-white/5 bg-black/5 w-full',
      className,
    )}
    {...props}
  />
))
ToggleGroup.displayName = 'ToggleGroup'

const ToggleGroupItem = React.forwardRef<
  React.ComponentRef<typeof ToggleGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item>
>(({ className, ...props }, ref) => (
  <ToggleGroupPrimitive.Item
    ref={ref}
    className={cn(
      'flex-1 text-xs font-bold rounded-full transition-all duration-200 flex items-center justify-center gap-1 data-[state=on]:bg-foreground data-[state=on]:text-primary-foreground data-[state=on]:shadow-md data-[state=on]:shadow-foreground/10 data-[state=off]:bg-transparent data-[state=off]:text-muted-foreground hover:bg-primary hover:text-primary-foreground outline-none cursor-pointer',
      className,
    )}
    {...props}
  />
))
ToggleGroupItem.displayName = 'ToggleGroupItem'

export { ToggleGroup, ToggleGroupItem }
