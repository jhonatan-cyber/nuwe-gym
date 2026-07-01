import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Calendar, Clock, Users } from 'lucide-react'
import { getTrainerSchedule } from '#/features/trainers/server.ts'
import { TrainerAvailabilityDialog } from '#/features/trainers/components/trainer-availability-dialog.tsx'
import {
  Card,
  CardContent,
} from '#/shared/components/ui/card'
import { Skeleton } from '#/shared/components/ui/skeleton'
import { EmptyState } from '#/shared/components/ui/empty-state'
import { cn } from '#/shared/lib/utils.ts'
import type { TrainerCalendarEntry } from '#/features/trainers/types.ts'

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

const HOURS = Array.from({ length: 14 }, (_, i) => {
  const h = i + 6
  return `${h.toString().padStart(2, '0')}:00`
})

const TRAINER_COLORS = [
  'bg-blue-500/20 border-blue-500 text-blue-300',
  'bg-emerald-500/20 border-emerald-500 text-emerald-300',
  'bg-violet-500/20 border-violet-500 text-violet-300',
  'bg-amber-500/20 border-amber-500 text-amber-300',
  'bg-rose-500/20 border-rose-500 text-rose-300',
  'bg-cyan-500/20 border-cyan-500 text-cyan-300',
]

interface TrainerCalendarViewProps {
  userRole: string
}

export function TrainerCalendarView({ userRole }: TrainerCalendarViewProps) {
  const [selectedTrainer, setSelectedTrainer] = useState<TrainerCalendarEntry | null>(null)
  const [availabilityOpen, setAvailabilityOpen] = useState(false)
  const isAdmin = userRole === 'ADMIN'

  const { data: schedule = [], isLoading } = useQuery({
    queryKey: ['trainer-schedule'],
    queryFn: () => getTrainerSchedule(),
  })

  const slotMap = useMemo(() => {
    const map = new Map<string, { trainerId: string; entry: TrainerCalendarEntry; dayOfWeek: number; startTime: string; endTime: string }[]>()
    for (const entry of schedule) {
      for (const slot of entry.availability) {
        for (let h = parseInt(slot.startTime.split(':')[0]); h < parseInt(slot.endTime.split(':')[0]); h++) {
          const key = `${slot.dayOfWeek}-${h}`
          if (!map.has(key)) map.set(key, [])
          map.get(key)!.push({
            trainerId: entry.id,
            entry,
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
          })
        }
      }
    }
    return map
  }, [schedule])

  function handleSlotClick(entry: TrainerCalendarEntry) {
    setSelectedTrainer(entry)
    setAvailabilityOpen(true)
  }

  function hasActiveSlot(dayIdx: number, hour: string): boolean {
    const h = parseInt(hour.split(':')[0])
    const key = `${dayIdx + 1}-${h}`
    return slotMap.has(key) && slotMap.get(key)!.length > 0
  }

  function getSlotTrainers(dayIdx: number, hour: string) {
    const h = parseInt(hour.split(':')[0])
    const key = `${dayIdx + 1}-${h}`
    return slotMap.get(key) || []
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (schedule.length === 0) {
    return (
      <EmptyState icon={Calendar} title="Sin disponibilidad" description="No hay entrenadores con disponibilidad registrada." />
    )
  }

  return (
    <>
      <Card className="overflow-hidden border-border/30">
        <CardContent className="p-0 overflow-auto max-h-[calc(100vh-16rem)]">
            <div className="min-w-[800px]">
              <div className="grid grid-cols-[80px_repeat(7,1fr)] bg-muted/30">
                <div className="h-12 flex items-center justify-center text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-r border-border/20">
                  <Clock className="size-3 mr-1" />
                  Hora
                </div>
                {DAYS.map((day, i) => (
                  <div
                    key={day}
                    className={cn(
                      'h-12 flex items-center justify-center text-xs font-bold border-b border-border/20',
                      i < 6 && 'border-r border-border/20',
                    )}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {HOURS.map((hour) => (
                <div key={hour} className="grid grid-cols-[80px_repeat(7,1fr)]">
                  <div className="h-14 flex items-center justify-center text-[11px] font-medium text-muted-foreground border-r border-b border-border/10">
                    {hour}
                  </div>
                  {DAYS.map((_, dayIdx) => {
                    const trainers = getSlotTrainers(dayIdx, hour)
                    return (
                      <div
                        key={dayIdx}
                        className={cn(
                          'h-14 border-b border-border/10 p-1 relative transition-colors',
                          dayIdx < 6 && 'border-r border-border/10',
                          hasActiveSlot(dayIdx, hour) && 'bg-primary/5',
                        )}
                      >
                        {trainers.slice(0, 2).map((slot) => (
                          <button
                            key={slot.trainerId}
                            type="button"
                            onClick={() => handleSlotClick(slot.entry)}
                            className={cn(
                              'w-full text-left text-[10px] leading-tight px-1.5 py-0.5 rounded-md border mb-0.5 truncate transition-colors hover:brightness-110',
                              TRAINER_COLORS[schedule.findIndex((e) => e.id === slot.trainerId) % TRAINER_COLORS.length],
                            )}
                          >
                            {slot.entry.name}
                          </button>
                        ))}
                        {trainers.length > 2 && (
                          <span className="text-[10px] text-muted-foreground pl-1">
                            +{trainers.length - 2}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3 mt-2">
        {schedule.map((entry, i) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => handleSlotClick(entry)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/20 text-xs hover:bg-muted/50 transition-colors"
          >
            <span className={cn('size-2.5 rounded-full', TRAINER_COLORS[i % TRAINER_COLORS.length].split(' ')[0])} />
            {entry.name}
            <span className="text-muted-foreground">·</span>
            <Users className="size-3 text-muted-foreground" />
            <span className="text-muted-foreground">{entry.memberCount}</span>
          </button>
        ))}
      </div>

      <TrainerAvailabilityDialog
        open={availabilityOpen}
        onOpenChange={setAvailabilityOpen}
        trainer={selectedTrainer}
        isAdmin={isAdmin}
      />
    </>
  )
}
