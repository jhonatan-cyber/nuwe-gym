import { useState } from 'react'
import { createFileRoute, redirect, Link } from '@tanstack/react-router'
import { ArrowLeft, Mail, CheckCircle2 } from 'lucide-react'
import { Input } from '#/shared/components/ui/input'
import { Label } from '#/shared/components/ui/label'
import { Button } from '#/shared/components/ui/button'
import { authClient } from '#/shared/lib/auth-client.ts'
import { getSession } from '#/shared/lib/server-utils.ts'

export const Route = createFileRoute('/forgot-password')({
  beforeLoad: async () => {
    const session = await getSession()
    if (session) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: ForgotPasswordPage,
})

function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error: err } = await authClient.requestPasswordReset({
        email,
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (err) {
        setError(err.message ?? 'Error al enviar el correo')
        return
      }

      setSent(true)
    } catch {
      setError('Error al enviar el correo. Intente nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm mx-auto text-center space-y-6">
          <div className="flex justify-center">
            <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="size-8 text-primary" />
            </div>
          </div>
          <h1 className="text-xl font-bold">Revisá tu email</h1>
          <p className="text-sm text-muted-foreground">
            Si existe una cuenta con <strong>{email}</strong>, vas a recibir un
            enlace para restablecer tu contraseña.
          </p>
          <p className="text-xs text-muted-foreground">
            ¿No recibiste nada? Revisá la carpeta de spam o{' '}
            <button
              type="button"
              onClick={() => {
                setSent(false)
                setEmail('')
              }}
              className="underline hover:text-foreground transition-colors"
            >
              intentá de nuevo
            </button>
          </p>
          <Link
            to="/login"
            className="block text-sm text-muted-foreground hover:text-foreground underline transition-colors"
          >
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-xl font-bold">¿Olvidaste tu contraseña?</h1>
          <p className="text-sm text-muted-foreground">
            Ingresá tu email y te enviamos un enlace para restablecerla.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-medium text-foreground">
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="admin@gym.local"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 pl-11"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-11 font-semibold"
            disabled={loading || !email.trim()}
          >
            {loading ? 'Enviando...' : 'Enviar enlace'}
          </Button>
        </form>

        <Link
          to="/login"
          className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          Volver al inicio de sesión
        </Link>
      </div>
    </div>
  )
}
