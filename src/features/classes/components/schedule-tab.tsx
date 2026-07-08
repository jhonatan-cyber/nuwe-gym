import { Card, CardContent, CardHeader, CardTitle } from '#/shared/components/ui/card'
import { DAY_NAMES, TIME_SLOTS } from '../constants.ts'

interface ScheduleTabProps {
  weeklySchedule: any[]
  onOpenBookingDialog: (schedule: any) => void
}

export function ScheduleTab({
  weeklySchedule,
  onOpenBookingDialog,
}: ScheduleTabProps) {
  return (
    <Card className="transition-all duration-200">
      <CardHeader>
        <CardTitle>Horario Semanal</CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-auto">
        <div className="relative min-w-[800px]">
          <div className="flex sticky top-0 z-10 bg-background">
            <div className="w-20 shrink-0 border-b border-r" />
            {[1, 2, 3, 4, 5, 6, 0].map((day) => (
              <div
                key={day}
                className="flex-1 border-b px-2 py-2 text-xs font-medium text-center"
              >
                {DAY_NAMES[day]}
              </div>
            ))}
          </div>
          <div className="relative">
            {TIME_SLOTS.map((slot) => (
              <div key={slot} className="flex" style={{ height: '60px' }}>
                <div className="w-20 shrink-0 border-b border-r text-xs text-muted-foreground text-right pr-2 leading-[60px]">
                  {slot}
                </div>
                {[1, 2, 3, 4, 5, 6, 0].map((day) => (
                  <div
                    key={`${day}-${slot}`}
                    className="flex-1 border-b hover:bg-muted/30 transition-colors"
                  />
                ))}
              </div>
            ))}
            <div className="absolute inset-0 pointer-events-none">
              {weeklySchedule.map((schedule) => {
                const [startHour, startMin] = schedule.startTime
                  .split(':')
                  .map(Number)
                const [endHour, endMin] = schedule.endTime
                  .split(':')
                  .map(Number)
                const topOffset = (startHour - 6) * 60 + startMin
                const height =
                  (endHour - startHour) * 60 + (endMin - startMin)
                const colIndex =
                  schedule.dayOfWeek === 0 ? 6 : schedule.dayOfWeek - 1
                return (
                  <button
                    key={schedule.id}
                    className="absolute pointer-events-auto rounded-md px-2 py-1 text-xs text-white overflow-hidden text-left transition-opacity hover:opacity-80 cursor-pointer border border-white/20"
                    style={{
                      backgroundColor: schedule.class.color,
                      top: `${topOffset}px`,
                      height: `${Math.max(height, 30)}px`,
                      left: `calc(80px + (100% - 80px) * ${colIndex} / 7 + 2px)`,
                      width: 'calc((100% - 80px) / 7 - 4px)',
                      zIndex: 5,
                    }}
                    onClick={() => onOpenBookingDialog(schedule)}
                  >
                    <div className="font-medium truncate">
                      {schedule.class.name}
                    </div>
                    <div className="opacity-80 truncate">
                      {schedule.startTime} - {schedule.endTime}
                    </div>
                    {schedule.room && (
                      <div className="opacity-60 truncate">
                        Sala: {schedule.room}
                      </div>
                    )}
                    {schedule.trainer && (
                      <div className="opacity-60 truncate">
                        {schedule.trainer.user.name}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
