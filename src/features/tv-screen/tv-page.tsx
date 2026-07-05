import { useState, useEffect, useCallback, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getTvData } from './tv-server.ts'
import {
  Users,
  Dumbbell,
  Star,
  Quote,
  DoorOpen,
  MapPin,
  Calendar,
  Trophy,
  TrendingUp,
  Activity,
  Image as ImageIcon,
} from 'lucide-react'
import { cn } from '#/shared/lib/utils.ts'

const SECTION_INTERVAL = 10000
const CURSOR_HIDE_DELAY = 3000

type SectionId = 'ranking' | 'classes' | 'promos' | 'phrase' | 'stats' | 'gallery'

const SECTIONS: SectionId[] = ['stats', 'ranking', 'classes', 'gallery', 'promos', 'phrase']

// ── Animated counter hook ──

function useCountUp(target: number, duration = 1500, enabled = true) {
  const [value, setValue] = useState(0)
  const prevTarget = useRef(0)
  const rafId = useRef<number>(0)

  useEffect(() => {
    if (!enabled) { setValue(target); return }
    const start = prevTarget.current
    const diff = target - start
    if (diff === 0) return
    const startTime = performance.now()

    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(start + diff * eased))
      if (progress < 1) rafId.current = requestAnimationFrame(animate)
    }

    rafId.current = requestAnimationFrame(animate)
    prevTarget.current = target

    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current)
    }
  }, [target, duration, enabled])

  return value
}

export function TvPage() {
  const [activeSection, setActiveSection] = useState<SectionId>('stats')
  const [sectionIndex, setSectionIndex] = useState(0)
  const [phrase, setPhrase] = useState('')
  const [cursorVisible, setCursorVisible] = useState(true)
  const [galleryIndex, setGalleryIndex] = useState(0)
  const cursorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sectionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['tv-data'],
    queryFn: () => getTvData(),
    refetchInterval: 30000,
  })

  // ── Auto-hide cursor on inactivity ──
  const resetCursorTimer = useCallback(() => {
    setCursorVisible(true)
    if (cursorTimerRef.current) clearTimeout(cursorTimerRef.current)
    cursorTimerRef.current = setTimeout(() => setCursorVisible(false), CURSOR_HIDE_DELAY)
  }, [])

  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart'] as const
    events.forEach((e) => window.addEventListener(e, resetCursorTimer))
    resetCursorTimer()
    return () => {
      events.forEach((e) => window.removeEventListener(e, resetCursorTimer))
      if (cursorTimerRef.current) clearTimeout(cursorTimerRef.current)
    }
  }, [resetCursorTimer])

  // ── Rotate sections ──
  const advanceSection = useCallback(() => {
    setSectionIndex((prev) => {
      const next = (prev + 1) % SECTIONS.length
      setActiveSection(SECTIONS[next])
      setGalleryIndex(0)
      return next
    })
  }, [])

  useEffect(() => {
    sectionTimerRef.current = setInterval(advanceSection, SECTION_INTERVAL)
    return () => {
      if (sectionTimerRef.current) clearInterval(sectionTimerRef.current)
    }
  }, [advanceSection])

  // ── Gallery auto-advance when active ──
  useEffect(() => {
    if (activeSection !== 'gallery' || !data?.mediaItems?.length) return
    const timer = setInterval(() => {
      setGalleryIndex((prev) => (prev + 1) % (data.mediaItems?.length ?? 1))
    }, 5000)
    return () => clearInterval(timer)
  }, [activeSection, data?.mediaItems?.length])

  // ── Update phrase ──
  useEffect(() => {
    if (data?.motivationalPhrase) setPhrase(data.motivationalPhrase)
  }, [data?.motivationalPhrase])

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          <p className="text-emerald-500 text-sm font-semibold tracking-widest uppercase">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center">
        <p className="text-red-400 text-sm">Error al cargar datos</p>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'h-screen w-screen bg-gradient-to-br from-zinc-950 via-black to-zinc-950 text-white overflow-hidden relative select-none',
        !cursorVisible && 'cursor-none',
      )}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 -left-20 size-96 bg-emerald-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 -right-20 size-80 bg-blue-500/5 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-12 py-6 border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="size-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Dumbbell className="size-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight">{data.gymName || 'TRAINIX'}</h1>
            <p className="text-[10px] text-emerald-400/80 uppercase tracking-[0.2em] font-semibold">Gimnasio</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <LiveDot />
          <DateTime />
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 h-[calc(100vh-100px)] flex flex-col items-center justify-center px-12">
        {/* Animated content wrapper */}
        <div ref={contentRef} className="w-full">
          {activeSection === 'stats' && <StatsSection data={data} key="stats" />}
          {activeSection === 'ranking' && <RankingSection data={data} key="ranking" />}
          {activeSection === 'classes' && <ClassesSection data={data} key="classes" />}
          {activeSection === 'gallery' && <GallerySection data={data} galleryIndex={galleryIndex} key="gallery" />}
          {activeSection === 'promos' && <PromosSection data={data} key="promos" />}
          {activeSection === 'phrase' && <PhraseSection phrase={phrase} sectionIndex={sectionIndex} key="phrase" />}
        </div>
      </main>

      {/* Section indicator dots */}
      {activeSection !== 'phrase' && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
          {SECTIONS.map((s, i) => (
            <button
              key={s}
              onClick={() => { setSectionIndex(i); setActiveSection(s); setGalleryIndex(0) }}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                i === sectionIndex ? 'w-8 bg-emerald-500' : 'w-1.5 bg-white/20 hover:bg-white/40',
              )}
            />
          ))}
        </div>
      )}

      {/* Ticker tape */}
      {data.tickerMessages?.length > 0 && (
        <Ticker messages={data.tickerMessages} />
      )}

      {/* Footer */}
      <footer className="absolute bottom-0 left-0 right-0 z-10 px-12 py-3 border-t border-white/5 flex items-center justify-between text-[10px] text-white/20">
        <span>Trainix TV · Datos en tiempo real</span>
        <button onClick={() => refetch()} className="hover:text-white/40 transition-colors">
          Actualizar datos
        </button>
        <span className="tabular-nums">
          Actualizado: {new Date(data.updatedAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </footer>
    </div>
  )
}

// ── Section Components ──

function StatsSection({ data }: { data: Awaited<ReturnType<typeof getTvData>> }) {
  const currentlyInGym = useCountUp(Number(data.currentlyInGym), 1200, true)
  const todayCheckIns = useCountUp(Number(data.todayCheckIns), 1500, true)

  return (
    <SectionWrapper>
      <SectionTitle icon={Activity} label="Estado del gimnasio" />
      <div className="grid grid-cols-3 gap-8 mt-8">
        <StatCard icon={DoorOpen} value={currentlyInGym} label="Personas ahora" subtext="últimas 2 horas" color="emerald" />
        <StatCard icon={TrendingUp} value={todayCheckIns} label="Ingresos hoy" subtext="check-ins registrados" color="blue" />
        <StatCard
          icon={Users}
          value={data.ranking.length > 0 ? data.ranking[0].checkIns : 0}
          label="Top del mes"
          subtext={data.ranking[0]?.fullName ?? '—'}
          color="amber"
        />
      </div>
      <div className="mt-10">
        <div className="flex items-center justify-between text-sm mb-3">
          <span className="text-white/60 font-medium">Ocupación del día</span>
          <span className="text-white font-bold">{Math.min(Math.round((todayCheckIns / 200) * 100), 100)}%</span>
        </div>
        <div className="h-3 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-300 rounded-full transition-all duration-1000"
            style={{ width: `${Math.min((todayCheckIns / 200) * 100, 100)}%` }}
          />
        </div>
        <p className="text-[11px] text-white/30 mt-2 text-right">Basado en capacidad estimada de 200 personas/día</p>
      </div>
    </SectionWrapper>
  )
}

function RankingSection({ data }: { data: Awaited<ReturnType<typeof getTvData>> }) {
  return (
    <SectionWrapper>
      <SectionTitle icon={Trophy} label="Ranking de asistencia — Este mes" />
      <div className="mt-8 space-y-2">
        {data.ranking.map((member, i) => (
          <div
            key={member.fullName}
            className={cn(
              'flex items-center gap-5 px-6 py-4 rounded-2xl transition-all',
              i === 0 ? 'bg-gradient-to-r from-amber-500/10 to-amber-500/5 border border-amber-500/20' : 'bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.05]',
            )}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className={cn('size-10 rounded-full flex items-center justify-center font-black text-sm shrink-0', i === 0 ? 'bg-amber-500/20 text-amber-400' : i === 1 ? 'bg-zinc-500/20 text-zinc-400' : i === 2 ? 'bg-orange-600/20 text-orange-500' : 'bg-white/5 text-white/40')}>
              {i + 1}
            </div>
            <div className={cn('size-10 rounded-full bg-gradient-to-br flex items-center justify-center font-bold text-sm shrink-0', i === 0 ? 'from-amber-400 to-amber-600 text-white' : 'from-zinc-600 to-zinc-800 text-white/60')}>
              {member.fullName.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-lg truncate">{member.fullName}</p>
              <p className="text-xs text-white/40">{i === 0 ? 'Líder del mes 🏆' : i === 1 ? '2do lugar' : i === 2 ? '3er lugar' : ''}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black tabular-nums">{member.checkIns}</p>
              <p className="text-[10px] text-white/40 uppercase tracking-wider">Visitas</p>
            </div>
          </div>
        ))}
        {data.ranking.length === 0 && <div className="text-center py-16 text-white/20 text-lg">Sin datos este mes</div>}
      </div>
    </SectionWrapper>
  )
}

function ClassesSection({ data }: { data: Awaited<ReturnType<typeof getTvData>> }) {
  return (
    <SectionWrapper>
      <SectionTitle icon={Calendar} label="Próximas clases — Hoy" />
      <div className="mt-8 grid grid-cols-2 gap-5">
        {data.upcomingClasses.map((cls, i) => {
          const fillPercent = cls.capacity > 0 ? Math.round((cls.bookedCount / cls.capacity) * 100) : 0
          return (
            <div
              key={i}
              className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-6 flex flex-col gap-4 hover:bg-white/[0.05] transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-4 rounded-full shrink-0" style={{ backgroundColor: cls.color }} />
                  <div>
                    <h3 className="text-xl font-black">{cls.className}</h3>
                    <p className="text-sm text-white/40 flex items-center gap-1.5 mt-0.5">
                      <MapPin className="size-3.5" />
                      {cls.room}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black tabular-nums">{cls.startTime}</p>
                  <p className="text-[10px] text-white/40">{cls.endTime}</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-white/50">{cls.bookedCount} reservados</span>
                  <span className="font-semibold">{cls.availableSpots > 0 ? `${cls.availableSpots} libres` : 'Completo'}</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all duration-500', fillPercent >= 90 ? 'bg-red-500' : fillPercent >= 60 ? 'bg-amber-500' : 'bg-emerald-500')}
                    style={{ width: `${fillPercent}%` }}
                  />
                </div>
              </div>
            </div>
          )
        })}
        {data.upcomingClasses.length === 0 && (
          <div className="col-span-2 text-center py-16 text-white/20 text-lg">No hay clases programadas para hoy</div>
        )}
      </div>
    </SectionWrapper>
  )
}

function GallerySection({ data, galleryIndex }: { data: Awaited<ReturnType<typeof getTvData>>; galleryIndex: number }) {
  const items = data.mediaItems ?? []

  if (items.length === 0) {
    return (
      <SectionWrapper>
        <SectionTitle icon={ImageIcon} label="Galería" />
        <div className="text-center py-16 text-white/20 text-lg mt-8">Sin imágenes configuradas</div>
      </SectionWrapper>
    )
  }

  const current = items[galleryIndex % items.length]

  return (
    <SectionWrapper>
      <SectionTitle icon={ImageIcon} label="Galería" />
      <div className="mt-8 flex flex-col items-center gap-4">
        <div className="relative w-full max-w-4xl aspect-video rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
          <img
            src={current.imageUrl}
            alt={current.caption ?? ''}
            className="size-full object-cover transition-opacity duration-500"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 225" fill="%23333"><rect width="400" height="225"/><text x="200" y="115" text-anchor="middle" fill="%23666" font-size="14">Imagen no disponible</text></svg>'
            }}
          />
          {current.caption && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-12">
              <p className="text-xl font-bold text-white">{current.caption}</p>
            </div>
          )}
        </div>
        {/* Dots indicator */}
        {items.length > 1 && (
          <div className="flex gap-2">
            {items.map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-2 rounded-full transition-all duration-300',
                  i === (galleryIndex % items.length) ? 'w-6 bg-emerald-500' : 'w-2 bg-white/20',
                )}
              />
            ))}
          </div>
        )}
      </div>
    </SectionWrapper>
  )
}

function PromosSection({ data }: { data: Awaited<ReturnType<typeof getTvData>> }) {
  return (
    <SectionWrapper>
      <SectionTitle icon={Star} label="Promociones activas" />
      {data.activePromotions.length === 0 ? (
        <div className="text-center py-16 text-white/20 text-lg mt-8">Sin promociones activas</div>
      ) : (
        <div className="grid grid-cols-2 gap-6 mt-8">
          {data.activePromotions.map((promo) => (
            <div
              key={promo.id}
              className="bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.06] rounded-3xl p-6 flex flex-col gap-3 hover:from-white/[0.06] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-2xl bg-gradient-to-br from-amber-400/20 to-amber-600/20 flex items-center justify-center">
                  <Star className="size-6 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black">{promo.name}</h3>
                  {promo.description && <p className="text-sm text-white/50 mt-0.5 line-clamp-2">{promo.description}</p>}
                </div>
              </div>
              <div className="flex items-center gap-3 mt-auto">
                {promo.type === 'DISCOUNT' && promo.discountPercent && (
                  <span className="text-2xl font-black text-emerald-400">{promo.discountPercent}% OFF</span>
                )}
                {promo.type === 'BONUS_POINTS' && promo.rewardPoints && (
                  <span className="text-2xl font-black text-amber-400">+{promo.rewardPoints} pts</span>
                )}
                {!promo.discountPercent && !promo.rewardPoints && (
                  <span className="text-sm text-white/40">¡Aprovechá esta oportunidad!</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionWrapper>
  )
}

function PhraseSection({ phrase, sectionIndex }: { phrase: string; sectionIndex: number }) {
  return (
    <SectionWrapper>
      <div className="text-center">
        <div className="mb-6">
          <Quote className="size-16 text-emerald-500/30 mx-auto" />
        </div>
        <p className="text-4xl md:text-5xl font-bold leading-tight text-white/90">&ldquo;{phrase}&rdquo;</p>
        <p className="mt-8 text-sm text-white/30 tracking-widest uppercase">Trainix — Motivación del día</p>

        {/* QR Code placeholder */}
        <div className="mt-12 inline-flex items-center gap-4 px-6 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
          <div className="size-12 bg-white/10 rounded-xl flex items-center justify-center text-white/40 text-[8px] font-mono text-center leading-tight p-1">
            QR
            <br />
            SCAN
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-white/60">¡Sumate al gym!</p>
            <p className="text-[10px] text-white/30">Escaneá y empezá hoy</p>
          </div>
        </div>

        {/* Dots */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {SECTIONS.map((_, i) => (
            <div
              key={i}
              className={cn('h-1.5 rounded-full transition-all duration-300', i === sectionIndex ? 'w-8 bg-emerald-500' : 'w-1.5 bg-white/20')}
            />
          ))}
        </div>
      </div>
    </SectionWrapper>
  )
}

// ── Sub-components ──

function SectionWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="w-full max-w-5xl mx-auto"
      style={{ animation: 'fadeSlideIn 0.5s cubic-bezier(0.23, 1, 0.32, 1) both' }}
    >
      {children}
    </div>
  )
}

function SectionTitle({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="size-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
        <Icon className="size-5 text-emerald-400" />
      </div>
      <h2 className="text-2xl font-black tracking-tight">{label}</h2>
    </div>
  )
}

function StatCard({ icon: Icon, value, label, subtext, color }: {
  icon: React.ComponentType<{ className?: string }>
  value: number | string
  label: string
  subtext: string
  color: 'emerald' | 'blue' | 'amber'
}) {
  const colorMap = {
    emerald: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/20 text-emerald-400',
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/20 text-blue-400',
    amber: 'from-amber-500/20 to-amber-600/10 border-amber-500/20 text-amber-400',
  }
  return (
    <div className={cn('bg-gradient-to-br border rounded-3xl p-6 flex flex-col gap-3', colorMap[color])}>
      <Icon className="size-6 opacity-60" />
      <p className="text-5xl font-black tabular-nums">{value}</p>
      <div>
        <p className="font-bold text-sm">{label}</p>
        <p className="text-xs opacity-50 mt-0.5">{subtext}</p>
      </div>
    </div>
  )
}

function Ticker({ messages }: { messages: string[] }) {
  // Duplicate for seamless loop
  const doubled = [...messages, ...messages, ...messages]

  return (
    <div className="absolute bottom-8 left-0 right-0 z-10 overflow-hidden h-8">
      <div className="flex ticker-track">
        {doubled.map((msg, i) => (
          <span key={i} className="text-xs text-white/30 font-medium whitespace-nowrap px-8 flex items-center gap-3">
            <span className="size-1.5 rounded-full bg-emerald-500/50 shrink-0" />
            {msg}
          </span>
        ))}
      </div>
      <style>{`
        .ticker-track {
          animation: ticker 60s linear infinite;
          width: fit-content;
        }
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
      `}</style>
    </div>
  )
}

function LiveDot() {
  const [pulsing, setPulsing] = useState(true)
  useEffect(() => {
    const interval = setInterval(() => setPulsing((p) => !p), 1000)
    return () => clearInterval(interval)
  }, [])
  return (
    <div className="flex items-center gap-2 text-[11px] font-semibold text-emerald-400 uppercase tracking-widest">
      <span className={cn('size-2 rounded-full bg-emerald-500 transition-opacity', pulsing ? 'opacity-100' : 'opacity-40')} />
      En vivo
    </div>
  )
}

function DateTime() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])
  return (
    <div className="text-right">
      <p className="text-lg font-black tabular-nums">{time.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</p>
      <p className="text-[10px] text-white/40 uppercase tracking-wider">{time.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
    </div>
  )
}
