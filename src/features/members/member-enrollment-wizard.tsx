import { useState, useCallback, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ChevronRight } from 'lucide-react'
import { createMember, uploadMemberPhoto } from '#/features/members/server.ts'
import { createSubscription } from '#/features/subscriptions/server.ts'
import { getActivePackages } from '#/features/packages/server.ts'
import { getSettings } from '#/features/settings/server.ts'
import { formatDate, formatCurrency } from '#/shared/lib/formatters.ts'
import { useCameraCapture } from '#/features/members/hooks/use-camera-capture.ts'
import { Dialog, DialogContent } from '#/shared/components/ui/dialog'
import { ModuleLayout } from '#/shared/components/layout/module-layout.tsx'
import { WizardSidebar } from '#/features/members/components/wizard/wizard-sidebar.tsx'
import { WizardFooter } from '#/features/members/components/wizard/wizard-footer.tsx'
import { Step1PersonalInfo } from '#/features/members/components/wizard/step-1-personal-info.tsx'
import type { PersonalInfoState } from '#/features/members/components/wizard/step-1-personal-info.tsx'
import { Step2PackageSelect } from '#/features/members/components/wizard/step-2-package-select.tsx'
import { Step3Payment } from '#/features/members/components/wizard/step-3-payment.tsx'
import { Step4FacialEnrollment } from '#/features/members/components/wizard/step-4-facial-enrollment.tsx'
import { Step5Complete } from '#/features/members/components/wizard/step-5-complete.tsx'

type Step = 1 | 2 | 3 | 4 | 5

interface WizardProps {
  isOpen: boolean
  onClose: () => void
  variant?: 'dialog' | 'inline'
  onRenewalClick?: () => void
}

const STEPS_LABELS = [
  'Información Personal',
  'Selección de Plan',
  'Pago de Inscripción',
  'Enrolamiento Facial',
]

function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

function getEndDateString(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

export function MemberEnrollmentWizard({
  isOpen,
  onClose,
  variant = 'dialog',
  onRenewalClick,
}: WizardProps) {
  const queryClient = useQueryClient()
  const {
    stream: cameraStream,
    videoRef,
    start: startCamera,
    capture: capturePhoto,
    setStatus: setCameraStatus,
  } = useCameraCapture()

  const [step, setStep] = useState<Step>(1)
  const [personalInfo, setPersonalInfo] = useState<PersonalInfoState>({
    firstName: '',
    lastName: '',
    documentNumber: '',
    phone: '',
    gender: 'MALE',
    birthDate: '',
    photoBase64: null,
  })
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(
    null,
  )
  const [paymentMethod, setPaymentMethod] = useState<
    'CASH' | 'CARD' | 'TRANSFER' | 'QR'
  >('CASH')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSavingPhoto, setIsSavingPhoto] = useState(false)
  const [createdMemberName, setCreatedMemberName] = useState('')
  const [createdPlanName, setCreatedPlanName] = useState('')
  const [createdMemberId, setCreatedMemberId] = useState<string | null>(null)
  const [enrollmentMode, setEnrollmentMode] = useState<'CAMERA' | 'BIOMETRIC'>(
    'CAMERA',
  )
  const [readerIp, setReaderIp] = useState('192.168.1.201')
  const [isConnectingDevice, setIsConnectingDevice] = useState(false)
  const [biometricStatus, setBiometricStatus] = useState('')

  const { data: packages = [] } = useQuery({
    queryKey: ['active-packages'],
    queryFn: () => getActivePackages(),
    enabled: isOpen,
  })

  const { data: gymSettings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => getSettings(),
    enabled: isOpen,
  })

  const selectedPackage = packages.find((p) => p.id === selectedPackageId)

  const validateStep = useCallback(
    (currentStep: Step): boolean => {
      const newErrors: Record<string, string> = {}
      if (currentStep === 1) {
        if (!personalInfo.firstName.trim())
          newErrors.firstName = 'El nombre es obligatorio'
        if (!personalInfo.lastName.trim())
          newErrors.lastName = 'El apellido es obligatorio'
        if (!personalInfo.documentNumber.trim())
          newErrors.documentNumber = 'El documento es obligatorio'
      }
      if (currentStep === 2 && !selectedPackageId) {
        newErrors.selectedPackageId = 'Seleccioná un paquete'
      }
      setErrors(newErrors)
      return Object.keys(newErrors).length === 0
    },
    [personalInfo, selectedPackageId],
  )

  const simulateBiometricCapture = async () => {
    setIsConnectingDevice(true)
    setBiometricStatus(`Conectando con lector biométrico en ${readerIp}...`)
    await new Promise((r) => setTimeout(r, 1200))
    setBiometricStatus('Estableciendo canal seguro (SenseFace SDK v3.1)...')
    await new Promise((r) => setTimeout(r, 1200))
    setBiometricStatus(
      'Esperando que el socio se posicione frente al sensor...',
    )
    await new Promise((r) => setTimeout(r, 1500))
    setBiometricStatus('Capturando biometría facial...')
    await new Promise((r) => setTimeout(r, 800))
    const mockSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
      <rect width="100%" height="100%" fill="%230a0f1d"/>
      <path d="M200 80 C130 80 110 150 110 210 C110 290 140 320 200 320 C260 320 290 290 290 210 C290 150 270 80 200 80 Z" fill="none" stroke="%236366f1" stroke-width="3" opacity="0.6"/>
      <path d="M120 180 L280 180 M120 220 L280 220 M160 140 L240 140 M180 260 L220 260" fill="none" stroke="%236366f1" stroke-width="1.5" stroke-dasharray="4 4" opacity="0.5"/>
      <circle cx="200" cy="200" r="120" fill="none" stroke="%236366f1" stroke-width="2" stroke-dasharray="6 6" opacity="0.7"/>
      <text x="200" y="350" fill="%236366f1" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="middle" letter-spacing="2">LECTOR BIOMETRICO SENSEFACE</text>
      <text x="200" y="375" fill="%2322c55e" font-family="sans-serif" font-size="11" font-weight="bold" text-anchor="middle">ROSTRO ENROLADO CON EXITO</text>
    </svg>`
    setPersonalInfo((prev) => ({
      ...prev,
      photoBase64: `data:image/svg+xml;utf8,${encodeURIComponent(mockSvg)}`,
    }))
    setIsConnectingDevice(false)
    setBiometricStatus('')
    toast.success('Rostro capturado desde el lector biométrico')
  }

  const handleSubmit = async () => {
    if (!selectedPackage) return
    setIsSubmitting(true)
    try {
      const fullName = `${personalInfo.firstName.trim()} ${personalInfo.lastName.trim()}`
      const member = await createMember({
        data: {
          fullName,
          documentNumber: personalInfo.documentNumber,
          phone: personalInfo.phone || undefined,
          birthDate: personalInfo.birthDate || undefined,
          gender: personalInfo.gender,
        },
      })
      if (personalInfo.photoBase64) {
        await uploadMemberPhoto({
          data: { memberId: member.id, photoBase64: personalInfo.photoBase64 },
        })
      }
      await createSubscription({
        data: {
          memberId: member.id,
          planId: null,
          packageId: selectedPackageId,
          startDate: getTodayString(),
          endDate: getEndDateString(selectedPackage.durationDays),
          amountPaid: selectedPackage.price.toString(),
          paymentMethod,
        },
      })
      setCreatedMemberName(member.fullName)
      setCreatedPlanName(selectedPackage.name)
      setCreatedMemberId(member.id)
      queryClient.invalidateQueries({ queryKey: ['members'] })
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
      setStep(4)
      toast.success('Socio registrado. Pasemos al enrolamiento facial.')
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Error al registrar el socio',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSavePhoto = async () => {
    if (!createdMemberId || !personalInfo.photoBase64) {
      setStep(5)
      return
    }
    setIsSavingPhoto(true)
    try {
      await uploadMemberPhoto({
        data: {
          memberId: createdMemberId,
          photoBase64: personalInfo.photoBase64,
        },
      })
      toast.success('Foto de perfil vinculada correctamente')
      queryClient.invalidateQueries({ queryKey: ['members'] })
      setStep(5)
    } catch {
      toast.error('Error al guardar la foto')
    } finally {
      setIsSavingPhoto(false)
    }
  }

  const goNext = () => {
    if (step === 5) return
    if (!validateStep(step)) return
    if (step === 3) {
      handleSubmit()
      return
    }
    setStep((s) => Math.min(s + 1, 5) as Step)
  }

  const goBack = () => {
    if (step > 1) setStep((s) => Math.max(s - 1, 1) as Step)
  }

  const resetWizard = () => {
    setStep(1)
    setPersonalInfo({
      firstName: '',
      lastName: '',
      documentNumber: '',
      phone: '',
      gender: 'MALE',
      birthDate: '',
      photoBase64: null,
    })
    setSelectedPackageId(null)
    setPaymentMethod('CASH')
    setErrors({})
    setIsSubmitting(false)
    setCreatedMemberName('')
    setCreatedPlanName('')
    setCreatedMemberId(null)
    setEnrollmentMode('CAMERA')
    setReaderIp('192.168.1.201')
    setIsConnectingDevice(false)
    setBiometricStatus('')
  }

  const handleClose = () => {
    resetWizard()
    onClose()
  }

  const sendWhatsAppMessage = () => {
    const gymName = gymSettings?.gymName || 'Nuwe Gym'
    const startDate = formatDate(getTodayString())
    const endDate = selectedPackage
      ? formatDate(getEndDateString(selectedPackage.durationDays))
      : formatDate(getEndDateString(30))
    const priceFormatted = selectedPackage
      ? formatCurrency(Number(selectedPackage.price))
      : ''
    const message = `¡Hola, *${createdMemberName}*! Te damos la bienvenida a *${gymName}* 🏋️💪\n\nTu registro de socio ha sido completado con éxito:\n- *Plan/Paquete:* ${createdPlanName}\n${priceFormatted ? `- *Monto Abonado:* ${priceFormatted}\n` : ''}- *Método de Pago:* ${paymentMethod === 'CASH' ? 'Efectivo' : paymentMethod === 'CARD' ? 'Tarjeta' : paymentMethod === 'TRANSFER' ? 'Transferencia' : 'QR'}\n- *Fecha de Inicio:* ${startDate}\n- *Fecha de Vencimiento:* ${endDate}\n\n¡Ya podés ingresar al gimnasio! Te deseamos el mejor de los éxitos en tu entrenamiento. ¡A meterle con todo! 🏋️🔥`
    const waUrl = `https://wa.me/${personalInfo.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
    window.open(waUrl, '_blank')
  }

  // Camera/biometric auto-capture effects
  useEffect(() => {
    if (
      step === 4 &&
      enrollmentMode === 'CAMERA' &&
      !personalInfo.photoBase64 &&
      cameraStream
    ) {
      setCameraStatus('Buscando rostro...')
      const t1 = setTimeout(() => {
        setCameraStatus('Rostro enfocado. Capturando en 2s...')
        setTimeout(() => {
          capturePhoto()
          setCameraStatus('')
        }, 2000)
      }, 1200)
      return () => clearTimeout(t1)
    }
  }, [
    step,
    enrollmentMode,
    cameraStream,
    personalInfo.photoBase64,
    capturePhoto,
    setCameraStatus,
  ])

  useEffect(() => {
    if (
      step === 4 &&
      enrollmentMode === 'BIOMETRIC' &&
      !personalInfo.photoBase64 &&
      !isConnectingDevice
    ) {
      const t = setTimeout(() => simulateBiometricCapture(), 800)
      return () => clearTimeout(t)
    }
  }, [step, enrollmentMode, personalInfo.photoBase64, isConnectingDevice])

  const stepContent = () => {
    switch (step) {
      case 1:
        return (
          <Step1PersonalInfo
            state={personalInfo}
            errors={errors}
            onChange={setPersonalInfo}
            onRenewalClick={onRenewalClick}
          />
        )
      case 2:
        return (
          <Step2PackageSelect
            packages={packages}
            selectedPackageId={selectedPackageId}
            error={errors.selectedPackageId}
            onSelect={setSelectedPackageId}
          />
        )
      case 3:
        return (
          <Step3Payment
            selectedPackage={selectedPackage}
            paymentMethod={paymentMethod}
            onMethodChange={setPaymentMethod}
          />
        )
      case 4:
        return (
          <Step4FacialEnrollment
            photoBase64={personalInfo.photoBase64}
            cameraStream={cameraStream}
            cameraStatus=""
            enrollmentMode={enrollmentMode}
            isConnectingDevice={isConnectingDevice}
            biometricStatus={biometricStatus}
            readerIp={readerIp}
            videoRef={videoRef}
            onModeChange={(mode) => {
              setPersonalInfo((p) => ({ ...p, photoBase64: null }))
              setEnrollmentMode(mode)
            }}
            onReaderIpChange={setReaderIp}
            onStartCamera={startCamera}
            onCapturePhoto={() => {
              const p = capturePhoto()
              if (p) setPersonalInfo((prev) => ({ ...prev, photoBase64: p }))
            }}
            onSimulateBiometric={simulateBiometricCapture}
            onRecapture={() => {
              setPersonalInfo((p) => ({ ...p, photoBase64: null }))
              if (enrollmentMode === 'CAMERA') startCamera()
            }}
          />
        )
      case 5:
        return (
          <Step5Complete
            createdMemberName={createdMemberName}
            createdPlanName={createdPlanName}
            paymentMethod={paymentMethod}
            onSendWhatsApp={sendWhatsAppMessage}
            onFinish={handleClose}
          />
        )
    }
  }

  const renderWizardContent = () => {
    const formContent = (
      <div className="flex-1 flex justify-center items-start pt-5">
        <div className="w-full max-w-lg bg-card/60 border border-border/10 rounded-4xl shadow-xl overflow-hidden flex flex-col min-h-[580px]">
          <div className="flex-1 p-6 flex flex-col">
            {step < 5 && (
              <div className="flex items-center gap-1.5 mb-5">
                {STEPS_LABELS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 rounded-full transition-all flex-1 ${i + 1 <= step ? 'bg-gray-900 dark:bg-white' : 'bg-gray-200 dark:bg-white/10'}`}
                  />
                ))}
              </div>
            )}
            <div className="flex-1 min-h-0 overflow-y-auto text-gray-900 dark:text-gray-100">
              {stepContent()}
            </div>
            <WizardFooter
              step={step}
              isSubmitting={isSubmitting}
              isSavingPhoto={isSavingPhoto}
              hasPhoto={!!personalInfo.photoBase64}
              onNext={goNext}
              onBack={goBack}
              onSavePhoto={handleSavePhoto}
              onSkipPhoto={() => setStep(5)}
            />
          </div>
        </div>
      </div>
    )

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
          leftPanel={
            <WizardSidebar
              step={step}
              variant={variant}
              onClose={handleClose}
              insideLayout
            />
          }
        >
          {formContent}
        </ModuleLayout>
      )
    }

    return (
      <div className="flex gap-6 items-start justify-start w-full">
        <WizardSidebar step={step} variant={variant} onClose={handleClose} />
        {formContent}
      </div>
    )
  }

  if (variant === 'inline') return renderWizardContent()

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
