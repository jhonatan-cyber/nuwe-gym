import { useState, useEffect } from 'react'
import { Sparkles, Loader2, ChevronDown, ChevronUp, AlertCircle, Bot } from 'lucide-react'
import { Button } from '#/shared/components/ui/button.tsx'
import { Card, CardHeader, CardTitle, CardContent } from '#/shared/components/ui/card.tsx'
import { getAICopilotSummary } from '../server.ts'
import { toast } from 'sonner'

interface CopilotSummaryProps {
  startDate: string
  endDate: string
}

export function CopilotSummary({ startDate, endDate }: CopilotSummaryProps) {
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  // Resetear el summary si cambia el rango de fechas
  useEffect(() => {
    setSummary(null)
  }, [startDate, endDate])

  const handleGenerate = async () => {
    setLoading(true)
    setSummary(null)
    setIsOpen(true)
    try {
      const data = await getAICopilotSummary({ data: { startDate, endDate } })
      setSummary(data)
      toast.success('¡Análisis financiero generado con éxito!')
    } catch (error) {
      console.error(error)
      toast.error('Error al generar el reporte de IA.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border border-violet-100 dark:border-violet-950 bg-linear-to-br from-violet-500/[0.02] to-fuchsia-500/[0.02] shadow-md hover:shadow-lg transition-all duration-300">
      <CardHeader className="py-4 px-6 flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-xl bg-violet-600/10 text-violet-600 flex items-center justify-center border border-violet-600/20 shadow-xs">
            <Bot className="size-4.5 animate-pulse" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100">
              Copiloto Financiero IA
              <span className="text-[9px] bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-400 font-extrabold px-1.5 py-0.5 rounded-full border border-violet-200 dark:border-violet-800 tracking-wider">
                BETA
              </span>
            </CardTitle>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Análisis ejecutivo automatizado de ingresos, asistencia y ventas.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!summary && !loading ? (
            <Button
              onClick={handleGenerate}
              size="sm"
              className="bg-violet-600 hover:bg-violet-700 text-white rounded-lg flex items-center gap-1.5 shadow-md shadow-violet-500/10 text-xs py-1 h-8"
            >
              <Sparkles className="size-3.5" />
              <span>Generar Análisis</span>
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
              className="h-8 w-8 p-0 rounded-lg"
            >
              {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </Button>
          )}
        </div>
      </CardHeader>

      {isOpen && (
        <CardContent className="px-6 pb-5 pt-0 border-t border-dashed dark:border-white/[0.04] border-black/[0.04] animate-in fade-in slide-in-from-top-1 duration-200">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-xs text-muted-foreground">
              <Loader2 className="size-4.5 animate-spin text-violet-500" />
              <span>Analizando base de datos financiera del gimnasio...</span>
            </div>
          ) : summary ? (
            <div className="space-y-4 pt-4">
              <div className="whitespace-pre-line text-[11px] leading-relaxed text-zinc-700 dark:text-zinc-300 font-normal">
                {summary}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-900 text-[9px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <AlertCircle className="size-3 text-amber-500" />
                  Los datos analizados corresponden al período seleccionado.
                </span>
                <span className="font-bold bg-zinc-100 dark:bg-zinc-900 px-1.5 py-0.5 rounded-md border text-[8px]">
                  Llama 3.3 @ Groq
                </span>
              </div>
            </div>
          ) : null}
        </CardContent>
      )}
    </Card>
  )
}
