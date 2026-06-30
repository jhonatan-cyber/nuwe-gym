import { Phone, Mail } from 'lucide-react'
import { DataTable } from '#/shared/components/data-table.tsx'
import { TrainerAIRoutineDialog } from './trainer-ai-routine-dialog.tsx'

interface TrainerMyMembersProps {
  members: any[]
}

export function TrainerMyMembers({ members }: TrainerMyMembersProps) {
  return (
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
          label: 'Planificación',
          render: (member: any) => (
            <div className="flex justify-start pr-2">
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
  )
}
