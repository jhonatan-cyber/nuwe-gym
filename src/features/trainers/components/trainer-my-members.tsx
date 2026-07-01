import { useState } from 'react'
import { Phone, Mail, StickyNote, ClipboardList } from 'lucide-react'
import { Button } from '#/shared/components/ui/button'
import { DataTable } from '#/shared/components/data-table.tsx'
import { TrainerAIRoutineDialog } from './trainer-ai-routine-dialog.tsx'
import { TrainerObservationDialog } from './trainer-observation-dialog.tsx'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '#/shared/components/ui/dialog'
import { EvaluationsSection } from '#/features/evaluations/components/evaluations-section.tsx'

interface TrainerMyMembersProps {
  members: any[]
}

export function TrainerMyMembers({ members }: TrainerMyMembersProps) {
  const [obsMember, setObsMember] = useState<any>(null)
  const [evalMember, setEvalMember] = useState<any>(null)

  return (
    <>
      <DataTable
        columns={[
          {
            key: 'member',
            label: 'Socio',
            render: (member: any) => (
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-full bg-linear-to-br from-primary/10 to-primary/5 border border-primary/10 flex items-center justify-center font-bold text-[10px] uppercase shrink-0 text-primary tracking-wider shadow-inner">
                  {member.fullName
                    .split(' ')
                    .map((n: string) => n[0])
                    .slice(0, 2)
                    .join('')}
                </div>
                <div>
                  <p className="font-bold text-sm">{member.fullName}</p>
                  {member.documentNumber && (
                    <p className="text-[10px] text-muted-foreground">
                      CI: {member.documentNumber}
                    </p>
                  )}
                </div>
              </div>
            ),
          },
          {
            key: 'phone',
            label: 'Teléfono',
            render: (member: any) => (
              <span className="inline-flex items-center gap-1.5">
                <Phone className="size-3 text-muted-foreground" />
                {member.phone || '\u2014'}
              </span>
            ),
          },
          {
            key: 'email',
            label: 'Email',
            render: (member: any) => (
              <span className="inline-flex items-center gap-1.5">
                <Mail className="size-3 text-muted-foreground" />
                {member.email || '\u2014'}
              </span>
            ),
          },
          {
            key: 'actions',
            label: 'Acciones',
            render: (member: any) => (
              <div className="flex items-center gap-1 pr-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 rounded-full text-[10px] gap-1"
                  onClick={() => setObsMember(member)}
                >
                  <StickyNote className="size-3" /> Notas
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 rounded-full text-[10px] gap-1"
                  onClick={() => setEvalMember(member)}
                >
                  <ClipboardList className="size-3" /> Evaluar
                </Button>
                <TrainerAIRoutineDialog member={member} />
              </div>
            ),
          },
        ]}
        data={members}
        keyExtractor={(m: any) => m.id}
        emptyMessage="No tenés socios asignados."
        skeletonRows={5}
      />

      {obsMember && (
        <TrainerObservationDialog
          isOpen={!!obsMember}
          onOpenChange={(open) => {
            if (!open) setObsMember(null)
          }}
          member={obsMember}
        />
      )}

      {evalMember && (
        <Dialog
          open={!!evalMember}
          onOpenChange={(open) => {
            if (!open) setEvalMember(null)
          }}
        >
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-black text-lg">
                Evaluación Física — {evalMember.fullName}
              </DialogTitle>
            </DialogHeader>
            <EvaluationsSection memberId={evalMember.id} />
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
