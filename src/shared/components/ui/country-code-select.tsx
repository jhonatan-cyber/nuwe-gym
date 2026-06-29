import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/shared/components/ui/select'
import { cn } from '#/shared/lib/utils.ts'

export interface Country {
  code: string
  flag: string
  name: string
}

export const COUNTRIES: Country[] = [
  { code: '+591', flag: 'bo', name: 'Bolivia' },
  { code: '+54', flag: 'ar', name: 'Argentina' },
  { code: '+55', flag: 'br', name: 'Brasil' },
  { code: '+56', flag: 'cl', name: 'Chile' },
  { code: '+57', flag: 'co', name: 'Colombia' },
  { code: '+593', flag: 'ec', name: 'Ecuador' },
  { code: '+502', flag: 'gt', name: 'Guatemala' },
  { code: '+52', flag: 'mx', name: 'México' },
  { code: '+595', flag: 'py', name: 'Paraguay' },
  { code: '+51', flag: 'pe', name: 'Perú' },
  { code: '+1', flag: 'us', name: 'EE.UU.' },
  { code: '+598', flag: 'uy', name: 'Uruguay' },
  { code: '+58', flag: 've', name: 'Venezuela' },
  { code: '+34', flag: 'es', name: 'España' },
]

interface CountryCodeSelectProps {
  value: string
  onValueChange: (value: string) => void
  className?: string
  id?: string
  disabled?: boolean
}

export function CountryCodeSelect({
  value,
  onValueChange,
  className,
  id,
  disabled,
}: CountryCodeSelectProps) {
  const selectedCountry = COUNTRIES.find((c) => c.code === value)

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger
        id={id}
        className={cn('w-[115px] shrink-0 text-xs px-3', className)}
      >
        {selectedCountry && (
          <span className="flex items-center gap-1.5">
            <img
              src={`https://flagcdn.com/16x12/${selectedCountry.flag}.png`}
              alt={selectedCountry.name}
              className="w-4 h-3 object-cover rounded-xs"
            />
            <span>{selectedCountry.code}</span>
          </span>
        )}
        <span className="hidden">
          <SelectValue />
        </span>
      </SelectTrigger>
      <SelectContent
        position="popper"
        className="max-h-[220px] w-[200px] overflow-y-auto"
      >
        {COUNTRIES.map((country) => (
          <SelectItem key={country.code} value={country.code}>
            <span className="flex items-center gap-2">
              <img
                src={`https://flagcdn.com/16x12/${country.flag}.png`}
                alt={country.name}
                className="w-4 h-3 object-cover rounded-xs"
              />
              <span>
                {country.name} ({country.code})
              </span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
