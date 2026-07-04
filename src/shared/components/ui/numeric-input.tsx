import type { NumericFormatProps } from 'react-number-format'
import { NumericFormat } from 'react-number-format'
import { cn } from '#/shared/lib/utils.ts'

export interface NumericInputProps extends Omit<
  NumericFormatProps,
  'onChange'
> {
  onChange?: (e: { target: { name?: string; value: string } }) => void
}

export function NumericInput({
  className,
  onChange,
  name,
  ...props
}: NumericInputProps) {
  return (
    <NumericFormat
      thousandSeparator="."
      decimalSeparator=","
      decimalScale={2}
      allowNegative={false}
      data-slot="input"
      className={cn(
        'h-9 w-full min-w-0 rounded-full border border-input bg-transparent px-4 py-1 text-base shadow-xs transition-all duration-150 outline-none selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30',
        'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
        'active:border-ring/70',
        'aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
        className,
      )}
      onValueChange={(values) => {
        if (onChange) {
          onChange({
            target: {
              name,
              value: values.value, // unformatted numeric string, e.g. "1550.5" or "1.550"
            },
          })
        }
      }}
      {...props}
    />
  )
}
