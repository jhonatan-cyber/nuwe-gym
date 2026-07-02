export interface ScheduleSlot {
  id: string
  dayOfWeek: number
  startTime: string
  endTime: string
  scheduleType: 'REGULAR' | 'ROTATING'
}

export interface EmployeeWithSchedule {
  id: string
  employeeCode: string
  fullName: string
  position: string
  department: string | null
  schedules: ScheduleSlot[]
}

export const DAY_LABELS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'] as const

export const DAY_LABELS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'] as const
