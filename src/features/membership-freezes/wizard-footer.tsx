import { ArrowLeft } from 'lucide-react'
import { Button } from '#/shared/components/ui/button'
import type { Step } from './types.ts'

interface WizardFooterProps {
  step: Step
  ready: boolean
  onBack: () => void
  onNext: () => void
}

export function WizardFooter({
  step,
  ready,
  onBack,
  onNext,
}: WizardFooterProps) {
  return (
    <div className="flex justify-between items-center pt-6 border-t dark:border-white/5 border-black/5 mt-6 shrink-0">
      <Button
        onClick={onBack}
        className="h-10 px-5 rounded-full text-xs font-bold bg-foreground text-primary-foreground hover:bg-foreground/90 gap-1.5"
      >
        <ArrowLeft className="size-3.5" />
        Atrás
      </Button>
      {step < 3 && (
        <Button
          disabled={!ready}
          onClick={onNext}
          className="h-10 px-5 rounded-full text-xs font-bold bg-foreground text-primary-foreground hover:bg-foreground/90 disabled:opacity-50"
        >
          Siguiente
        </Button>
      )}
    </div>
  )
}
