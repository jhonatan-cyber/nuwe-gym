import { Eye, EyeOff } from 'lucide-react'
import { Label } from '#/shared/components/ui/label'
import { Input } from '#/shared/components/ui/input'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '#/shared/components/ui/tooltip'

interface PasswordFieldProps {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  show: boolean
  onToggle: (v: boolean) => void
  required?: boolean
  minLength?: number
}

export function PasswordField({
  id,
  label,
  value,
  onChange,
  show,
  onToggle,
  required,
  minLength,
}: PasswordFieldProps) {
  return (
    <div className="grid gap-1.5">
      <Label
        htmlFor={id}
        className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1"
      >
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="rounded-full pr-10"
          required={required}
          minLength={minLength}
        />
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => onToggle(!show)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{show ? 'Ocultar contraseña' : 'Mostrar contraseña'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  )
}
