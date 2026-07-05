import { getInitials } from '../utils.ts'

interface MemberHeaderCardProps {
  member: {
    fullName: string
    photoUrl?: string | null
    documentNumber?: string | null
    phone?: string | null
  }
  extraInfo?: string
}

export function MemberHeaderCard({ member, extraInfo }: MemberHeaderCardProps) {
  return (
    <div className="bg-muted/50 rounded-2xl p-4.5 border border-border/10 flex flex-col items-center justify-center text-center gap-3 w-full">
      {member.photoUrl ? (
        <img
          src={member.photoUrl}
          alt={member.fullName}
          className="size-12 rounded-full object-cover shrink-0 border border-foreground/10 shadow-sm"
        />
      ) : (
        <div className="size-12 rounded-full bg-gradient-to-br from-foreground/10 to-foreground/5 border border-foreground/10 flex items-center justify-center font-bold text-sm uppercase shrink-0 text-foreground tracking-wider shadow-inner">
          {getInitials(member.fullName)}
        </div>
      )}
      <div className="min-w-0">
        <p className="font-bold text-sm leading-tight text-foreground">
          {member.fullName}
        </p>
        <p className="text-[10px] font-semibold text-muted-foreground mt-1 flex items-center justify-center gap-2">
          <span>CI: {member.documentNumber || '—'}</span>
          {member.phone && (
            <>
              <span className="size-1 rounded-full bg-muted-foreground/30" />
              <span>Teléfono: {member.phone}</span>
            </>
          )}
          {extraInfo && (
            <>
              <span className="size-1 rounded-full bg-muted-foreground/30" />
              <span>{extraInfo}</span>
            </>
          )}
        </p>
      </div>
    </div>
  )
}
