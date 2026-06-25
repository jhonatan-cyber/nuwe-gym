import { useState, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Link } from '@tanstack/react-router'
import { useTheme } from 'next-themes'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Scan,
  User,
  Camera,
  Building2,
  CheckCircle2,
  X,
  Banknote,
  Smartphone,
  WalletCards,
  List,
  Plus,
} from 'lucide-react'
import { createMember, uploadMemberPhoto } from '#/features/members/server.ts'
import { createSubscription } from '#/features/subscriptions/server.ts'
import { getActivePlans } from '#/features/membership-plans/server.ts'
import { formatCurrency, capitalizeWords } from '#/shared/lib/formatters.ts'

import { Button } from '#/shared/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '#/shared/components/ui/toggle-group'
import { Input } from '#/shared/components/ui/input'
import { Label } from '#/shared/components/ui/label'
import { Dialog, DialogContent } from '#/shared/components/ui/dialog'
import { LoadingButton } from '#/shared/components/ui/loading-button'
import { ModuleLayout } from '#/shared/components/layout/module-layout.tsx'

// ─── Types ───────────────────────────────────────────────────────────────────

interface WizardState {
  firstName: string
  lastName: string
  documentNumber: string
  phone: string
  gender: 'MALE' | 'FEMALE'
  birthDate: string
  photoBase64: string | null
  selectedPlanId: number | null
  paymentMethod: 'CASH' | 'CARD' | 'TRANSFER' | 'QR'
}

interface WizardProps {
  isOpen: boolean
  onClose: () => void
  variant?: 'dialog' | 'inline'
  onRenewalClick?: () => void
}

type Step = 1 | 2 | 3 | 4 | 5

const STEPS = [
  {
    number: 1,
    label: 'Información Personal',
    subtitle: 'Registre los datos de la persona',
  },
  {
    number: 2,
    label: 'Selección de Plan',
    subtitle: 'Elija un plan de inscripción',
  },
  {
    number: 3,
    label: 'Pago de Inscripción',
    subtitle: 'Seleccione un método de pago',
  },
  {
    number: 4,
    label: 'Enrolamiento Facial',
    subtitle: 'Captura Datos Biometricos',
  },
  { number: 5, label: 'Registro Completo', subtitle: 'Guau, estamos aqui' },
] as const

const PAYMENT_METHODS = [
  { value: 'CASH' as const, label: 'Efectivo', icon: Banknote },
  { value: 'CARD' as const, label: 'Tarjeta', icon: WalletCards },
  { value: 'TRANSFER' as const, label: 'Transferencia', icon: Smartphone },
  { value: 'QR' as const, label: 'QR', icon: Smartphone },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

function getEndDateString(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

// ─── Component ───────────────────────────────────────────────────────────────

export function MemberEnrollmentWizard({
  isOpen,
  onClose,
  variant = 'dialog',
  onRenewalClick,
}: WizardProps) {
  const queryClient = useQueryClient()
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const [step, setStep] = useState<Step>(1)
  const [state, setState] = useState<WizardState>({
    firstName: '',
    lastName: '',
    documentNumber: '',
    phone: '',
    gender: 'MALE',
    birthDate: '',
    photoBase64: null,
    selectedPlanId: null,
    paymentMethod: 'CASH',
  })
  const [errors, setErrors] = useState<
    Partial<Record<keyof WizardState, string>>
  >({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createdMemberName, setCreatedMemberName] = useState('')
  const [createdPlanName, setCreatedPlanName] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)

  function resetWizard() {
    setStep(1)
    setState({
      firstName: '',
      lastName: '',
      documentNumber: '',
      phone: '',
      gender: 'MALE',
      birthDate: '',
      photoBase64: null,
      selectedPlanId: null,
      paymentMethod: 'CASH',
    })
    setErrors({})
    setIsSubmitting(false)
    setCreatedMemberName('')
    setCreatedPlanName('')
  }

  const { data: plans = [] } = useQuery({
    queryKey: ['active-plans'],
    queryFn: () => getActivePlans(),
    enabled: isOpen,
  })

  const selectedPlan = plans.find((p) => p.id === state.selectedPlanId)

  function validateStep(currentStep: Step): boolean {
    const newErrors: Partial<Record<keyof WizardState, string>> = {}

    if (currentStep === 1) {
      if (!state.firstName.trim())
        newErrors.firstName = 'El nombre es obligatorio'
      if (!state.lastName.trim())
        newErrors.lastName = 'El apellido es obligatorio'
      if (!state.documentNumber.trim())
        newErrors.documentNumber = 'El documento es obligatorio'
    }

    if (currentStep === 2) {
      if (!state.selectedPlanId) newErrors.selectedPlanId = 'Seleccioná un plan'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit() {
    if (!selectedPlan) return
    setIsSubmitting(true)

    try {
      const fullName = `${state.firstName.trim()} ${state.lastName.trim()}`
      const member = await createMember({
        data: {
          fullName,
          documentNumber: state.documentNumber,
          phone: state.phone || undefined,
          birthDate: state.birthDate || undefined,
        },
      })

      if (state.photoBase64) {
        await uploadMemberPhoto({
          data: { memberId: member.id, photoBase64: state.photoBase64 },
        })
      }

      const price = selectedPlan.price.toString()
      await createSubscription({
        data: {
          memberId: member.id,
          planId: selectedPlan.id,
          startDate: getTodayString(),
          endDate: getEndDateString(selectedPlan.durationDays),
          amountPaid: price,
          paymentMethod: state.paymentMethod,
        },
      })

      setCreatedMemberName(member.fullName)
      setCreatedPlanName(selectedPlan.name)

      queryClient.invalidateQueries({ queryKey: ['members'] })
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })

      setStep(5)
      toast.success('Socio registrado exitosamente')
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Error al registrar el socio'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  function goNext() {
    if (step === 5) return
    if (!validateStep(step)) return
    if (step === 3) {
      handleSubmit()
      return
    }
    setStep((s) => Math.min(s + 1, 5) as Step)
  }

  function goBack() {
    if (step === 1) return
    setStep((s) => Math.max(s - 1, 1) as Step)
  }

  function handleClose() {
    resetWizard()
    onClose()
  }

  // ── Dashboard-style renderers ─────────────────────────────────────────

  function renderSidebar(insideLayout = false) {
    const content = (
      <>
        {/* ambient glow */}
        <div className="absolute -top-20 -left-20 size-48 dark:bg-white/[0.04] bg-black/[0.02] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-10 size-64 dark:bg-white/[0.02] bg-black/[0.01] rounded-full blur-3xl pointer-events-none" />

        {/* close */}
        {variant !== 'inline' && (
          <Button
            size="icon"
            variant="ghost"
            onClick={handleClose}
            className="absolute top-4 right-4 z-10"
          >
            <X className="size-4" />
          </Button>
        )}

        {/* View Toggle */}
        <div className="mb-6 z-10 w-full">
          <ToggleGroup
            type="single"
            value="enroll"
            onValueChange={(v) => {
              if (v === 'list') handleClose()
            }}
          >
            <ToggleGroupItem value="list">
              <List className="size-3.5" /> Listado
            </ToggleGroupItem>
            <ToggleGroupItem value="enroll">
              <Plus className="size-3.5" /> Inscripción
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Brand Logo */}
        <div className="flex justify-center z-10 w-full">
          <img
            src={isDark ? '/logo-dark.png' : '/logo-ligth.png'}
            alt="Trainix Logo"
            className="h-32 w-auto object-contain select-none pointer-events-none"
          />
        </div>

        {/* stepper */}
        <nav className="flex-1 space-y-5 z-10">
          {STEPS.map((s, idx) => {
            const isActive = step === s.number
            const isCompleted = step > s.number
            return (
              <div
                key={s.number}
                className="flex items-start gap-4 relative pb-2"
              >
                {idx < STEPS.length - 1 && (
                  <div
                    className={`absolute left-[18px] top-10 bottom-0 w-0.5 -translate-x-1/2 rounded-full transition-colors duration-300 ${
                      isCompleted
                        ? 'bg-foreground'
                        : 'dark:bg-white/10 bg-black/10'
                    }`}
                  />
                )}

                {/* step bullet */}
                <div
                  className={`relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-black transition-all duration-300 border-2 ${
                    isActive
                      ? 'bg-foreground border-foreground text-primary-foreground shadow-lg shadow-foreground/10 scale-105'
                      : isCompleted
                        ? 'bg-foreground/10 border-foreground/20 text-foreground'
                        : 'bg-black/[0.02] dark:bg-white/[0.02] text-muted-foreground/60 dark:border-white/10 border-black/10'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="size-4 stroke-[3]" />
                  ) : (
                    <span className="text-sm font-bold">{s.number}</span>
                  )}
                </div>

                {/* label */}
                <div className="pt-1 flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`text-sm font-bold leading-tight transition-colors duration-300 ${
                        isActive
                          ? 'text-foreground font-black'
                          : isCompleted
                            ? 'text-muted-foreground hover:text-foreground'
                            : 'text-muted-foreground/60'
                      }`}
                    >
                      {s.label}
                    </p>
                    {isActive && (
                      <span className="size-2 rounded-full bg-foreground animate-pulse shrink-0 shadow-sm" />
                    )}
                  </div>
                  <p className="text-[10px] font-medium text-muted-foreground/50 mt-0.5 truncate">
                    {s.subtitle}
                  </p>
                </div>
              </div>
            )
          })}
        </nav>
      </>
    )

    if (insideLayout) {
      return content
    }

    return (
      <div className="w-[300px] shrink-0 bg-card/80 backdrop-blur-md p-6 relative h-fit flex flex-col rounded-[2rem] overflow-hidden shadow-xl border border-border/10">
        {content}
      </div>
    )
  }

  function renderStepIndicator() {
    return (
      <div className="flex items-center gap-1.5 mb-5">
        {STEPS.map((s) => (
          <div
            key={s.number}
            className={`h-1 rounded-full transition-all flex-1 ${
              s.number <= step
                ? 'bg-gray-900 dark:bg-white'
                : 'bg-gray-200 dark:bg-white/10'
            }`}
          />
        ))}
      </div>
    )
  }

  // ── Step 1 ──────────────────────────────────────────────────────────────

  function renderStep1() {
    return (
      <div>
        {/* "¿Ya eres miembro? Renovación" link */}
        <div className="flex justify-end mb-4">
          <span className="text-xs text-muted-foreground">
            ¿Ya eres miembro?{' '}
            {onRenewalClick ? (
              <Button variant="link" onClick={onRenewalClick} className="text-blue-500 hover:text-blue-600 p-0 h-auto text-xs">
                Renovacion
              </Button>
            ) : (
              <Link
                to="/renewals"
                className="font-bold text-blue-500 hover:text-blue-600 transition-colors"
              >
                Renovacion
              </Link>
            )}
          </span>
        </div>

        {/* Logo */}
        <div className="flex flex-col items-center mb-5">
          <div className="size-20 rounded-full dark:bg-foreground/5 bg-foreground/5 flex items-center justify-center mb-3 overflow-hidden ring-4 ring-foreground/5">
            {state.photoBase64 ? (
              <img
                src={state.photoBase64}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <span
                className="text-4xl font-black text-foreground"
                style={{ fontFamily: 'serif' }}
              >
                V
              </span>
            )}
          </div>
          <h2 className="text-xl font-black tracking-tight dark:text-white text-foreground">
            Datos Persona
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Registre su informacion personal
          </p>
        </div>

        <div className="space-y-3">
          {/* Nombre | Apellido */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                Nombre{' '}
                <span className="size-1.5 rounded-full bg-muted-foreground/50 inline-block" />
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  placeholder="Ingrese Nombre"
                  value={state.firstName}
                  onChange={(e) =>
                    setState({ ...state, firstName: capitalizeWords(e.target.value) })
                  }
                  className={`pl-8 text-sm ${errors.firstName ? 'border-destructive' : ''}`}
                />
              </div>
              {errors.firstName && (
                <p className="text-[10px] font-semibold text-destructive">
                  {errors.firstName}
                </p>
              )}
            </div>

            <div className="grid gap-1.5">
              <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                Apellido{' '}
                <span className="size-1.5 rounded-full bg-muted-foreground/50 inline-block" />
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  placeholder="Escribe apellido"
                  value={state.lastName}
                  onChange={(e) =>
                    setState({ ...state, lastName: capitalizeWords(e.target.value) })
                  }
                  className={`pl-8 text-sm ${errors.lastName ? 'border-destructive' : ''}`}
                />
              </div>
              {errors.lastName && (
                <p className="text-[10px] font-semibold text-destructive">
                  {errors.lastName}
                </p>
              )}
            </div>
          </div>

          {/* Cédula | Género */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                Cédula de Identidad{' '}
                <span className="size-1.5 rounded-full bg-muted-foreground/50 inline-block" />
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <svg
                    className="size-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <rect
                      x="2"
                      y="5"
                      width="20"
                      height="14"
                      rx="2"
                      strokeWidth="2"
                    />
                    <path d="M2 10h20" strokeWidth="2" />
                  </svg>
                </span>
                <Input
                  placeholder="Ingrese CI"
                  value={state.documentNumber}
                  onChange={(e) =>
                    setState({ ...state, documentNumber: e.target.value })
                  }
                  className={`pl-8 text-sm ${errors.documentNumber ? 'border-destructive' : ''}`}
                />
              </div>
              {errors.documentNumber && (
                <p className="text-[10px] font-semibold text-destructive">
                  {errors.documentNumber}
                </p>
              )}
            </div>

            <div className="grid gap-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">
                Género
              </Label>
              <ToggleGroup
                type="single"
                value={state.gender}
                onValueChange={(v) => {
                  if (v) setState({ ...state, gender: v as 'MALE' | 'FEMALE' })
                }}
              >
                <ToggleGroupItem value="MALE">Hombre</ToggleGroupItem>
                <ToggleGroupItem value="FEMALE">Mujer</ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>

          {/* Celular | Fecha Nacimiento */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                Número de Celular{' '}
                <span className="size-1.5 rounded-full bg-muted-foreground/50 inline-block" />
              </Label>
              <div className="flex rounded-full border dark:border-input border-input overflow-hidden h-10 focus-within:ring-1 focus-within:ring-ring">
                <div className="flex items-center px-4 bg-muted/30 border-r dark:border-white/10 border-black/10 shrink-0">
                  <span className="text-sm font-semibold text-muted-foreground whitespace-nowrap">
                    591
                  </span>
                </div>
                <input
                  type="tel"
                  placeholder=""
                  value={state.phone}
                  onChange={(e) =>
                    setState({ ...state, phone: e.target.value })
                  }
                  className="flex-1 bg-transparent px-4 text-sm outline-none text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                Fecha de Nacimiento{' '}
                <span className="size-1.5 rounded-full bg-muted-foreground/50 inline-block" />
              </Label>
              <div className="relative">
                <Input
                  type="date"
                  placeholder="DD/MM/AAAA"
                  value={state.birthDate}
                  onChange={(e) =>
                    setState({ ...state, birthDate: e.target.value })
                  }
                  className="text-sm"
                />
              </div>
            </div>
          </div>

          {/* Foto button */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file) return
                const reader = new FileReader()
                reader.onload = (event) => {
                  setState({
                    ...state,
                    photoBase64: event.target?.result as string,
                  })
                }
                reader.readAsDataURL(file)
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
            >
              {state.photoBase64 ? (
                <>
                  <img
                    src={state.photoBase64}
                    alt="Preview"
                    className="size-5 rounded-full object-cover"
                  />
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

  // ── Step 2 ──────────────────────────────────────────────────────────────

  function renderStep2() {
    return (
      <div>
        <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white mb-1">
          Selección de Plan
        </h2>
        <p className="text-[11px] font-semibold text-gray-400 dark:text-white/40 uppercase tracking-widest mb-6">
          Elegí el tipo de membresía
        </p>

        {plans.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm font-bold text-gray-400 dark:text-white/40">
              No hay planes activos disponibles.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {plans.map((plan) => {
              const isSelected = state.selectedPlanId === plan.id
              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() =>
                    setState({ ...state, selectedPlanId: plan.id })
                  }
                  className={`relative flex items-start gap-4 p-5 rounded-2xl border-2 text-left transition-all duration-200 ${
                    isSelected
                      ? 'bg-gray-900/5 border-gray-900 dark:bg-white/5 dark:border-white shadow-sm'
                      : 'bg-gray-50 border-gray-200 hover:border-gray-300 dark:bg-white/[0.02] dark:border-white/10 dark:hover:border-white/20'
                  }`}
                >
                  {/* radio */}
                  <div
                    className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                      isSelected
                        ? 'border-gray-900 dark:border-white'
                        : 'border-gray-300 dark:border-white/20'
                    }`}
                  >
                    {isSelected && (
                      <div className="size-2.5 rounded-full bg-gray-900 dark:bg-white" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-black text-base text-gray-900 dark:text-white">
                        {plan.name}
                      </h3>
                      <span className="text-xl font-black text-gray-900 dark:text-white shrink-0">
                        {formatCurrency(Number(plan.price))}
                      </span>
                    </div>
                    {plan.description && (
                      <p className="text-xs text-gray-500 dark:text-white/60 mt-1 line-clamp-2">
                        {plan.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-white/10 px-2.5 py-0.5 text-[10px] font-bold text-gray-500 dark:text-white/60 border border-gray-200 dark:border-white/10">
                        <Building2 className="size-3" />
                        {plan.durationDays} días
                      </span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {errors.selectedPlanId && (
          <p className="text-[10px] font-semibold text-destructive mt-2">
            {errors.selectedPlanId}
          </p>
        )}
      </div>
    )
  }

  // ── Step 3 ──────────────────────────────────────────────────────────────

  function renderStep3() {
    return (
      <div>
        <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white mb-1">
          Pago de Inscripción
        </h2>
        <p className="text-[11px] font-semibold text-gray-400 dark:text-white/40 uppercase tracking-widest mb-6">
          Confirmá el monto y método de pago
        </p>

        {/* amount */}
        <div className="rounded-2xl bg-gray-50 dark:bg-white/[0.02] p-6 mb-5 text-center border border-gray-200 dark:border-white/10">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-white/40 mb-2">
            Total a pagar
          </p>
          <p className="text-4xl font-black tracking-tight text-gray-900 dark:text-white">
            {selectedPlan ? formatCurrency(Number(selectedPlan.price)) : '—'}
          </p>
          {selectedPlan && (
            <p className="text-[11px] font-semibold text-gray-400 dark:text-white/40 mt-2">
              Plan {selectedPlan.name} · {selectedPlan.durationDays} días
            </p>
          )}
        </div>

        {/* payment method */}
        <div className="grid gap-2">
          <Label className="text-xs font-bold text-gray-700 dark:text-white/70">
            Método de Pago
          </Label>
          {PAYMENT_METHODS.map((method) => {
            const isSelected = state.paymentMethod === method.value
            const Icon = method.icon
            return (
              <button
                key={method.value}
                type="button"
                onClick={() =>
                  setState({ ...state, paymentMethod: method.value })
                }
                className={`flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition-all ${
                  isSelected
                    ? 'bg-gray-900/5 border-gray-900 dark:bg-white/5 dark:border-white'
                    : 'bg-gray-50 border-gray-200 hover:border-gray-300 dark:bg-white/[0.02] dark:border-white/10 dark:hover:border-white/20'
                }`}
              >
                <div
                  className={`size-9 rounded-xl flex items-center justify-center ${
                    isSelected
                      ? 'bg-gray-900 text-white dark:bg-white dark:text-black'
                      : 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-white/60'
                  }`}
                >
                  <Icon className="size-4" />
                </div>
                <span
                  className={`font-bold text-sm ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-white/40'}`}
                >
                  {method.label}
                </span>
                {isSelected && (
                  <Check className="size-4 ml-auto text-gray-900 dark:text-white" />
                )}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Step 4 ──────────────────────────────────────────────────────────────

  function renderStep4() {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <div className="size-20 rounded-2xl bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10 flex items-center justify-center mb-5">
          <Scan className="size-8 text-gray-500 dark:text-white/60" />
        </div>

        <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white mb-1">
          Enrolamiento Facial
        </h2>
        <p className="text-[11px] font-semibold text-gray-400 dark:text-white/40 uppercase tracking-widest mb-6 max-w-xs">
          Registrará la biometría facial del socio para ingreso rápido y seguro
        </p>

        <div className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/10 p-10 w-full max-w-xs mb-5 bg-gray-50 dark:bg-white/[0.02]">
          <div className="mx-auto size-36 rounded-2xl bg-card border-2 border-gray-200 dark:border-white/10 flex items-center justify-center relative">
            <div className="absolute inset-0 border-2 border-gray-200 dark:border-white/10 rounded-2xl animate-pulse" />
            <Camera className="size-12 text-gray-300 dark:text-white/30" />
          </div>
          <p className="text-[10px] font-bold text-gray-400 dark:text-white/40 mt-4 uppercase tracking-widest">
            Escáner biométrico — Próximamente
          </p>
        </div>
      </div>
    )
  }

  // ── Step 5 ──────────────────────────────────────────────────────────────
  function renderStep5() {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center">
        {/* animated check */}
        <div className="relative mb-5">
          <div className="size-20 rounded-2xl bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10 flex items-center justify-center animate-in zoom-in-50 duration-500">
            <CheckCircle2 className="size-10 text-gray-900 dark:text-white animate-in fade-in duration-700" />
          </div>
          <div className="absolute inset-0 size-20 rounded-2xl bg-gray-200/50 dark:bg-white/10 animate-ping" />
        </div>

        <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white mb-1">
          ¡Registro Completo!
        </h2>
        <p className="text-[11px] font-semibold text-gray-400 dark:text-white/40 uppercase tracking-widest mb-6">
          Socio registrado exitosamente
        </p>

        {/* summary */}
        <div className="w-full max-w-sm rounded-2xl bg-gray-50 dark:bg-white/[0.02] p-5 mb-6 text-left border border-gray-200 dark:border-white/10 space-y-3">
          <div className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-white/10">
            <div className="size-8 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center">
              <User className="size-4 text-gray-500 dark:text-white/60" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-white/40">
                Socio
              </p>
              <p className="font-black text-gray-900 dark:text-white">
                {createdMemberName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-white/10">
            <div className="size-8 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center">
              <Building2 className="size-4 text-gray-500 dark:text-white/60" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-white/40">
                Plan
              </p>
              <p className="font-black text-gray-900 dark:text-white">
                {createdPlanName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center">
              <CreditCard className="size-4 text-gray-500 dark:text-white/60" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-white/40">
                Método de Pago
              </p>
              <p className="font-black text-gray-900 dark:text-white capitalize">
                {state.paymentMethod === 'CASH'
                  ? 'Efectivo'
                  : state.paymentMethod === 'CARD'
                    ? 'Tarjeta'
                    : state.paymentMethod === 'TRANSFER'
                      ? 'Transferencia'
                      : 'QR'}
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={handleClose}
          size="lg"
          className="min-w-[200px] font-black bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:hover:bg-white/90 dark:text-black"
        >
          Finalizar
        </Button>
      </div>
    )
  }

  // ── Router ──────────────────────────────────────────────────────────────

  function renderStepContent() {
    switch (step) {
      case 1:
        return renderStep1()
      case 2:
        return renderStep2()
      case 3:
        return renderStep3()
      case 4:
        return renderStep4()
      case 5:
        return renderStep5()
    }
  }

  function renderFooter() {
    if (step === 5) return null
    const isFirst = step === 1
    const isLast = step === 4
    const isConfirm = step === 3

    return (
      <div className="grid grid-cols-3 items-center pt-5 border-t border-gray-200 dark:border-white/10 mt-5">
        <div className="justify-self-start">
          {!isFirst && (
            <Button
              variant="ghost"
              onClick={goBack}
              disabled={isSubmitting}
              className="text-xs font-bold text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white"
            >
              <ChevronLeft className="size-4 mr-1" /> Anterior
            </Button>
          )}
        </div>

        <div className="justify-self-center">
          {isLast ? (
            <Button
              variant="outline"
              onClick={() => setStep(5)}
              className="text-xs font-bold border-gray-300 dark:border-white/20 dark:text-white"
            >
              Omitir por ahora <ChevronRight className="size-4 ml-1" />
            </Button>
          ) : isConfirm ? (
            <LoadingButton
              onClick={goNext}
              isLoading={isSubmitting}
              loadingText="Registrando..."
              className="font-black bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:hover:bg-black dark:hover:text-white dark:text-black"
            >
              Confirmar y Finalizar <ChevronRight className="size-4 ml-1" />
            </LoadingButton>
          ) : (
            <Button
              onClick={goNext}
              className="font-black bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:hover:bg-black dark:hover:text-white dark:text-black"
            >
              Siguiente <ChevronRight className="size-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    )
  }

  // ── Content wrapper ─────────────────────────────────────────────────────

  function renderWizardContent() {
    if (variant === 'inline') {
      return (
        <ModuleLayout
          breadcrumb={
            <div className="flex items-center gap-1">
              <span
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                onClick={handleClose}
              >
                Inscripciones
              </span>
              <ChevronRight className="size-3 text-muted-foreground/50" />
              <span className="text-foreground">Inscripcion</span>
            </div>
          }
          title="Inscripciones"
          leftPanel={renderSidebar(true)}
        >
          {/* Form card container — centered in remaining space */}
          <div className="flex-1 flex justify-center items-start pt-5">
            <div className="w-full max-w-lg bg-card/60 border border-border/10 rounded-[2rem] shadow-xl overflow-hidden flex flex-col min-h-[580px]">
              <div className="flex-1 p-6 flex flex-col">
                {step < 5 && renderStepIndicator()}
                <div className="flex-1 min-h-0 overflow-y-auto text-gray-900 dark:text-gray-100">
                  {renderStepContent()}
                </div>
                {renderFooter()}
              </div>
            </div>
          </div>
        </ModuleLayout>
      )
    }

    return (
      <div className="flex gap-6 items-start justify-start w-full">
        {/* Sidebar card — independent */}
        {renderSidebar(false)}

        {/* Form card container — centered in remaining space */}
        <div className="flex-1 flex justify-center">
          <div className="w-full max-w-lg bg-card/60 border border-border/10 rounded-[2rem] shadow-xl overflow-hidden flex flex-col min-h-[580px]">
            <div className="flex-1 p-6 flex flex-col">
              {step < 5 && renderStepIndicator()}
              <div className="flex-1 min-h-0 overflow-y-auto text-gray-900 dark:text-gray-100">
                {renderStepContent()}
              </div>
              {renderFooter()}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'inline') {
    return renderWizardContent()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        className="max-w-4xl p-0 gap-0 overflow-hidden rounded-2xl"
        showCloseButton={false}
        onInteractOutside={(e) => e.preventDefault()}
      >
        {renderWizardContent()}
      </DialogContent>
    </Dialog>
  )
}
