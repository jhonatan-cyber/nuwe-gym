import { Check, List, Plus, X } from 'lucide-react'
import { Button } from '#/shared/components/ui/button'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '#/shared/components/ui/toggle-group'
import { useTheme } from 'next-themes'

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

interface WizardSidebarProps {
  step: number
  variant?: 'dialog' | 'inline'
  onClose: () => void
  insideLayout?: boolean
}

export function WizardSidebar({
  step,
  variant = 'dialog',
  onClose,
  insideLayout = false,
}: WizardSidebarProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const content = (
    <>
      <div className="absolute -top-20 -left-20 size-48 dark:bg-white/4 bg-black/2 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-10 size-64 dark:bg-white/2 bg-black/1 rounded-full blur-3xl pointer-events-none" />
      {variant !== 'inline' && (
        <Button
          size="icon"
          variant="ghost"
          onClick={onClose}
          className="absolute top-4 right-4 z-10"
        >
          <X className="size-4" />
        </Button>
      )}
      <div className="mb-6 z-10 w-full">
        <ToggleGroup
          type="single"
          value="enroll"
          onValueChange={(v) => {
            if (v === 'list') onClose()
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
      <div className="flex justify-center z-10 w-full">
        <img
          src={isDark ? '/logo-dark.png' : '/logo-ligth.png'}
          alt="Trainix Logo"
          className="h-32 w-auto object-contain select-none pointer-events-none"
        />
      </div>
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
              <div
                className={`relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-black transition-all duration-300 border-2 ${
                  isActive
                    ? 'bg-foreground border-foreground text-primary-foreground shadow-lg shadow-foreground/10 scale-105'
                    : isCompleted
                      ? 'bg-foreground/10 border-foreground/20 text-foreground'
                      : 'bg-black/2 dark:bg-white/2 text-muted-foreground/60 dark:border-white/10 border-black/10'
                }`}
              >
                {isCompleted ? (
                  <Check className="size-4 stroke-3" />
                ) : (
                  <span className="text-sm font-bold">{s.number}</span>
                )}
              </div>
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

  if (insideLayout) return content

  return (
    <div className="w-[300px] shrink-0 bg-card/80 backdrop-blur-md p-6 relative h-fit flex flex-col rounded-4xl overflow-hidden shadow-xl border border-border/10">
      {content}
    </div>
  )
}
