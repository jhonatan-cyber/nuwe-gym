import { useState, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Camera, Upload } from 'lucide-react'
import { updateMember, uploadMemberPhoto } from '#/features/members/server.ts'
import { Button } from '#/shared/components/ui/button'
import { LoadingButton } from '#/shared/components/ui/loading-button'
import { Input } from '#/shared/components/ui/input'
import { Label } from '#/shared/components/ui/label'
import { Textarea } from '#/shared/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/shared/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/shared/components/ui/select'
import { Separator } from '#/shared/components/ui/separator'
import type { MemberWithSubscriptions } from '#/features/members/types.ts'

interface MemberEditDialogProps {
  member: MemberWithSubscriptions
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MemberEditDialog({
  member,
  open,
  onOpenChange,
}: MemberEditDialogProps) {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    fullName: member.fullName,
    documentNumber: member.documentNumber || '',
    email: member.email || '',
    phone: member.phone || '',
    birthDate: member.birthDate
      ? new Date(member.birthDate).toISOString().split('T')[0]
      : '',
    emergencyContactName: member.emergencyContactName || '',
    emergencyContactPhone: member.emergencyContactPhone || '',
    address: member.address || '',
    status:
      member.status === 'SUSPENDED'
        ? ('INACTIVE' as const)
        : (member.status),
  })

  const photoMutation = useMutation({
    mutationFn: uploadMemberPhoto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] })
      toast.success('Foto actualizada')
    },
    onError: () => toast.error('Error al subir la foto'),
  })

  const updateMutation = useMutation({
    mutationFn: updateMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] })
      onOpenChange(false)
      toast.success('Datos del socio actualizados')
    },
    onError: () => toast.error('Error al actualizar el socio'),
  })

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      setPhotoPreview(base64)
      photoMutation.mutate({
        data: { memberId: member.id, photoBase64: base64 },
      })
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate({ data: { ...formData, id: member.id } })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Editar Socio</DialogTitle>
            <DialogDescription>
              Actualizá los datos personales y de contacto del miembro.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
            <div className="grid grid-cols-1 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-fullName">Nombre Completo</Label>
                <Input
                  id="edit-fullName"
                  required
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex items-center gap-4 p-3 border rounded-2xl dark:border-white/5 border-black/5">
              {photoPreview || member.photoUrl ? (
                <img
                  src={photoPreview || member.photoUrl || ''}
                  alt=""
                  className="size-16 rounded-full object-cover"
                />
              ) : (
                <div className="size-16 rounded-full dark:bg-white/5 bg-black/5 flex items-center justify-center">
                  <Camera className="size-6 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1">
                <Label className="text-sm font-bold">Foto del Socio</Label>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                  JPG o PNG, max 2MB
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={photoMutation.isPending}
                >
                  <Upload className="size-4 mr-1" />
                  {photoMutation.isPending ? 'Subiendo...' : 'Subir Foto'}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoSelect}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-documentNumber">CI / Documento</Label>
                <Input
                  id="edit-documentNumber"
                  required
                  value={formData.documentNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, documentNumber: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-birthDate">Fecha de Nacimiento</Label>
                <Input
                  id="edit-birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) =>
                    setFormData({ ...formData, birthDate: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-phone">Teléfono</Label>
                <Input
                  id="edit-phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-emergencyContactName">
                  Contacto de Emergencia
                </Label>
                <Input
                  id="edit-emergencyContactName"
                  value={formData.emergencyContactName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      emergencyContactName: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-emergencyContactPhone">
                  Teléfono de Emergencia
                </Label>
                <Input
                  id="edit-emergencyContactPhone"
                  type="tel"
                  value={formData.emergencyContactPhone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      emergencyContactPhone: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-address">Dirección</Label>
              <Textarea
                id="edit-address"
                placeholder="Calle, Ciudad, Provincia"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
              />
            </div>

            <Separator />

            <div className="grid gap-2">
              <Label htmlFor="edit-status">Estado del Perfil</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    status: value as 'ACTIVE' | 'INACTIVE',
                  })
                }
              >
                <SelectTrigger id="edit-status" className="w-full">
                  <SelectValue placeholder="Estado del perfil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Activo</SelectItem>
                  <SelectItem value="INACTIVE">
                    Inactivo (Suspendido)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <LoadingButton
              type="submit"
              isLoading={updateMutation.isPending}
              loadingText="Guardando..."
            >
              Guardar Cambios
            </LoadingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
