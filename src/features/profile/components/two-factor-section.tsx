import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  Shield,
  ShieldOff,
  Smartphone,
  Copy,
  Check,
  Scan,
  Eye,
  EyeOff,
  ArrowLeft,
} from 'lucide-react'
import { toast } from 'sonner'
import QRCode from 'qrcode'
import { authClient } from '#/shared/lib/auth-client.ts'
import { Button } from '#/shared/components/ui/button'
import { Input } from '#/shared/components/ui/input'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '#/shared/components/ui/card'

interface TwoFactorSectionProps {
  isTwoFactorEnabled: boolean
  onRefresh: () => void
}

type Step = 'idle' | 'ask_password' | 'show_qr' | 'verify' | 'done'

export function TwoFactorSection({
  isTwoFactorEnabled,
  onRefresh,
}: TwoFactorSectionProps) {
  const [step, setStep] = useState<Step>('idle')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [totpCode, setTotpCode] = useState('')
  const [qrData, setQrData] = useState<{ secret: string; uri: string } | null>(
    null,
  )
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const enableMutation = useMutation({
    mutationFn: async (pw: string) => {
      const res = await authClient.twoFactor.enable({ password: pw })
      if (res.error)
        throw new Error(res.error.message || 'Error al activar 2FA')
      return res.data as {
        totpURI: string
        backupCodes: string[]
      } | null
    },
    onSuccess: async (data) => {
      if (data?.totpURI) {
        const secretData = {
          secret: data.totpURI.split('?secret=')[1]?.split('&')[0] ?? '',
          uri:
            data.totpURI ??
            `otpauth://totp/Trainix:${data.totpURI}?secret=${data.totpURI}&issuer=Trainix`,
        }
        setQrData(secretData)

        // Generate QR code image
        try {
          const url = await QRCode.toDataURL(secretData.uri, {
            width: 220,
            margin: 2,
            color: { dark: '#000000', light: '#ffffff' },
          })
          setQrDataUrl(url)
        } catch {
          // fallback: show URI text only
        }

        setStep('show_qr')
      }
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  const verifyMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await authClient.twoFactor.verifyTotp({ code })
      if (res.error)
        throw new Error(res.error.message || 'Código inválido')
      return res.data
    },
    onSuccess: () => {
      setStep('done')
      toast.success('2FA activado correctamente')
      onRefresh()
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  const disableMutation = useMutation({
    mutationFn: async (pw: string) => {
      const res = await authClient.twoFactor.disable({ password: pw })
      if (res.error)
        throw new Error(res.error.message || 'Error al desactivar 2FA')
      return res.data
    },
    onSuccess: () => {
      toast.success('2FA desactivado')
      setStep('idle')
      setPassword('')
      setQrData(null)
      setQrDataUrl(null)
      setTotpCode('')
      onRefresh()
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  const handleCopySecret = () => {
    if (qrData) {
      navigator.clipboard.writeText(qrData.secret)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleStartEnable = () => {
    setPassword('')
    setStep('ask_password')
  }

  const handleConfirmPassword = () => {
    if (!password) {
      toast.error('Ingresá tu contraseña actual')
      return
    }
    enableMutation.mutate(password)
  }

  const handleStartDisable = () => {
    setPassword('')
    setStep('ask_password')
  }

  const handleConfirmDisable = () => {
    if (!password) {
      toast.error('Ingresá tu contraseña actual')
      return
    }
    disableMutation.mutate(password)
  }

  const handleBack = () => {
    setStep('idle')
    setPassword('')
    setTotpCode('')
    setQrData(null)
    setQrDataUrl(null)
  }

  return (
    <Card className="rounded-4xl border border-border/10 shadow-xl overflow-hidden bg-card">
      <CardHeader className="border-b dark:border-white/5 border-black/5 bg-muted/10 px-6 py-5">
        <CardTitle className="flex items-center gap-2 text-lg font-black tracking-tight">
          <Shield className="size-4 text-primary" />
          Autenticación de Dos Factores (2FA)
        </CardTitle>
        <CardDescription>
          Protegé tu cuenta con un código adicional desde tu app de
          autenticación.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {step === 'ask_password' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="h-7 text-xs"
              >
                <ArrowLeft className="size-3.5 mr-1" />
                Volver
              </Button>
            </div>

            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-700">
              Por seguridad, ingresá tu contraseña actual para{' '}
              {isTwoFactorEnabled ? 'desactivar' : 'activar'} la
              autenticación de dos factores.
            </div>

            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Tu contraseña actual"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 pr-10"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    if (isTwoFactorEnabled) {
                      handleConfirmDisable()
                    } else {
                      handleConfirmPassword()
                    }
                  }
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>

            <Button
              onClick={
                isTwoFactorEnabled ? handleConfirmDisable : handleConfirmPassword
              }
              disabled={
                !password ||
                enableMutation.isPending ||
                disableMutation.isPending
              }
              className="w-full text-xs"
            >
              {enableMutation.isPending || disableMutation.isPending
                ? 'Verificando...'
                : `Confirmar y ${isTwoFactorEnabled ? 'desactivar' : 'activar'} 2FA`}
            </Button>
          </div>
        )}

        {isTwoFactorEnabled && step !== 'ask_password' ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <Shield className="size-5 text-emerald-500 shrink-0" />
              <div>
                <p className="font-semibold text-sm text-emerald-600">
                  2FA Activado
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Tu cuenta está protegida con autenticación de dos factores.
                </p>
              </div>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleStartDisable}
              disabled={disableMutation.isPending}
              className="text-xs"
            >
              <ShieldOff className="size-3.5 mr-1.5" />
              {disableMutation.isPending ? 'Desactivando...' : 'Desactivar 2FA'}
            </Button>
          </div>
        ) : step === 'idle' ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <ShieldOff className="size-5 text-amber-500 shrink-0" />
              <div>
                <p className="font-semibold text-sm text-amber-600">
                  2FA Desactivado
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Activá la autenticación de dos factores para mayor seguridad.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={handleStartEnable}
              disabled={enableMutation.isPending}
              className="text-xs"
            >
              <Smartphone className="size-3.5 mr-1.5" />
              {enableMutation.isPending ? 'Generando...' : 'Activar 2FA'}
            </Button>
          </div>
        ) : step === 'show_qr' && qrData ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Scan className="size-4 text-primary" />
              <span>Escaneá el código con tu app de autenticación</span>
            </div>

            <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-white border">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="TOTP QR Code"
                  className="size-52 rounded-lg"
                />
              ) : (
                <div className="size-52 flex items-center justify-center bg-muted/30 rounded-lg">
                  <Smartphone className="size-16 text-muted-foreground/40" />
                </div>
              )}
              <p className="text-[10px] text-muted-foreground text-center max-w-xs">
                Usá Google Authenticator, Authy o cualquier app compatible para
                escanear el código.
              </p>
            </div>

            <div className="space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                O ingresá manualmente esta clave secreta
              </p>
              <div className="flex gap-2">
                <code className="flex-1 px-3 py-2 rounded-lg bg-muted text-xs font-mono truncate">
                  {qrData.secret}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopySecret}
                  className="shrink-0 size-9"
                >
                  {copied ? (
                    <Check className="size-3.5 text-green-600" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium">
                Ingresá el código de 6 dígitos para confirmar
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="000000"
                  value={totpCode}
                  onChange={(e) =>
                    setTotpCode(
                      e.target.value.replace(/\D/g, '').slice(0, 6),
                    )
                  }
                  className="w-32 text-center text-lg font-mono tracking-[0.3em]"
                  maxLength={6}
                  autoFocus
                />
                <Button
                  onClick={() => verifyMutation.mutate(totpCode)}
                  disabled={
                    totpCode.length !== 6 || verifyMutation.isPending
                  }
                >
                  {verifyMutation.isPending ? 'Verificando...' : 'Verificar'}
                </Button>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="text-xs w-full"
            >
              Cancelar
            </Button>
          </div>
        ) : step === 'done' ? (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <Shield className="size-5 text-emerald-500 shrink-0" />
            <div>
              <p className="font-semibold text-sm text-emerald-600">
                ¡2FA Activado!
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                A partir de ahora se te solicitará un código TOTP al iniciar
                sesión.
              </p>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
