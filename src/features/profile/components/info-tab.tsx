import {
  User,
  CreditCard,
  Mail,
  Phone,
  MapPin,
  Shield,
  Calendar,
  RefreshCw,
  CircleCheck,
  Pencil,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/shared/components/ui/card'
import { Button } from '#/shared/components/ui/button'
import { formatDate } from '#/shared/lib/formatters.ts'
import { DataRow } from './data-row'

interface InfoTabProps {
  dbUser: any
  onEdit: () => void
}

export function InfoTab({ dbUser, onEdit }: InfoTabProps) {
  return (
    <Card className="rounded-4xl border border-border/10 shadow-xl overflow-hidden bg-card">
      <CardHeader className="border-b dark:border-white/5 border-black/5 bg-muted/10 px-6 py-5 flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg font-black tracking-tight">
            <User className="size-4 text-primary" />
            Información Personal
          </CardTitle>
          <CardDescription>
            Tus datos registrados en el sistema.
          </CardDescription>
        </div>
        <Button
          onClick={onEdit}
          variant="outline"
          className="rounded-full flex items-center gap-1.5 text-xs h-8"
        >
          <Pencil className="size-3.5" />
          Editar
        </Button>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          <DataRow icon={User} label="Nombre" value={dbUser.name} />
          <DataRow
            icon={CreditCard}
            label="CI"
            value={dbUser.documentNumber || '\u2014'}
          />
          <DataRow icon={Mail} label="Email" value={dbUser.email} />
          <DataRow
            icon={Phone}
            label="Teléfono"
            value={dbUser.phone || '\u2014'}
          />
          <DataRow
            icon={MapPin}
            label="Dirección"
            value={dbUser.address || '\u2014'}
          />
          <DataRow
            icon={Shield}
            label="Rol"
            value={
              (
                {
                  ADMIN: 'Administrador',
                  RECEPTIONIST: 'Recepcionista',
                  TRAINER: 'Entrenador',
                } as Record<string, string>
              )[dbUser.role] || dbUser.role
            }
          />
          <DataRow
            icon={Calendar}
            label="Registro"
            value={formatDate(dbUser.createdAt)}
          />
          <DataRow
            icon={RefreshCw}
            label="Última actualización"
            value={formatDate(dbUser.updatedAt)}
          />
          <DataRow
            icon={CircleCheck}
            label="Email verificado"
            value={dbUser.emailVerified ? 'Sí' : 'No'}
          />
        </div>
      </CardContent>
    </Card>
  )
}
