interface MemberAvatarProps {
  name: string
  photoUrl?: string | null
  size?: number
}

export function MemberAvatar({ name, photoUrl, size = 9 }: MemberAvatarProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt=""
        className={`size-${size} rounded-full object-cover bg-muted shrink-0`}
      />
    )
  }

  return (
    <div
      className={`size-${size} rounded-full bg-gradient-to-br from-foreground/10 to-foreground/5 flex items-center justify-center shrink-0 text-[10px] font-bold text-muted-foreground`}
    >
      {initials}
    </div>
  )
}
