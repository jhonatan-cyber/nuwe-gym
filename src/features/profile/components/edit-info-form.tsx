import React from 'react'
import { RefreshCw } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/shared/components/ui/card'
import { Button } from '#/shared/components/ui/button'
import { LoadingButton } from '#/shared/components/ui/loading-button'
import { Input } from '#/shared/components/ui/input'
import { Label } from '#/shared/components/ui/label'

interface EditInfoFormProps {
  dbUser: any
  name: string
  setName: (v: string) => void
  phone: string
  setPhone: (v: string) => void
  address: string
  setAddress: (v: string) => void
  isPending: boolean
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
}

export function EditInfoForm({
  dbUser,
  name,
  setName,
  phone,
  setPhone,
  address,
  setAddress,
  isPending,
  onSubmit,
  onCancel,
}: EditInfoFormProps) {
  return (
    <Card className="rounded-4xl border border-border/10 shadow-xl overflow-hidden bg-card">
      <CardHeader className="border-b dark:border-white/5 border-black/5 bg-muted/10 px-6 py-5">
        <CardTitle className="flex items-center gap-2 text-lg font-black tracking-tight">
          <RefreshCw className="size-4 text-primary" />
          Editar Perfil
        </CardTitle>
        <CardDescription>Actualizá tus datos personales.</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-1.5">
            <Label
              htmlFor="name"
              className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1"
            >
              Nombre Completo
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-full"
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label
                htmlFor="phone"
                className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1"
              >
                Teléfono
              </Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="rounded-full"
                placeholder="Ej. +595 981 234 567"
              />
            </div>
            <div className="grid gap-1.5">
              <Label
                htmlFor="email-display"
                className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1"
              >
                Correo Electrónico
              </Label>
              <Input
                id="email-display"
                value={dbUser.email}
                disabled
                className="text-muted-foreground bg-muted/25 border-dashed rounded-full"
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label
              htmlFor="address"
              className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1"
            >
              Dirección
            </Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="rounded-full"
              placeholder="Dirección completa"
            />
          </div>
          <div className="pt-2 flex items-center gap-2">
            <LoadingButton
              type="submit"
              className="rounded-full px-6 font-bold"
              isLoading={isPending}
            >
              Guardar Cambios
            </LoadingButton>
            <Button
              type="button"
              variant="outline"
              className="rounded-full px-6 font-bold"
              onClick={onCancel}
              disabled={isPending}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
