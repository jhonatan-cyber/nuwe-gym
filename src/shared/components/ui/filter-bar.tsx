import { Filter } from 'lucide-react'
import { SearchInput } from '#/shared/components/search-input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/shared/components/ui/select'

interface FilterOption {
  value: string
  label: string
}

interface FilterBarProps {
  search: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  filterValue?: string
  onFilterChange?: (value: string) => void
  filterOptions?: FilterOption[]
  filterPlaceholder?: string
}

export function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder = 'Buscar...',
  filterValue,
  onFilterChange,
  filterOptions,
  filterPlaceholder = 'Todos',
}: FilterBarProps) {
  return (
    <div className="space-y-3 pt-2 border-t dark:border-white/5 border-black/5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
        Filtros
      </p>
      <div className="space-y-2">
        <SearchInput
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full"
        />
        {filterOptions && onFilterChange && (
          <Select value={filterValue} onValueChange={onFilterChange}>
            <SelectTrigger className="w-full">
              <Filter className="size-3 mr-1" />
              <SelectValue placeholder={filterPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              {filterOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  )
}
