export function getAuditContext(
  session: { user?: { id?: string; name?: string; role?: string } } | null,
) {
  if (!session?.user) {
    return { userId: 'SYSTEM', userName: 'SYSTEM', userRole: 'SYSTEM' }
  }
  return {
    userId: session.user.id ?? 'SYSTEM',
    userName: session.user.name ?? 'SYSTEM',
    userRole: session.user.role ?? 'SYSTEM',
  }
}
