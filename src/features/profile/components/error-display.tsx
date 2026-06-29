import { Card, CardContent } from '#/shared/components/ui/card'

interface ErrorDisplayProps {
  message?: string
}

export function ErrorDisplay({ message }: ErrorDisplayProps) {
  return (
    <Card className="rounded-4xl border border-border/10 shadow-xl overflow-hidden">
      <CardContent className="p-12 text-center">
        <p className="text-destructive font-bold mb-2">
          Error al cargar el perfil
        </p>
        <p className="text-sm text-muted-foreground">
          {message || 'Intentalo de nuevo más tarde.'}
        </p>
      </CardContent>
    </Card>
  )
}
