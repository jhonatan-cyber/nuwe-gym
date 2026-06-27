import { useRef } from 'react'
import { Link } from '@tanstack/react-router'
import { User, Camera } from 'lucide-react'
import { capitalizeWords } from '#/shared/lib/formatters.ts'
import { Button } from '#/shared/components/ui/button'
import { Input } from '#/shared/components/ui/input'
import { Label } from '#/shared/components/ui/label'
import { ToggleGroup, ToggleGroupItem } from '#/shared/components/ui/toggle-group'

export interface PersonalInfoState {
  firstName: string
  lastName: string
  documentNumber: string
  phone: string
  gender: 'MALE' | 'FEMALE'
  birthDate: string
  photoBase64: string | null
}

interface Step1Props {
  state: PersonalInfoState
  errors: Partial<Record<keyof PersonalInfoState, string>>
  onChange: (state: PersonalInfoState) => void
  onRenewalClick?: () => void
}

export function Step1PersonalInfo({ state, errors, onChange, onRenewalClick }: Step1Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      onChange({ ...state, photoBase64: event.target?.result as string })
    }
    reader.readAsDataURL(file)
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <span className="text-xs text-muted-foreground">
          ¿Ya eres miembro?{' '}
          {onRenewalClick ? (
            <Button variant="link" onClick={onRenewalClick} className="text-blue-500 hover:text-blue-600 p-0 h-auto text-xs">
              Renovacion
            </Button>
          ) : (
            <Link to="/renewals" className="font-bold text-blue-500 hover:text-blue-600 transition-colors">
              Renovacion
            </Link>
          )}
        </span>
      </div>
      <div className="flex flex-col items-center mb-5">
        <div className="size-20 rounded-full dark:bg-foreground/5 bg-foreground/5 flex items-center justify-center mb-3 overflow-hidden ring-4 ring-foreground/5">
          {state.photoBase64 ? (
            <img src={state.photoBase64} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-4xl font-black text-foreground" style={{ fontFamily: 'serif' }}>V</span>
          )}
        </div>
        <h2 className="text-xl font-black tracking-tight dark:text-white text-foreground">Datos Persona</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Registre su informacion personal</p>
      </div>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              Nombre <span className="size-1.5 rounded-full bg-muted-foreground/50 inline-block" />
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Ingrese Nombre"
                value={state.firstName}
                onChange={(e) => onChange({ ...state, firstName: capitalizeWords(e.target.value) })}
                className={`pl-8 text-sm ${errors.firstName ? 'border-destructive' : ''}`}
              />
            </div>
            {errors.firstName && <p className="text-[10px] font-semibold text-destructive">{errors.firstName}</p>}
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              Apellido <span className="size-1.5 rounded-full bg-muted-foreground/50 inline-block" />
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Escribe apellido"
                value={state.lastName}
                onChange={(e) => onChange({ ...state, lastName: capitalizeWords(e.target.value) })}
                className={`pl-8 text-sm ${errors.lastName ? 'border-destructive' : ''}`}
              />
            </div>
            {errors.lastName && <p className="text-[10px] font-semibold text-destructive">{errors.lastName}</p>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              Cédula de Identidad <span className="size-1.5 rounded-full bg-muted-foreground/50 inline-block" />
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="2" y="5" width="20" height="14" rx="2" strokeWidth="2" />
                  <path d="M2 10h20" strokeWidth="2" />
                </svg>
              </span>
              <Input
                placeholder="Ingrese CI"
                value={state.documentNumber}
                onChange={(e) => onChange({ ...state, documentNumber: e.target.value })}
                className={`pl-8 text-sm ${errors.documentNumber ? 'border-destructive' : ''}`}
              />
            </div>
            {errors.documentNumber && <p className="text-[10px] font-semibold text-destructive">{errors.documentNumber}</p>}
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">Género</Label>
            <ToggleGroup
              type="single"
              value={state.gender}
              onValueChange={(v) => { if (v) onChange({ ...state, gender: v as 'MALE' | 'FEMALE' }) }}
            >
              <ToggleGroupItem value="MALE">Hombre</ToggleGroupItem>
              <ToggleGroupItem value="FEMALE">Mujer</ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              Número de Celular <span className="size-1.5 rounded-full bg-muted-foreground/50 inline-block" />
            </Label>
            <div className="flex rounded-full border dark:border-input border-input overflow-hidden h-10 focus-within:ring-1 focus-within:ring-ring">
              <div className="flex items-center px-4 bg-muted/30 border-r dark:border-white/10 border-black/10 shrink-0">
                <span className="text-sm font-semibold text-muted-foreground whitespace-nowrap">591</span>
              </div>
              <input
                type="tel"
                placeholder=""
                value={state.phone}
                onChange={(e) => onChange({ ...state, phone: e.target.value })}
                className="flex-1 bg-transparent px-4 text-sm outline-none text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              Fecha de Nacimiento <span className="size-1.5 rounded-full bg-muted-foreground/50 inline-block" />
            </Label>
            <Input
              type="date"
              value={state.birthDate}
              onChange={(e) => onChange({ ...state, birthDate: e.target.value })}
              className="text-sm"
            />
          </div>
        </div>
        <div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full">
            {state.photoBase64 ? (
              <>
                <img src={state.photoBase64} alt="Preview" className="size-5 rounded-full object-cover" />
                <span>Cambiar Foto</span>
              </>
            ) : (
              <>
                <Camera className="size-4" />
                <span>Agregar Foto (Opcional)</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
