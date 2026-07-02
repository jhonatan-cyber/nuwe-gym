export type AttendanceStatus =
  | 'PRESENT'
  | 'LATE'
  | 'EARLY_LEAVE'
  | 'ABSENT_WITH_NOTICE'
  | 'ABSENT'

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  PRESENT: 'Presente',
  LATE: 'Tardanza',
  EARLY_LEAVE: 'Salida temprano',
  ABSENT_WITH_NOTICE: 'Ausente con aviso',
  ABSENT: 'Ausente',
}

export const ATTENDANCE_STATUS_COLORS: Record<AttendanceStatus, string> = {
  PRESENT: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  LATE: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  EARLY_LEAVE: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  ABSENT_WITH_NOTICE: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  ABSENT: 'bg-red-500/10 text-red-600 border-red-500/20',
}

export interface TodayAttendanceRow {
  employeeId: string
  employeeCode: string
  fullName: string
  position: string
  department: string | null
  status: string
  clockIn: string | null
  clockOut: string | null
  attendanceId: string | null
  attendanceStatus: string | null
}

export interface AttendanceSummary {
  present: number
  late: number
  absent: number
  notMarked: number
  total: number
}
