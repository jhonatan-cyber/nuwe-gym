interface ImcBadgeProps { imc: number }

const IMC_RANGES = [
  { max: 18.5, label: 'Bajo peso',  color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30' },
  { max: 25,   label: 'Normal',     color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' },
  { max: 30,   label: 'Sobrepeso',  color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30' },
  { max: Infinity, label: 'Obesidad', color: 'text-red-600 bg-red-50 dark:bg-red-950/30' },
]

export function ImcBadge({ imc }: ImcBadgeProps) {
  const range = IMC_RANGES.find((r) => imc < r.max) ?? IMC_RANGES[IMC_RANGES.length - 1]
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${range.color}`}>
      {range.label}
    </span>
  )
}

/** Calcula IMC y devuelve valor + label */
export function calcImc(weightKg: number, heightCm: number) {
  const imc = weightKg / Math.pow(heightCm / 100, 2)
  const range = IMC_RANGES.find((r) => imc < r.max) ?? IMC_RANGES[IMC_RANGES.length - 1]
  return { imc: parseFloat(imc.toFixed(1)), label: range.label }
}
