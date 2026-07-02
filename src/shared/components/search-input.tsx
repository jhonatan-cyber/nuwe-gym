import { Search, X } from 'lucide-react'
import { cn } from '#/shared/lib/utils.ts'
import { Input } from '#/shared/components/ui/input.tsx'

interface SearchInputProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onClear?: () => void
  placeholder?: string
  className?: string
}

export function SearchInput({
  value,
  onChange,
  onClear,
  placeholder = 'Buscar...',
  className,
}: SearchInputProps) {
  return (
    <div className={cn('relative group', className)}>
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-foreground" />
      <Input
        placeholder={placeholder}
        className="pl-8 pr-8"
        value={value}
        onChange={onChange}
      />
      {value && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
        >
          <X className="size-3" />
        </button>
      )}
    </div>
  )
}
