import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { StickyNote, Send } from 'lucide-react'
import { Button } from '#/shared/components/ui/button'
import { Textarea } from '#/shared/components/ui/textarea'
import { LoadingSpinner } from '#/shared/components/ui/loading-spinner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '#/shared/components/ui/dialog'
import {
  getTrainerObservations,
  createTrainerObservation,
} from '../server.ts'

interface TrainerObservationDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  member: { id: string; fullName: string }
}

export function TrainerObservationDialog({
  isOpen,
  onOpenChange,
  member,
}: TrainerObservationDialogProps) {
  const queryClient = useQueryClient()
  const [note, setNote] = useState('')

  const { data: observations = [], isLoading } = useQuery({
    queryKey: ['trainer-observations', member.id],
    queryFn: () => getTrainerObservations({ data: { memberId: member.id } }),
    enabled: isOpen,
  })

  const mutation = useMutation({
    mutationFn: createTrainerObservation,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['trainer-observations', member.id],
      })
      toast.success('Observación registrada')
      setNote('')
    },
    onError: () => toast.error('Error al guardar observación'),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!note.trim()) return
    mutation.mutate({ data: { memberId: member.id, note: note.trim() } })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-black flex items-center gap-2">
            <StickyNote className="size-4" />
            Observaciones — {member.fullName}
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
          {isLoading ? (
            <LoadingSpinner size="sm" label="Cargando..." />
          ) : observations.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              Sin observaciones registradas.
            </p>
          ) : (
            observations.map((obs: any) => (
              <div
                key={obs.id}
                className="p-2.5 rounded-xl bg-muted/30 border border-border/10"
              >
                <p className="text-xs leading-relaxed">{obs.note}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {new Date(obs.createdAt).toLocaleDateString('es-AR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2 pt-2 border-t border-border/10">
          <Textarea
            placeholder="Nueva observación..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="rounded-xl text-xs flex-1"
          />
          <Button
            type="submit"
            size="sm"
            disabled={!note.trim() || mutation.isPending}
            className="rounded-full self-end"
          >
            <Send className="size-3.5" />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
