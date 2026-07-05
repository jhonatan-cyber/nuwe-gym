import { ChevronRight, User, Play, Users, Calendar, FileText } from 'lucide-react'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '#/shared/components/ui/tooltip'
import { Button } from '#/shared/components/ui/button'
import { DataTable } from '#/shared/components/data-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/shared/components/ui/table'
import { Badge } from '#/shared/components/ui/badge'
import { ModuleLayout } from '#/shared/components/layout/module-layout.tsx'
import { WizardSidebar } from '#/features/membership-freezes/components/wizard-sidebar.tsx'
import { Step2Content } from '#/features/membership-freezes/components/step2-content.tsx'
import { Step3Content } from '#/features/membership-freezes/components/step3-content.tsx'
import { useMembershipFreezesPage } from '#/features/membership-freezes/hooks/use-membership-freezes-page.ts'
import { formatDate } from '#/shared/lib/formatters.ts'

export function MembershipFreezesPage() {
  const {
    step,
    setStep,
    searchQuery,
    setSearchQuery,
    selectedMember,
    formData,
    setFormData,
    freezes,
    frozenSubs,
    activeSubs,
    isLoading,
    createMutation,
    resumeMutation,
    selectedSub,
    calculatedEndDate,
    freezeDays,
    daysRemaining,
    isAdmin,
    isLoadingSession,
    isCashRegisterOpen,
    memberSearchResults,
    allSearchResults,
    searchingMembers,
    searchPage,
    setSearchPage,
    searchTotalPages,
    searchTotal,
    handleReset,
    handleSelectMember,
    handleSubmit,
  } = useMembershipFreezesPage()

  const getFreezeStatus = (f: { resumedAt: Date | null; endDate: Date }) => {
    if (f.resumedAt) return <Badge variant="secondary">Reanudado</Badge>
    const remaining = daysRemaining(f.endDate)
    if (remaining <= 0) return <Badge variant="outline">Finalizado</Badge>
    if (remaining <= 3)
      return <Badge variant="destructive">{remaining} días rest.</Badge>
    return (
      <Badge className="bg-sky-500/15 text-sky-600 border-sky-500/20">
        {remaining} días rest.
      </Badge>
    )
  }

  return (
    <ModuleLayout
      breadcrumb={
        <div className="flex items-center gap-1">
          <span
            className="text-muted-foreground hover:underline cursor-pointer"
            onClick={handleReset}
          >
            Congelamientos
          </span>
          <ChevronRight className="size-3 text-muted-foreground/50" />
          <span className="text-foreground">Asistente</span>
        </div>
      }
      title="Congelamientos"
      leftPanel={
        <WizardSidebar
          step={step}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          memberSearchResults={memberSearchResults}
          allSearchResults={allSearchResults}
          searchingMembers={searchingMembers}
          selectedMember={selectedMember}
          onSelectMember={handleSelectMember}
          handleReset={handleReset}
          searchPage={searchPage}
          setSearchPage={setSearchPage}
          searchTotalPages={searchTotalPages}
          searchTotal={searchTotal}
        />
      }
    >
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {step === 1 && (
          <div className="flex-1 flex flex-col items-center justify-center py-20 min-h-[400px] mx-auto w-full max-w-xl animate-in fade-in duration-300">
            <div className="size-16 rounded-3xl dark:bg-white/5 bg-black/5 flex items-center justify-center mb-5 animate-pulse">
              <User className="size-8 text-muted-foreground" />
            </div>
            <p className="text-sm font-bold text-foreground">
              Asistente de Congelamiento
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[280px] text-center leading-normal">
              Por favor, busque y seleccione un socio en el panel izquierdo para
              comenzar con el proceso de congelamiento.
            </p>
          </div>
        )}

        {step === 2 && selectedMember && (
          <Step2Content
            selectedMember={selectedMember}
            formData={formData}
            setFormData={setFormData}
            activeSubs={activeSubs}
            frozenSubsCount={frozenSubs.length}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}

        {step === 3 && selectedMember && selectedSub && (
          <Step3Content
            selectedMember={selectedMember}
            formData={formData}
            selectedSub={selectedSub}
            calculatedEndDate={calculatedEndDate}
            freezeDays={freezeDays}
            isPending={createMutation.isPending}
            isCashRegisterOpen={isCashRegisterOpen}
            isLoadingSession={isLoadingSession}
            onSubmit={handleSubmit}
            onBack={() => setStep(2)}
          />
        )}
      </div>

      {(frozenSubs.length > 0 || freezes.length > 0) && step === 1 && (
        <div className="space-y-6 mt-6">
          {frozenSubs.length > 0 && (
            <div className="transition-all duration-200">
              <div className="flex items-center gap-2 mb-3">
                <Play className="size-4 text-sky-500" />
                <h3 className="text-sm font-bold text-foreground">
                  Suscripciones congeladas
                </h3>
                <Badge className="bg-sky-500/10 text-sky-600 border-sky-500/20 font-bold text-[9px]">
                  {frozenSubs.length}
                </Badge>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Socio</TableHead>
                    <TableHead>Paquete</TableHead>
                    <TableHead>Congelado desde</TableHead>
                    <TableHead>Finaliza</TableHead>
                    <TableHead>Días rest.</TableHead>
                    {isAdmin && (
                      <TableHead className="text-right">Acciones</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {frozenSubs.map((f) => {
                    const remaining = daysRemaining(f.endDate)
                    return (
                      <TableRow key={f.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="size-4 text-muted-foreground shrink-0" />
                            <span className="font-medium">
                              {f.member.fullName}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-primary">
                            {f.subscription.package?.name || 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell>{formatDate(f.startDate)}</TableCell>
                        <TableCell>{formatDate(f.endDate)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={remaining <= 3 ? 'destructive' : 'secondary'}
                          >
                            {remaining} días
                          </Badge>
                        </TableCell>
                        {isAdmin && (
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (
                                  confirm(
                                    '¿Reanudar esta suscripción anticipadamente?',
                                  )
                                ) {
                                  resumeMutation.mutate({
                                    data: { freezeId: f.id },
                                  })
                                }
                              }}
                            >
                              <Play className="size-3.5 mr-1" />
                              Reanudar
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {freezes.length > 0 && (
            <div className="transition-all duration-200">
              <div className="mb-3">
                <h3 className="text-sm font-bold text-foreground">
                  Historial de congelamientos
                </h3>
              </div>
              <TooltipProvider delayDuration={200}>
                <DataTable
                  columns={[
                    {
                      key: 'member',
                      label: 'Socio',
                      sortable: true,
                      sortValue: (f: (typeof freezes)[number]) =>
                        f.member.fullName,
                      render: (f: (typeof freezes)[number]) => (
                        <div className="flex items-center gap-2">
                          <Users className="size-4 text-muted-foreground shrink-0" />
                          <div>
                            <div className="font-medium">
                              {f.member.fullName}
                            </div>
                            {f.subscription.member.email && (
                              <div className="text-xs text-muted-foreground">
                                {f.subscription.member.email}
                              </div>
                            )}
                          </div>
                        </div>
                      ),
                    },
                    {
                      key: 'package',
                      label: 'Paquete',
                      sortable: true,
                      sortValue: (f: (typeof freezes)[number]) =>
                        f.subscription.package?.name || '',
                      render: (f: (typeof freezes)[number]) => (
                        <span className="font-medium text-primary">
                          {f.subscription.package?.name || 'N/A'}
                        </span>
                      ),
                    },
                    {
                      key: 'start',
                      label: (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-default">Inicio</span>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">
                            <p>Fecha de inicio del congelamiento</p>
                          </TooltipContent>
                        </Tooltip>
                      ),
                      sortable: true,
                      sortValue: (f: (typeof freezes)[number]) =>
                        f.startDate.getTime(),
                      render: (f: (typeof freezes)[number]) => (
                        <span className="inline-flex items-center gap-1.5 text-xs">
                          <Calendar className="size-3 text-muted-foreground" />
                          {formatDate(f.startDate)}
                        </span>
                      ),
                    },
                    {
                      key: 'end',
                      label: (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-default">Fin</span>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">
                            <p>Fecha de fin del congelamiento</p>
                          </TooltipContent>
                        </Tooltip>
                      ),
                      sortable: true,
                      sortValue: (f: (typeof freezes)[number]) =>
                        f.endDate.getTime(),
                      render: (f: (typeof freezes)[number]) => (
                        <span className="inline-flex items-center gap-1.5 text-xs">
                          <Calendar className="size-3 text-muted-foreground" />
                          {formatDate(f.endDate)}
                        </span>
                      ),
                    },
                    {
                      key: 'reason',
                      label: (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-default">Motivo</span>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">
                            <p>Razón del congelamiento de membresía</p>
                          </TooltipContent>
                        </Tooltip>
                      ),
                      sortable: true,
                      sortValue: (f: (typeof freezes)[number]) =>
                        f.reason || '',
                      render: (f: (typeof freezes)[number]) => (
                        <span className="inline-flex items-center gap-1.5 max-w-[200px] truncate">
                          <FileText className="size-3 text-muted-foreground shrink-0" />
                          <span className="truncate">{f.reason || '—'}</span>
                        </span>
                      ),
                    },
                    {
                      key: 'status',
                      label: (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-default">Estado</span>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">
                            <p>Estado actual del congelamiento</p>
                          </TooltipContent>
                        </Tooltip>
                      ),
                      sortable: true,
                      sortValue: (f: (typeof freezes)[number]) =>
                        f.resumedAt
                          ? 2
                          : new Date(f.endDate).getTime(),
                      render: (f: (typeof freezes)[number]) =>
                        getFreezeStatus(f),
                    },
                    ...(isAdmin
                      ? [
                          {
                            key: 'actions' as string,
                            label: 'Acciones',
                            className: 'text-right' as string,
                            render: (f: (typeof freezes)[number]) => {
                              const remaining = daysRemaining(f.endDate)
                              return !f.resumedAt && remaining > 0 ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        if (
                                          confirm(
                                            '¿Reanudar esta suscripción anticipadamente?',
                                          )
                                        ) {
                                          resumeMutation.mutate({
                                            data: { freezeId: f.id },
                                          })
                                        }
                                      }}
                                    >
                                      <Play className="size-3.5 mr-1" />{' '}
                                      Reanudar
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent side="bottom">
                                    <p>Reanudar suscripción anticipadamente</p>
                                  </TooltipContent>
                                </Tooltip>
                              ) : null
                            },
                          },
                        ]
                      : []),
                  ]}
                  data={freezes}
                  isLoading={isLoading}
                  loadingMessage="Cargando congelamientos..."
                  emptyMessage="No hay congelamientos registrados."
                  keyExtractor={(f: (typeof freezes)[number]) => f.id}
                />
              </TooltipProvider>
            </div>
          )}
        </div>
      )}
    </ModuleLayout>
  )
}
