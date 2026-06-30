import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { Button } from '#/shared/components/ui/button'
import { LoadingButton } from '#/shared/components/ui/loading-button'

interface WizardFooterProps {
  step: number
  isSubmitting: boolean
  isSavingPhoto: boolean
  hasPhoto: boolean
  onNext: () => void
  onBack: () => void
  onSavePhoto: () => void
  onSkipPhoto: () => void
}

export function WizardFooter({
  step,
  isSubmitting,
  isSavingPhoto,
  hasPhoto,
  onNext,
  onBack,
  onSavePhoto,
  onSkipPhoto,
}: WizardFooterProps) {
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
            onClick={onBack}
            disabled={isSubmitting}
            className="text-xs font-bold text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white"
          >
            <ChevronLeft className="size-4 mr-1" /> Anterior
          </Button>
        )}
      </div>
      <div className="justify-self-center">
        {isLast ? (
          hasPhoto ? (
            <LoadingButton
              onClick={onSavePhoto}
              isLoading={isSavingPhoto}
              loadingText="Guardando..."
              className="font-black bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:hover:bg-black dark:hover:text-white dark:text-black"
            >
              Guardar y Finalizar <Check className="size-4 ml-1" />
            </LoadingButton>
          ) : (
            <Button
              variant="outline"
              onClick={onSkipPhoto}
              disabled={isSavingPhoto}
              className="text-xs font-bold border-gray-300 dark:border-white/20 dark:text-white"
            >
              Omitir por ahora <ChevronRight className="size-4 ml-1" />
            </Button>
          )
        ) : isConfirm ? (
          <LoadingButton
            onClick={onNext}
            isLoading={isSubmitting}
            loadingText="Registrando..."
            className="font-black bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:hover:bg-black dark:hover:text-white dark:text-black"
          >
            Siguiente <ChevronRight className="size-4 ml-1" />
          </LoadingButton>
        ) : (
          <Button
            onClick={onNext}
            className="font-black bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:hover:bg-black dark:hover:text-white dark:text-black"
          >
            Siguiente <ChevronRight className="size-4 ml-1" />
          </Button>
        )}
      </div>
      <div className="justify-self-end" />
    </div>
  )
}
