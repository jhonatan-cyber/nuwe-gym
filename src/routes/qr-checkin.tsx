import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { DoorOpen, CheckCircle2, Scan, User } from 'lucide-react'
import { toast } from 'sonner'
import { processQRCheckIn } from '#/features/qr-codes/server.ts'
import { formatDateTime } from '#/shared/lib/formatters.ts'

import { Button } from '#/shared/components/ui/button'
import { Card, CardContent } from '#/shared/components/ui/card'
import { Input } from '#/shared/components/ui/input'

export const Route = createFileRoute('/qr-checkin')({
  component: QRCheckInPage,
})

function QRCheckInPage() {
  const [qrToken, setQrToken] = useState('')
  const [result, setResult] = useState<{
    memberName: string
    memberPhotoUrl?: string | null
    checkedInAt: Date
  } | null>(null)

  const checkInMutation = useMutation({
    mutationFn: processQRCheckIn,
    onSuccess: (data) => {
      setResult(data)
      toast.success(`¡Bienvenido, ${data.memberName}!`)
      setQrToken('')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al procesar el ingreso')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!qrToken.trim()) return
    setResult(null)
    checkInMutation.mutate({ data: { qrToken: qrToken.trim() } })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex size-16 items-center justify-center rounded-full bg-primary/10 mb-2">
            <DoorOpen className="size-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Control de Ingreso
          </h1>
          <p className="text-muted-foreground">
            Escaneá tu código QR o ingresalo manualmente
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="qrToken"
                  className="text-sm font-medium flex items-center gap-2"
                >
                  <Scan className="size-4" />
                  Código QR
                </label>
                <Input
                  id="qrToken"
                  placeholder="Pegá o escaneá el código QR..."
                  value={qrToken}
                  onChange={(e) => setQrToken(e.target.value)}
                  className="h-12 text-lg text-center font-mono"
                  autoFocus
                  autoComplete="off"
                />
              </div>
              <Button
                type="submit"
                className="w-full h-12 text-lg"
                disabled={checkInMutation.isPending || !qrToken.trim()}
              >
                {checkInMutation.isPending
                  ? 'Procesando...'
                  : 'Registrar Ingreso'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {checkInMutation.isPending && (
          <Card>
            <CardContent className="p-6 text-center">
              <div className="animate-pulse text-muted-foreground">
                Verificando código QR...
              </div>
            </CardContent>
          </Card>
        )}

        {result && (
          <Card className="border-emerald-500/30 bg-emerald-500/5">
            <CardContent className="p-6 text-center space-y-3">
              <div className="inline-flex size-14 items-center justify-center rounded-full bg-emerald-500/15">
                <CheckCircle2 className="size-7 text-emerald-600" />
              </div>
              <div>
                {result.memberPhotoUrl ? (
                  <img
                    src={result.memberPhotoUrl}
                    alt=""
                    className="size-16 rounded-full object-cover mx-auto mb-2"
                  />
                ) : (
                  <div className="size-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
                    <User className="size-8" />
                  </div>
                )}
                <h2 className="text-xl font-bold">{result.memberName}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Ingreso registrado — {formatDateTime(result.checkedInAt)}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
