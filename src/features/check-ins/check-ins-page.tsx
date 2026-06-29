import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DoorOpen, Search, UserCheck, Clock } from 'lucide-react'
import { toast } from 'sonner'
import {
  getRecentCheckIns,
  createCheckIn,
} from '#/features/check-ins/server.ts'
import { getMembers } from '#/features/members/server.ts'
import { useCurrentBranch } from '#/shared/hooks/use-current-branch.ts'
import { formatDateTime, formatDate } from '#/shared/lib/formatters.ts'

import { Button } from '#/shared/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '#/shared/components/ui/card'
import { Input } from '#/shared/components/ui/input'
import { Badge } from '#/shared/components/ui/badge'
import { LoadingSpinner } from '#/shared/components/ui/loading-spinner'
import { EmptyState } from '#/shared/components/ui/empty-state'
import { MemberAvatar } from '#/shared/components/ui/member-avatar'
import { ConfirmDialog } from '#/shared/components/ui/confirm-dialog'

export function CheckInsPage() {
  const queryClient = useQueryClient()

  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setTimeout(() => setDebouncedSearch(e.target.value), 300)
  }

  const { branchId } = useCurrentBranch()

  const { data: checkInsList = [], isLoading: isLoadingCheckIns } = useQuery({
    queryKey: ['check-ins', branchId],
    queryFn: () => getRecentCheckIns({ data: { branchId } }),
    enabled: !!branchId,
    refetchInterval: 10000,
  })

  const { data: searchResults = [], isFetching: isSearching } = useQuery({
    queryKey: ['members-search', debouncedSearch],
    queryFn: () => getMembers({ data: { search: debouncedSearch } }),
    enabled: debouncedSearch.length >= 2,
  })

  const createMutation = useMutation({
    mutationFn: createCheckIn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['check-ins'] })
      setSearchQuery('')
      setDebouncedSearch('')
      toast.success('Ingreso registrado con éxito')
    },
    onError: () => toast.error('Error al registrar el ingreso'),
  })

  const [pendingMemberId, setPendingMemberId] = useState<string | null>(null)

  const handleCheckIn = (memberId: string, hasAccess: boolean) => {
    if (!hasAccess) {
      setPendingMemberId(memberId)
      return
    }
    createMutation.mutate({ data: { memberId, branchId } })
  }

  const handleConfirmCheckIn = () => {
    if (pendingMemberId !== null) {
      createMutation.mutate({ data: { memberId: pendingMemberId } })
      setPendingMemberId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Control de Ingresos
        </h1>
        <p className="text-muted-foreground">
          Buscá socios por CI o nombre para registrar su acceso al gimnasio.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_300px] lg:grid-cols-[1fr_400px]">
        <div className="space-y-4">
          <Card className="border-primary/20 shadow-md">
            <CardContent className="p-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Escaneá el código o ingresá CI / Nombre del socio..."
                  className="pl-10 h-12 text-lg"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  autoFocus
                />
              </div>

              {debouncedSearch.length >= 2 && (
                <div className="mt-6 space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Resultados de búsqueda
                  </h3>
                  {isSearching ? (
                    <LoadingSpinner size="sm" label="Buscando..." />
                  ) : searchResults.length === 0 ? (
                    <EmptyState
                      icon={Search}
                      title="Sin resultados"
                      description="No se encontraron socios."
                    />
                  ) : (
                    <div className="grid gap-3">
                      {searchResults.map((member) => {
                        const hasSub = member.subscriptions.length > 0
                        const activeSub = member.subscriptions[0]
                        const isSubActive =
                          hasSub && new Date(activeSub.endDate) >= new Date()

                        return (
                          <div
                            key={member.id}
                            className="flex items-center justify-between p-4 rounded-xl border bg-card hover:border-primary/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <MemberAvatar
                                name={member.fullName}
                                photoUrl={member.photoUrl}
                                size={12}
                              />
                              <div className="flex flex-col">
                                <span className="font-semibold text-lg">
                                  {member.fullName}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  CI: {member.documentNumber}
                                </span>
                                <div className="mt-1">
                                  {isSubActive ? (
                                    <Badge className="bg-emerald-500/15 text-emerald-600 border-none">
                                      Vence: {formatDate(activeSub.endDate)}
                                    </Badge>
                                  ) : (
                                    <Badge
                                      variant="destructive"
                                      className="border-none"
                                    >
                                      Sin acceso / Vencido
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <Button
                              size="lg"
                              className="h-14 w-14 rounded-full p-0"
                              variant={isSubActive ? 'default' : 'secondary'}
                              onClick={() =>
                                handleCheckIn(member.id, isSubActive)
                              }
                              disabled={createMutation.isPending}
                            >
                              <DoorOpen className="size-6" />
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="size-5 text-muted-foreground" />
                Últimos Ingresos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingCheckIns ? (
                <LoadingSpinner size="sm" label="Cargando..." />
              ) : checkInsList.length === 0 ? (
                <EmptyState
                  icon={Clock}
                  title="Sin ingresos"
                  description="No hay ingresos recientes."
                />
              ) : (
                <div className="space-y-4">
                  {checkInsList.map((checkIn) => (
                    <div
                      key={checkIn.id}
                      className="flex items-start justify-between border-b pb-3 last:border-0 last:pb-0"
                    >
                      <div className="flex items-center gap-2">
                        <MemberAvatar
                          name={checkIn.member.fullName}
                          photoUrl={checkIn.member.photoUrl}
                          size={8}
                        />
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-sm">
                            {checkIn.member.fullName}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <UserCheck className="size-3" />
                            por {checkIn.registeredBy.name || 'Sistema'}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-medium tabular-nums text-muted-foreground bg-muted px-2 py-1 rounded-md">
                        {formatDateTime(checkIn.checkedInAt).split(', ')[1] ||
                          formatDateTime(checkIn.checkedInAt)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <ConfirmDialog
        open={pendingMemberId !== null}
        onOpenChange={() => setPendingMemberId(null)}
        title="Ingreso sin suscripción activa"
        description="El socio NO TIENE una suscripción activa. ¿Permitir el ingreso de todas formas?"
        confirmText="Permitir Ingreso"
        variant="default"
        onConfirm={handleConfirmCheckIn}
      />
    </div>
  )
}
