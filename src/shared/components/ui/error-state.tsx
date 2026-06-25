import { AlertCircle, RefreshCw } from 'lucide-react'
import { Card, CardContent } from '#/shared/components/ui/card.tsx'
import { Button } from '#/shared/components/ui/button.tsx'

interface ErrorStateProps {
  message?: string
  title?: string
  onRetry?: () => void
}

export function ErrorState({
  message,
  title = 'Error al cargar',
  onRetry,
}: ErrorStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="size-12 text-destructive mb-4" />
        <p className="text-lg font-medium">{title}</p>
        {message && (
          <p className="text-sm text-muted-foreground mt-1">{message}</p>
        )}
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={onRetry}
          >
            <RefreshCw className="size-4 mr-2" />
            Reintentar
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
