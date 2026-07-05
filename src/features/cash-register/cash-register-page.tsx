import { useState } from 'react'
import {
  ChevronRight,
  List,
  WalletCards,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Lock,
  Unlock,
  Store,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Route as authedRoute } from '#/routes/_authed.tsx'
import { useCurrentBranch } from '#/shared/hooks/use-current-branch.ts'
import { ModuleLayout } from '#/shared/components/layout/module-layout.tsx'
import { ToggleGroup, ToggleGroupItem } from '#/shared/components/ui/toggle-group'
import { StatCard } from '#/shared/components/ui/stat-card'
import { LoadingSpinner } from '#/shared/components/ui/loading-spinner'
import { EmptyState } from '#/shared/components/ui/empty-state'
import { Button } from '#/shared/components/ui/button'
import { Badge } from '#/shared/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '#/shared/components/ui/alert-dialog'
import { useCashRegister } from '#/features/cash-register/hooks/use-cash-register.ts'
import { CashRegisterMovementsTable } from '#/features/cash-register/components/cash-register-movements-table.tsx'
import { CashRegisterHistoryTable } from '#/features/cash-register/components/cash-register-history-table.tsx'
import { CashRegisterOpenDialog } from '#/features/cash-register/components/cash-register-open-dialog.tsx'
import { CashRegisterCloseDialog } from '#/features/cash-register/components/cash-register-close-dialog.tsx'
import { CashRegisterMovementDialog } from '#/features/cash-register/components/cash-register-movement-dialog.tsx'
import { CashRegisterHistoryDetailDialog } from '#/features/cash-register/components/cash-register-history-detail-dialog.tsx'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '#/shared/components/ui/card'
import { formatCurrency } from '#/shared/lib/formatters.ts'

export function CashRegisterPage() {
  const { session } = authedRoute.useRouteContext()
  const userRole = session.user.role
  const isAdmin = userRole === 'ADMIN'
  const { branchId } = useCurrentBranch()
  const c = useCashRegister(branchId, isAdmin)
  const [activeTab, setActiveTab] = useState<'movements' | 'history'>('movements')

  function handleOpenClick() {
    if (!branchId) {
      toast.error('Seleccioná una sucursal específica para abrir caja')
      return
    }
    c.setIsOpenModalOpen(true)
  }

  return (
    <>
      <ModuleLayout
        breadcrumb={
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Caja</span>
            <ChevronRight className="size-3 text-muted-foreground/50" />
            <span className="text-foreground">Control</span>
          </div>
        }
        title="Control de Caja"
        leftPanel={
          <div className="flex flex-col gap-6 z-10 w-full">
            <ToggleGroup type="single" value="list">
              <ToggleGroupItem value="list">
                <List className="size-3.5" /> Caja
              </ToggleGroupItem>
            </ToggleGroup>

            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Métricas
                </p>
                <Badge
                  className={c.currentSession
                    ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10 border-none font-bold text-[10px] py-0.5 px-2 rounded-full'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-100 dark:bg-white/10 dark:text-white/60 border-none font-bold text-[10px] py-0.5 px-2 rounded-full'}
                >
                  {c.currentSession ? 'Abierta' : 'Cerrada'}
                </Badge>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {c.currentSession && (
                  <>
                    <StatCard
                      label="Ingresos"
                      value={`$${c.totalIncome.toFixed(2)}`}
                      icon={ArrowUpRight}
                      variant="emerald"
                    />
                    <StatCard
                      label="Egresos"
                      value={`$${c.totalExpenses.toFixed(2)}`}
                      icon={ArrowDownLeft}
                      variant="orange"
                    />
                    <StatCard
                      label="Efectivo Esperado"
                      value={`$${c.calculateExpectedCash()}`}
                      icon={WalletCards}
                      variant="foreground"
                    />
                  </>
                )}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t dark:border-white/5 border-black/5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
                Acciones
              </p>
              {!c.currentSession ? (
                <Button
                  className="w-full flex gap-2"
                  onClick={handleOpenClick}
                >
                  <Unlock className="size-4" /> Abrir Caja
                </Button>
              ) : (
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    className="w-full flex gap-2"
                    onClick={() => c.setIsMovementModalOpen(true)}
                  >
                    <Plus className="size-4" /> Movimiento Manual
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full flex gap-2"
                    onClick={() => c.setIsCloseModalOpen(true)}
                  >
                    <Lock className="size-4" /> Cerrar Caja
                  </Button>
                </div>
              )}
            </div>
          </div>
        }
      >
        {/* Loading state */}
        {(c.isLoadingSession || c.isLoadingAllOpen) && (
          <LoadingSpinner label="Cargando estado de la caja..." />
        )}

        {/* ALL BRANCHES: Show list of all open sessions */}
        {!branchId && !c.isLoadingAllOpen && (
          <>
            {c.selectedAllBranchSession ? (
              <Card className="shadow-md flex flex-col h-fit border-none">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b dark:border-white/5 border-black/5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 rounded-full bg-black text-white hover:bg-white hover:text-black dark:bg-white dark:text-black dark:hover:bg-black dark:hover:text-white transition-colors"
                        onClick={() => c.setSelectedAllBranchSession(null)}
                      >
                        ← Volver al listado
                      </Button>
                    </div>
                    <CardTitle className="text-lg font-bold">
                      Caja — {c.selectedAllBranchSession.branch?.name || 'Sin sucursal'}
                    </CardTitle>
                    <CardDescription>
                      Apertura: {formatCurrency(Number(c.selectedAllBranchSession.openingAmount))} · Abierto por {c.selectedAllBranchSession.openedBy?.name || 'N/A'}
                    </CardDescription>
                  </div>
                  {isAdmin && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="gap-2"
                      onClick={() => c.setSessionToDelete(c.selectedAllBranchSession)}
                    >
                      <Trash2 className="size-4" /> Eliminar
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="p-4 flex-1 overflow-auto">
                  <CashRegisterMovementsTable
                    movements={c.selectedAllBranchDetails?.movements}
                    isLoading={c.isLoadingAllBranchDetails}
                  />
                </CardContent>
              </Card>
            ) : c.allOpenSessions.length === 0 ? (
              <EmptyState
                icon={Lock}
                title="Sin Cajas Abiertas"
                description="No hay sesiones de caja abiertas en ninguna sucursal."
                action={
                  <Button onClick={() => toast.error('Seleccioná una sucursal específica para abrir caja')}>
                    <Unlock className="size-4 mr-2" /> Abrir Caja
                  </Button>
                }
              />
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Store className="size-5 text-primary" />
                  <h2 className="text-lg font-bold">Cajas Abiertas por Sucursal</h2>
                  <Badge className="bg-primary/10 text-primary border-none font-bold text-[10px] py-0.5 px-2 rounded-full">
                    {c.allOpenSessions.length} {c.allOpenSessions.length === 1 ? 'sesión' : 'sesiones'}
                  </Badge>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {c.allOpenSessions.map((session) => (
                    <Card
                      key={session.id}
                      className="border-none shadow-md hover:shadow-lg transition-all cursor-pointer group"
                      onClick={() => c.setSelectedAllBranchSession(session)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="p-2.5 rounded-xl bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
                            <Unlock className="size-5 text-emerald-600" />
                          </div>
                          <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10 border-none font-bold text-[10px] py-0.5 px-2 rounded-full">
                            Abierta
                          </Badge>
                        </div>
                        <div className="space-y-1.5">
                          <p className="font-semibold text-sm truncate">
                            {session.branch?.name || 'Sin sucursal'}
                          </p>
                          <p className="text-2xl font-bold text-emerald-600">
                            {formatCurrency(Number(session.openingAmount))}
                          </p>
                          <div className="flex items-center justify-between pt-2 border-t dark:border-white/5 border-black/5">
                            <p className="text-[11px] text-muted-foreground truncate">
                              {session.openedBy?.name || 'N/A'}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {new Date(session.openedAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        {isAdmin && (
                          <div className="flex justify-end mt-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation()
                                c.setSessionToDelete(session)
                              }}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* SPECIFIC BRANCH: Show current session */}
        {branchId && !c.isLoadingSession && (
          <>
            {!c.currentSession ? (
              <EmptyState
                icon={Lock}
                title="Caja Cerrada"
                description="Para registrar ventas o cobrar suscripciones, debés realizar la apertura de caja primero."
                action={
                  <Button onClick={handleOpenClick}>
                    <Unlock className="size-4 mr-2" /> Abrir Caja Diaria
                  </Button>
                }
              />
            ) : (
              <Card className="md:col-span-2 shadow-md flex flex-col h-fit border-none">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b dark:border-white/5 border-black/5">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-bold">
                      {activeTab === 'movements' ? 'Movimientos de la Sesión' : 'Historial de Cajas Cerradas'}
                    </CardTitle>
                    <CardDescription>
                      {activeTab === 'movements'
                        ? 'Efectivo y cobros electrónicos registrados.'
                        : 'Reporte consolidado de arqueos de caja anteriores.'}
                    </CardDescription>
                  </div>
                  {isAdmin && (
                    <ToggleGroup
                      type="single"
                      value={activeTab}
                      onValueChange={(val) => {
                        if (val) setActiveTab(val as 'movements' | 'history')
                      }}
                      className="bg-gray-100 dark:bg-white/5 p-1 rounded-full border dark:border-white/5 border-black/5"
                    >
                      <ToggleGroupItem value="movements" className="text-xs px-3 py-1.5 rounded-full font-medium">
                        Movimientos
                      </ToggleGroupItem>
                      <ToggleGroupItem value="history" className="text-xs px-3 py-1.5 rounded-full font-medium">
                        Historial
                      </ToggleGroupItem>
                    </ToggleGroup>
                  )}
                </CardHeader>
                <CardContent className="p-4 flex-1 overflow-auto">
                  {activeTab === 'movements' ? (
                    <CashRegisterMovementsTable
                      movements={c.sessionDetails?.movements}
                      isLoading={c.isLoadingDetails}
                    />
                  ) : (
                    <CashRegisterHistoryTable
                      sessions={c.historySessions}
                      isLoading={c.isLoadingHistory}
                      onViewDetails={(id) => c.setSelectedHistorySessionId(id)}
                    />
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </ModuleLayout>

      <CashRegisterOpenDialog
        open={c.isOpenModalOpen}
        onOpenChange={c.setIsOpenModalOpen}
        openingAmount={c.openingAmount}
        onOpeningAmountChange={c.setOpeningAmount}
        openingNotes={c.openingNotes}
        onOpeningNotesChange={c.setOpeningNotes}
        onSubmit={(e) => {
          e.preventDefault()
          if (!c.openingAmount) return
          c.openMutation.mutate({ data: { openingAmount: c.openingAmount, notes: c.openingNotes, branchId } })
        }}
        isPending={c.openMutation.isPending}
      />

      <CashRegisterCloseDialog
        open={c.isCloseModalOpen}
        onOpenChange={c.setIsCloseModalOpen}
        expectedCash={c.calculateExpectedCash()}
        closingAmount={c.closingAmount}
        onClosingAmountChange={c.setClosingAmount}
        closingNotes={c.closingNotes}
        onClosingNotesChange={c.setClosingNotes}
        onSubmit={(e) => {
          e.preventDefault()
          if (!c.closingAmount) return
          c.closeMutation.mutate({ data: { actualClosingAmount: c.closingAmount, notes: c.closingNotes, branchId } })
        }}
        isPending={c.closeMutation.isPending}
      />

      <CashRegisterMovementDialog
        open={c.isMovementModalOpen}
        onOpenChange={c.setIsMovementModalOpen}
        movementAmount={c.movementAmount}
        onMovementAmountChange={c.setMovementAmount}
        movementType={c.movementType}
        onMovementTypeChange={c.setMovementType}
        movementDescription={c.movementDescription}
        onMovementDescriptionChange={c.setMovementDescription}
        onSubmit={(e) => {
          e.preventDefault()
          if (!c.movementAmount || !c.movementDescription) return
          c.movementMutation.mutate({ data: { amount: c.movementAmount, movementType: c.movementType, description: c.movementDescription, branchId } })
        }}
        isPending={c.movementMutation.isPending}
      />

      <CashRegisterHistoryDetailDialog
        sessionId={c.selectedHistorySessionId}
        open={!!c.selectedHistorySessionId}
        onOpenChange={(open) => !open && c.setSelectedHistorySessionId(null)}
        selectedHistoryDetails={c.selectedHistoryDetails}
      />

      <AlertDialog open={!!c.sessionToDelete} onOpenChange={(open) => !open && c.setSessionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar sesión de caja?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará la sesión de caja de <strong>{c.sessionToDelete?.branch?.name || 'sin sucursal'}</strong> y todos sus movimientos. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline">Cancelar</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant="destructive"
                onClick={() => {
                  if (c.sessionToDelete) {
                    c.deleteMutation.mutate({ data: { sessionId: c.sessionToDelete.id } })
                  }
                }}
                disabled={c.deleteMutation.isPending}
              >
                {c.deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
