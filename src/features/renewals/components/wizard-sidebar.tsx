import { useState, useCallback, useRef, useEffect } from 'react'
import { Search, X, Check, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
import { Input } from '#/shared/components/ui/input'
import { Separator } from '#/shared/components/ui/separator'
import { getInitials } from '#/shared/lib/formatters.ts'
import { STEPS } from '../utils.ts'
import type { Step, MemberWithSubscriptions } from '../types.ts'

interface WizardSidebarProps {
  step: Step
  searchQuery: string
  onSearchChange: (value: string) => void
  memberSearchResults: any[]
  searchingMembers: boolean
  selectedMember: MemberWithSubscriptions | null
  onSelectMember: (member: any) => void
  handleReset: () => void
  searchPage: number
  setSearchPage: (page: number) => void
  searchTotalPages: number
  searchTotal: number
}

export function WizardSidebar({
  step,
  searchQuery,
  onSearchChange,
  memberSearchResults,
  searchingMembers,
  selectedMember,
  onSelectMember,
  handleReset,
  searchPage,
  setSearchPage,
  searchTotalPages,
  searchTotal,
}: WizardSidebarProps) {
  const [pageChanging, setPageChanging] = useState(false)
  const pageTimerRef = useRef<ReturnType<typeof setTimeout>>(null)

  const handleSearchPageChange = useCallback(
    (page: number) => {
      setPageChanging(true)
      if (pageTimerRef.current) clearTimeout(pageTimerRef.current)
      pageTimerRef.current = setTimeout(() => setPageChanging(false), 350)
      setSearchPage(page)
    },
    [setSearchPage],
  )

  useEffect(() => {
    return () => {
      if (pageTimerRef.current) clearTimeout(pageTimerRef.current)
    }
  }, [])
  return (
    <div className="flex flex-col gap-5 z-10 w-full">
      <div>
        <h2 className="text-xl font-black tracking-tight leading-none text-foreground">
          Renovacion
        </h2>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">
          Membresia Gym
        </p>
      </div>

      <div className="flex flex-col items-center justify-center select-none py-2">
        <p className="text-[9px] font-black tracking-widest text-primary/95 uppercase mb-3.5">
          Renovación
        </p>
        <svg
          className="h-16 w-auto text-primary"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="renewGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#ec4899" stopOpacity="0.4" />
            </linearGradient>
          </defs>
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="2 4"
            className="opacity-15"
          />
          <circle
            cx="50"
            cy="50"
            r="30"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="3 3"
            className="opacity-25"
          />
          <g
            className="animate-spin"
            style={{ transformOrigin: '50px 50px', animationDuration: '2s' }}
          >
            <path
              d="M 50,20 A 30,30 0 0,1 80,50 L 74,50"
              stroke="url(#renewGrad)"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              d="M 80,50 L 84,42"
              stroke="url(#renewGrad)"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              d="M 80,50 L 72,44"
              stroke="url(#renewGrad)"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              d="M 50,80 A 30,30 0 0,1 20,50 L 26,50"
              stroke="url(#renewGrad)"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              d="M 20,50 L 16,58"
              stroke="url(#renewGrad)"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              d="M 20,50 L 28,56"
              stroke="url(#renewGrad)"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </g>
          <circle
            cx="50"
            cy="50"
            r="5"
            fill="currentColor"
            className="opacity-80"
          />
        </svg>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
            Búsqueda CARNET
          </span>
        </div>
        <div className="relative flex items-center">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Ingresar CI o nombre..."
            value={searchQuery}
            onChange={(e) => {
              onSearchChange(e.target.value)
              if (step > 1 && e.target.value) handleReset()
            }}
            className="pl-9 pr-9 h-10 w-full"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                onSearchChange('')
                if (step > 1) handleReset()
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded-full hover:bg-muted/50"
            >
              <X className="size-3.5 stroke-[2.5px]" />
            </button>
          )}
        </div>
      </div>

      {searchQuery.length >= 2 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
              Resultado de Busqueda:
            </p>
            <p className="text-[9px] font-semibold text-muted-foreground/70">
              {searchTotal} socio{searchTotal !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="relative">
            {pageChanging && (
              <div className="absolute top-0 left-0 right-0 z-10 h-0.5 bg-muted/30">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ animation: 'pageLoadBar 0.35s ease-out' }}
                />
              </div>
            )}
            <div
              key={searchPage}
              style={{ animation: 'fadeSlideIn 0.3s ease-out' }}
            >
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 scrollbar-none">
                {searchingMembers ? (
                  <div className="py-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                    <RefreshCw className="size-3 animate-spin text-primary" />
                    <span>Buscando...</span>
                  </div>
                ) : memberSearchResults.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No se encontraron socios
                  </p>
                ) : (
                  memberSearchResults.map((m) => {
                    const isSelected = selectedMember?.id === m.id
                    return (
                      <div
                        key={m.id}
                        onClick={() => onSelectMember(m)}
                        className={`p-2.5 rounded-xl border transition-all duration-300 flex items-center gap-3 cursor-pointer select-none ${
                          isSelected
                            ? 'bg-primary/5 border-primary shadow-sm'
                            : 'bg-muted/30 border-border/10 hover:bg-muted hover:border-border/20'
                        }`}
                      >
                        {m.photoUrl ? (
                          <img
                            src={m.photoUrl}
                            alt={m.fullName}
                            className="size-8 rounded-full object-cover shrink-0 border border-foreground/10 shadow-sm"
                          />
                        ) : (
                          <div className="size-8 rounded-full bg-gradient-to-br from-foreground/10 to-foreground/5 border border-foreground/10 flex items-center justify-center font-bold text-[10px] uppercase shrink-0 text-foreground tracking-wider shadow-inner">
                            {getInitials(m.fullName)}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-xs truncate leading-tight">
                            {m.fullName}
                          </p>
                          <p className="text-[9px] font-semibold text-muted-foreground mt-0.5">
                            CI: {m.documentNumber || '—'}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="size-4.5 rounded-full bg-primary flex items-center justify-center shrink-0">
                            <Check className="size-2.5 text-primary-foreground stroke-[3px]" />
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
          {searchTotalPages > 1 && memberSearchResults.length > 0 && (
            <div className="flex items-center justify-center gap-1 pt-1">
              <button
                type="button"
                onClick={() =>
                  handleSearchPageChange(Math.max(1, searchPage - 1))
                }
                disabled={searchPage === 1}
                className="size-6 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronLeft className="size-3.5" />
              </button>
              {Array.from({ length: searchTotalPages }).map((_, idx) => {
                const p = idx + 1
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handleSearchPageChange(p)}
                    className={`size-6 text-[10px] font-bold rounded-full transition-all ${
                      searchPage === p
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    {p}
                  </button>
                )
              })}
              <button
                type="button"
                onClick={() =>
                  handleSearchPageChange(
                    Math.min(searchTotalPages, searchPage + 1),
                  )
                }
                disabled={searchPage === searchTotalPages}
                className="size-6 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      <Separator className="dark:bg-white/5 bg-black/5" />

      <div className="space-y-4 pt-1">
        {STEPS.map((s, index) => {
          const isCompleted = step > s.id
          const isActive = step === s.id
          return (
            <div key={s.id} className="relative flex gap-3.5 group">
              {index < STEPS.length - 1 && (
                <div className="absolute left-[15px] top-8 bottom-[-16px] w-[1px] bg-border/20" />
              )}
              <div
                className={`size-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-all duration-300 ${
                  isCompleted
                    ? 'bg-emerald-500 text-white shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                    : isActive
                      ? 'bg-amber-500 text-white shadow-[0_0_12px_rgba(245,158,11,0.35)] ring-2 ring-amber-500/20'
                      : 'bg-muted/40 text-muted-foreground border border-border/10'
                }`}
              >
                {isCompleted ? <Check className="size-4 stroke-[3px]" /> : s.id}
              </div>
              <div className="min-w-0 pt-0.5">
                <p
                  className={`text-xs font-bold transition-colors ${isActive ? 'text-foreground font-black' : 'text-muted-foreground/80'}`}
                >
                  {s.label}
                </p>
                <p className="text-[10px] text-muted-foreground/60 font-semibold mt-0.5">
                  {s.sublabel}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
