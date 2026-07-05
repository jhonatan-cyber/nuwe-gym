import { useState } from 'react'
import { Search, X, Check, RefreshCw, ChevronDown } from 'lucide-react'
import { Input } from '#/shared/components/ui/input'
import { Separator } from '#/shared/components/ui/separator'
import { getInitials } from '#/shared/lib/formatters.ts'
import { STEPS } from '../utils.ts'
import type { Step, MemberWithSubscriptions } from '../types.ts'
import { getActiveSubscription, isExpired } from '#/shared/lib/subscription-utils.ts'

interface WizardSidebarProps {
  step: Step
  searchQuery: string
  onSearchChange: (value: string) => void
  memberSearchResults: any[]
  allSearchResults: any[]
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
  allSearchResults,
  searchingMembers,
  selectedMember,
  onSelectMember,
  handleReset,

}: WizardSidebarProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

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

      <div className="space-y-3 relative">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
            Búsqueda
          </span>
        </div>
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Ingresar CI o nombre..."
            value={searchQuery}
            onChange={(e) => {
              onSearchChange(e.target.value)
              setIsDropdownOpen(true)
              if (step > 1 && e.target.value) handleReset()
            }}
            onFocus={() => setIsDropdownOpen(true)}
            className="pl-10 pr-10 h-10 w-full rounded-full animate-in fade-in duration-200 bg-background dark:bg-input/30 border-border/10 focus-visible:ring-ring/30 focus-visible:border-ring"
            autoComplete="off"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => {
                onSearchChange('')
                setIsDropdownOpen(false)
                if (step > 1) handleReset()
              }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded-full hover:bg-muted/50"
            >
              <X className="size-3.5 stroke-[2.5px]" />
            </button>
          ) : (
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          )}
        </div>

        {isDropdownOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsDropdownOpen(false)}
            />
            <div className="absolute top-[calc(100%+4px)] left-0 z-50 max-h-60 w-full overflow-auto rounded-2xl border dark:border-white/10 border-black/10 bg-popover p-1.5 text-popover-foreground shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="space-y-1 max-h-[200px] overflow-y-auto pr-1 scrollbar-none">
                {searchingMembers ? (
                  <div className="py-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5 font-semibold">
                    <RefreshCw className="size-3 animate-spin text-primary" />
                    <span>Buscando...</span>
                  </div>
                ) : allSearchResults.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4 font-semibold">
                    No se encontraron socios
                  </p>
                ) : (
                  allSearchResults.slice(0, 10).map((m) => {
                    const isSelected = selectedMember?.id === m.id
                    const sub = getActiveSubscription(m)
                    const expired = sub && isExpired(sub.endDate)
                    const hasActiveSub = sub && sub.status === 'ACTIVE' && !expired

                    let statusBadge = (
                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/10">
                        Sin plan
                      </span>
                    )
                    if (m.status === 'INACTIVE') {
                      statusBadge = (
                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-secondary text-secondary-foreground border border-border/10">
                          Inactivo
                        </span>
                      )
                    } else if (hasActiveSub) {
                      statusBadge = (
                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          Activo
                        </span>
                      )
                    } else if (expired) {
                      statusBadge = (
                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
                          Vencido
                        </span>
                      )
                    }

                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          onSelectMember(m)
                          setIsDropdownOpen(false)
                        }}
                        className={`w-full p-2.5 rounded-xl border text-left flex items-center gap-3 cursor-pointer select-none transition-all duration-150 ${
                          isSelected
                            ? 'bg-primary/5 border-primary shadow-sm'
                            : 'bg-transparent border-transparent hover:bg-accent hover:text-accent-foreground'
                        }`}
                      >
                        {m.photoUrl ? (
                          <img
                            src={m.photoUrl}
                            alt={m.fullName}
                            className="size-7 rounded-full object-cover shrink-0 border border-foreground/10 shadow-sm"
                          />
                        ) : (
                          <div className="size-7 rounded-full bg-gradient-to-br from-foreground/10 to-foreground/5 border border-foreground/10 flex items-center justify-center font-bold text-[9px] uppercase shrink-0 text-foreground tracking-wider shadow-inner">
                            {getInitials(m.fullName)}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-xs truncate leading-tight text-foreground">
                            {m.fullName}
                          </p>
                          <p className="text-[9px] font-semibold text-muted-foreground mt-0.5">
                            CI: {m.documentNumber || '—'}
                          </p>
                        </div>
                        <div className="shrink-0 flex items-center gap-1.5">
                          {statusBadge}
                          {isSelected && (
                            <div className="size-4 rounded-full bg-primary flex items-center justify-center shrink-0">
                              <Check className="size-2 text-primary-foreground stroke-[3px]" />
                            </div>
                          )}
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          </>
        )}
      </div>

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
