import React from 'react'
import { Lock, Info } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/shared/components/ui/card'
import { Button } from '#/shared/components/ui/button'
import { PasswordField } from './password-field'

interface SecurityTabProps {
  currentPassword: string
  setCurrentPassword: (v: string) => void
  newPassword: string
  setNewPassword: (v: string) => void
  confirmPassword: string
  setConfirmPassword: (v: string) => void
  showCurrent: boolean
  setShowCurrent: (v: boolean) => void
  showNew: boolean
  setShowNew: (v: boolean) => void
  showConfirm: boolean
  setShowConfirm: (v: boolean) => void
  isPending: boolean
  onSubmit: (e: React.FormEvent) => void
}

export function SecurityTab({
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  showCurrent,
  setShowCurrent,
  showNew,
  setShowNew,
  showConfirm,
  setShowConfirm,
  isPending,
  onSubmit,
}: SecurityTabProps) {
  return (
    <Card className="rounded-4xl border border-border/10 shadow-xl overflow-hidden bg-card">
      <CardHeader className="border-b dark:border-white/5 border-black/5 bg-muted/10 px-6 py-5">
        <CardTitle className="flex items-center gap-2 text-lg font-black tracking-tight">
          <Lock className="size-4 text-primary" />
          Contraseña
        </CardTitle>
        <CardDescription>
          Cambiá tu contraseña actual por una nueva para proteger tu cuenta.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={onSubmit} className="space-y-4">
          <PasswordField
            id="currentPassword"
            label="Contraseña Actual"
            value={currentPassword}
            onChange={setCurrentPassword}
            show={showCurrent}
            onToggle={setShowCurrent}
            required
          />
          <PasswordField
            id="newPassword"
            label="Nueva Contraseña"
            value={newPassword}
            onChange={setNewPassword}
            show={showNew}
            onToggle={setShowNew}
            required
            minLength={6}
          />
          <PasswordField
            id="confirmPassword"
            label="Confirmar Nueva Contraseña"
            value={confirmPassword}
            onChange={setConfirmPassword}
            show={showConfirm}
            onToggle={setShowConfirm}
            required
          />
          <div className="bg-amber-500/10 p-3 rounded-lg flex gap-2 text-xs text-amber-800 border border-amber-500/20">
            <Info className="size-5 shrink-0" />
            <span>
              La contraseña debe tener al menos 6 caracteres. Recomendamos usar
              una contraseña segura que no hayas usado en otros sitios.
            </span>
          </div>
          <div className="pt-2">
            <Button
              type="submit"
              className="rounded-full px-6 font-bold"
              disabled={isPending}
            >
              {isPending ? 'Cambiando...' : 'Cambiar Contraseña'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
