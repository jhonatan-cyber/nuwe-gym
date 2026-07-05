import * as RechartsPrimitive from 'recharts'

export type RechartsExports = {
  ResponsiveContainer: typeof RechartsPrimitive.ResponsiveContainer
  LineChart: typeof RechartsPrimitive.LineChart
  BarChart: typeof RechartsPrimitive.BarChart
  PieChart: typeof RechartsPrimitive.PieChart
  Line: typeof RechartsPrimitive.Line
  Bar: typeof RechartsPrimitive.Bar
  Pie: typeof RechartsPrimitive.Pie
  Cell: typeof RechartsPrimitive.Cell
  XAxis: typeof RechartsPrimitive.XAxis
  YAxis: typeof RechartsPrimitive.YAxis
  CartesianGrid: typeof RechartsPrimitive.CartesianGrid
  Tooltip: typeof RechartsPrimitive.Tooltip
  Legend: typeof RechartsPrimitive.Legend
  ReferenceLine: typeof RechartsPrimitive.ReferenceLine
  Area: typeof RechartsPrimitive.Area
  AreaChart: typeof RechartsPrimitive.AreaChart
}

interface RechartsModuleProps {
  children: (R: RechartsExports) => React.ReactNode
}

const R: RechartsExports = {
  ResponsiveContainer: RechartsPrimitive.ResponsiveContainer,
  LineChart: RechartsPrimitive.LineChart,
  BarChart: RechartsPrimitive.BarChart,
  PieChart: RechartsPrimitive.PieChart,
  Line: RechartsPrimitive.Line,
  Bar: RechartsPrimitive.Bar,
  Pie: RechartsPrimitive.Pie,
  Cell: RechartsPrimitive.Cell,
  XAxis: RechartsPrimitive.XAxis,
  YAxis: RechartsPrimitive.YAxis,
  CartesianGrid: RechartsPrimitive.CartesianGrid,
  Tooltip: RechartsPrimitive.Tooltip,
  Legend: RechartsPrimitive.Legend,
  ReferenceLine: RechartsPrimitive.ReferenceLine,
  Area: RechartsPrimitive.Area,
  AreaChart: RechartsPrimitive.AreaChart,
}

export default function RechartsModule({ children }: RechartsModuleProps) {
  return <>{children(R)}</>
}
