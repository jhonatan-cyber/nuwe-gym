import type { ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '#/shared/components/ui/button.tsx'

interface LoadingButtonProps extends React.ComponentProps<typeof Button> {
  isLoading?: boolean
  loadingText?: string
  children: ReactNode
}

export function LoadingButton({
  isLoading,
  loadingText = 'Procesando...',
  children,
  disabled,
  ...props
}: LoadingButtonProps) {
  return (
    <Button disabled={disabled || isLoading} {...props}>
      {isLoading && <Loader2 className="size-4 animate-spin" />}
      {isLoading && loadingText ? loadingText : children}
    </Button>
  )
}
