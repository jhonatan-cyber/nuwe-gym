import { useState, useRef, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Sparkles, Send, Loader2, MessageSquare, Bot } from 'lucide-react'
import { askAnalytics } from '#/features/analytics/server.ts'
import { Button } from '#/shared/components/ui/button'
import { Input } from '#/shared/components/ui/input'

export function AnalyticsQueryBar() {
  const [query, setQuery] = useState('')
  const [submitted, setSubmitted] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const { data, isFetching } = useQuery({
    queryKey: ['analytics-query', submitted],
    queryFn: () => askAnalytics({ data: { query: submitted } }),
    enabled: submitted.length > 0,
  })

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const trimmed = query.trim()
      if (trimmed) setSubmitted(trimmed)
    },
    [query],
  )

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
        <Bot className="size-3" />
        Preguntale a la IA
      </p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ej: cuantos socios hay, producto mas vendido, stock bajo..."
            className="pl-9 h-9 text-xs"
          />
        </div>
        <Button
          type="submit"
          size="icon"
          disabled={isFetching || !query.trim()}
          className="size-9 shrink-0"
        >
          {isFetching ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Send className="size-3.5" />
          )}
        </Button>
      </form>

      {data && (
        <div className="flex items-start gap-2 p-3 rounded-xl border dark:border-white/[0.06] border-black/[0.06] bg-primary/[0.03]">
          <MessageSquare className="size-3.5 text-primary mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-bold text-foreground leading-relaxed">
              {data.answer}
            </p>
            {data.intent?.startsWith('ai:') && (
              <p className="text-[9px] text-muted-foreground/50 mt-1 font-mono">
                AI mode · {data.intent.replace('ai:', '')}
              </p>
            )}
            {data.intent && !data.intent.startsWith('ai:') && (
              <p className="text-[9px] text-muted-foreground/50 mt-1 font-mono">
                {data.intent}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
