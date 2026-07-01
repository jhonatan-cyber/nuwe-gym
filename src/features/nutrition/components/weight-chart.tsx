import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '#/shared/components/ui/card'

interface WeightEntry {
  recordedAt: string | Date
  weightKg: string | number
  heightCm?: string | number | null
}

interface WeightChartProps {
  entries: WeightEntry[]
}

export function WeightChart({ entries }: WeightChartProps) {
  // Ordenar de más antiguo a más reciente para el gráfico
  const sorted = [...entries]
    .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())

  const chartData = sorted.map((e) => ({
    date: new Date(e.recordedAt).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }),
    peso: parseFloat(Number(e.weightKg).toFixed(1)),
  }))

  const weights = chartData.map((d) => d.peso)
  const minW = Math.floor(Math.min(...weights) - 2)
  const maxW = Math.ceil(Math.max(...weights) + 2)

  // Promedio para línea de referencia
  const avg = parseFloat((weights.reduce((a, b) => a + b, 0) / weights.length).toFixed(1))

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold">Evolución de Peso</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" className="text-xs text-muted-foreground" tick={{ fontSize: 10 }} />
              <YAxis domain={[minW, maxW]} className="text-xs text-muted-foreground" tick={{ fontSize: 10 }} unit=" kg" />
              <Tooltip
                contentStyle={{ borderRadius: '10px', border: '1px solid hsl(var(--border))', fontSize: 12 }}
                formatter={(value) => [`${value} kg`, 'Peso']}
              />
              <ReferenceLine y={avg} stroke="#6366f1" strokeDasharray="4 4"
                label={{ value: `Prom: ${avg}kg`, position: 'right', fontSize: 10, fill: '#6366f1' }} />
              <Line
                type="monotone" dataKey="peso" stroke="#10b981"
                strokeWidth={2.5} dot={{ fill: '#10b981', r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
