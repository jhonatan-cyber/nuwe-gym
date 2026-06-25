import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Landmark,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Lock,
  Unlock,
  History,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  getCurrentCashSession,
  openCashSession,
  closeCashSession,
  createManualMovement,
  getCashSessionDetails,
  getCashSessionsList,
} from '#/features/cash-register/server.ts'
import { Button } from '#/shared/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '#/shared/components/ui/card'
import { Input } from '#/shared/components/ui/input'
import { Textarea } from '#/shared/components/ui/textarea'
import { Badge } from '#/shared/components/ui/badge'
import { PageHeader } from '#/shared/components/page-header'
import { formatDateTime } from '#/shared/lib/formatters.ts'
import { Route as authedRoute } from '#/routes/_authed.tsx'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '#/shared/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/shared/components/ui/table'

export function CashRegisterPage() {
  const queryClient = useQueryClient()
  const { userRole } = authedRoute.useRouteContext()
  const isAdmin = userRole === 'ADMIN'

  const [isOpenModalOpen, setIsOpenModalOpen] = useState(false)
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false)
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false)
  const [selectedHistorySessionId, setSelectedHistorySessionId] = useState<
    number | null
  >(null)

  const [openingAmount, setOpeningAmount] = useState('10000.00')
  const [openingNotes, setOpeningNotes] = useState('')

  const [closingAmount, setClosingAmount] = useState('')
  const [closingNotes, setClosingNotes] = useState('')

  const [movementAmount, setMovementAmount] = useState('')
  const [movementType, setMovementType] = useState<'INCOME' | 'EXPENSE'>(
    'INCOME',
  )
  const [movementDescription, setMovementDescription] = useState('')

  const { data: currentSession, isLoading: isLoadingSession } = useQuery({
    queryKey: ['current-cash-session'],
    queryFn: () => getCurrentCashSession(),
  })

  const { data: sessionDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['cash-session-details', currentSession?.id],
    queryFn: () =>
      getCashSessionDetails({ data: { sessionId: currentSession!.id } }),
    enabled: !!currentSession?.id,
  })

  const { data: historySessions = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ['cash-sessions-list'],
    queryFn: () => getCashSessionsList(),
    enabled: isAdmin,
  })

  const { data: selectedHistoryDetails } = useQuery({
    queryKey: ['cash-session-details', selectedHistorySessionId],
    queryFn: () =>
      getCashSessionDetails({ data: { sessionId: selectedHistorySessionId! } }),
    enabled: !!selectedHistorySessionId,
  })

  const openMutation = useMutation({
    mutationFn: openCashSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-cash-session'] })
      toast.success('Caja abierta correctamente')
      setIsOpenModalOpen(false)
    },
    onError: (err: Error) => toast.error(err.message || 'Error al abrir caja'),
  })

  const closeMutation = useMutation({
    mutationFn: closeCashSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-cash-session'] })
      queryClient.invalidateQueries({ queryKey: ['cash-sessions-list'] })
      toast.success('Caja cerrada con éxito')
      setIsCloseModalOpen(false)
      setClosingAmount('')
      setClosingNotes('')
    },
    onError: (err: Error) => toast.error(err.message || 'Error al cerrar caja'),
  })

  const movementMutation = useMutation({
    mutationFn: createManualMovement,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['cash-session-details', currentSession?.id],
      })
      toast.success('Movimiento registrado con éxito')
      setIsMovementModalOpen(false)
      setMovementAmount('')
      setMovementDescription('')
    },
    onError: (err: Error) =>
      toast.error(err.message || 'Error al registrar movimiento'),
  })

  const calculateExpectedCash = () => {
    if (!currentSession || !sessionDetails) return '0.00'
    let balance = Number(currentSession.openingAmount)
    sessionDetails.movements.forEach((m) => {
      if (m.paymentMethod === 'CASH') {
        if (m.movementType === 'INCOME') balance += Number(m.amount)
        else balance -= Number(m.amount)
      }
    })
    return balance.toFixed(2)
  }

  const handleOpenSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!openingAmount) return
    openMutation.mutate({ data: { openingAmount, notes: openingNotes } })
  }

  const handleCloseSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!closingAmount) return
    closeMutation.mutate({
      data: { actualClosingAmount: closingAmount, notes: closingNotes },
    })
  }

  const handleMovementSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!movementAmount || !movementDescription) return
    movementMutation.mutate({
      data: {
        amount: movementAmount,
        movementType,
        description: movementDescription,
      },
    })
  }

  if (isLoadingSession) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Cargando estado de la caja...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Control de Caja"
        description="Aperturas, cierres de caja diaria y arqueo de movimientos de efectivo."
        icon={<Landmark className="size-8 text-primary" />}
      />

      {!currentSession ? (
        <Card className="max-w-md mx-auto border-red-500/20 shadow-lg mt-8">
          <CardHeader className="text-center pb-4">
            <div className="size-16 rounded-full bg-red-500/10 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
              <Lock className="size-8" />
            </div>
            <CardTitle className="text-2xl font-bold text-red-600">
              Caja Cerrada
            </CardTitle>
            <CardDescription>
              Para registrar ventas de productos o cobrar suscripciones, debés
              realizar la apertura de caja primero.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-6">
            <Button
              size="lg"
              className="w-full flex gap-2"
              onClick={() => setIsOpenModalOpen(true)}
            >
              <Unlock className="size-5" /> Abrir Caja Diaria
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-1 border-primary/20 shadow-md">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">
                    Sesión de Caja Activa
                  </CardTitle>
                  <CardDescription>
                    ID Sesión: #{currentSession.id}
                  </CardDescription>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-600 border-none">
                  Abierta
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-xs text-muted-foreground block">
                  Abierta por
                </span>
                <span className="font-semibold text-sm">
                  {currentSession.openedBy.name}
                </span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">
                  Fecha / Hora de Apertura
                </span>
                <span className="font-semibold text-sm">
                  {formatDateTime(currentSession.openedAt)}
                </span>
              </div>
              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Monto Apertura:</span>
                  <span className="font-semibold">
                    ${currentSession.openingAmount}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Efectivo Esperado:</span>
                  <span className="text-primary">
                    ${calculateExpectedCash()}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2 pt-4">
                <Button
                  variant="outline"
                  className="w-full flex gap-2"
                  onClick={() => setIsMovementModalOpen(true)}
                >
                  <Plus className="size-4" /> Movimiento Manual
                </Button>
                <Button
                  variant="destructive"
                  className="w-full flex gap-2"
                  onClick={() => setIsCloseModalOpen(true)}
                >
                  <Lock className="size-4" /> Cerrar Caja Diaria
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                Movimientos de la Sesión
              </CardTitle>
              <CardDescription>
                Efectivo y cobros electrónicos registrados.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingDetails ? (
                <div className="text-center py-8 text-muted-foreground">
                  Cargando movimientos...
                </div>
              ) : sessionDetails?.movements.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay movimientos en esta sesión.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hora</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessionDetails?.movements.map((move) => {
                      const isIncome = move.movementType === 'INCOME'
                      return (
                        <TableRow key={move.id}>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatDateTime(move.createdAt).split(', ')[1]}
                          </TableCell>
                          <TableCell className="font-medium">
                            {move.description}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {move.paymentMethod}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {isIncome ? (
                              <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10 border-none flex w-fit items-center gap-0.5">
                                <ArrowUpRight className="size-3" /> Ingreso
                              </Badge>
                            ) : (
                              <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/10 border-none flex w-fit items-center gap-0.5">
                                <ArrowDownLeft className="size-3" /> Egreso
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell
                            className={`text-right font-semibold ${isIncome ? 'text-emerald-600' : 'text-red-600'}`}
                          >
                            {isIncome ? '+' : '-'}${move.amount}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {isAdmin && (
        <Card className="mt-8">
          <CardHeader className="flex flex-row items-center gap-2">
            <History className="size-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-lg">
                Historial de Cajas Cerradas
              </CardTitle>
              <CardDescription>
                Reporte consolidado de arqueos de caja anteriores.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingHistory ? (
              <div className="text-center py-6 text-muted-foreground">
                Cargando historial...
              </div>
            ) : historySessions.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                No hay sesiones pasadas registradas.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Abierta</TableHead>
                    <TableHead>Cerrada</TableHead>
                    <TableHead>Apertura</TableHead>
                    <TableHead>Esperado</TableHead>
                    <TableHead>Cierre Real</TableHead>
                    <TableHead>Diferencia</TableHead>
                    <TableHead className="text-right">Detalles</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historySessions.map((session) => {
                    const diffNum = Number(session.difference) || 0
                    return (
                      <TableRow key={session.id}>
                        <TableCell>#{session.id}</TableCell>
                        <TableCell className="text-xs">
                          {formatDateTime(session.openedAt)}
                        </TableCell>
                        <TableCell className="text-xs">
                          {session.closedAt
                            ? formatDateTime(session.closedAt)
                            : 'Sesión Activa'}
                        </TableCell>
                        <TableCell>${session.openingAmount}</TableCell>
                        <TableCell>
                          ${session.expectedClosingAmount || '-'}
                        </TableCell>
                        <TableCell>
                          ${session.actualClosingAmount || '-'}
                        </TableCell>
                        <TableCell>
                          {session.closedAt ? (
                            diffNum === 0 ? (
                              <Badge className="bg-emerald-500/10 text-emerald-600 border-none">
                                Concordante
                              </Badge>
                            ) : diffNum > 0 ? (
                              <Badge className="bg-teal-500/10 text-teal-600 border-none">
                                +${session.difference}
                              </Badge>
                            ) : (
                              <Badge
                                variant="destructive"
                                className="bg-red-500/10 text-red-600 border-none"
                              >
                                -${Math.abs(diffNum).toFixed(2)}
                              </Badge>
                            )
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setSelectedHistorySessionId(session.id)
                            }
                          >
                            Ver
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={isOpenModalOpen} onOpenChange={setIsOpenModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apertura de Caja Diaria</DialogTitle>
            <DialogDescription>
              Por favor contá el efectivo en caja para establecer el fondo
              inicial.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleOpenSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">
                Monto Inicial en Efectivo ($) *
              </label>
              <Input
                type="number"
                step="0.01"
                value={openingAmount}
                onChange={(e) => setOpeningAmount(e.target.value)}
                required
                className="text-lg font-bold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Notas de Apertura</label>
              <Textarea
                placeholder="Observaciones de la caja..."
                value={openingNotes}
                onChange={(e) => setOpeningNotes(e.target.value)}
                rows={2}
              />
            </div>
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpenModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={openMutation.isPending}>
                Confirmar Apertura
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isCloseModalOpen} onOpenChange={setIsCloseModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <Lock className="size-5" /> Arqueo y Cierre de Caja
            </DialogTitle>
            <DialogDescription>
              Realizá el conteo físico del efectivo en caja y comparalo con el
              sistema.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCloseSubmit} className="space-y-4">
            <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Efectivo en Sistema:</span>
                <span className="font-semibold">
                  ${calculateExpectedCash()}
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">
                Efectivo Físico Contado ($) *
              </label>
              <Input
                type="number"
                step="0.01"
                value={closingAmount}
                onChange={(e) => setClosingAmount(e.target.value)}
                placeholder="0.00"
                required
                className="text-lg font-bold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">
                Notas del Cierre / Arqueo
              </label>
              <Textarea
                placeholder="Justificación en caso de sobrante o faltante..."
                value={closingNotes}
                onChange={(e) => setClosingNotes(e.target.value)}
                rows={3}
              />
            </div>
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCloseModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={closeMutation.isPending}
              >
                Cerrar Caja
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isMovementModalOpen} onOpenChange={setIsMovementModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Movimiento Manual</DialogTitle>
            <DialogDescription>
              Registrá una entrada o salida de efectivo (ej. retiro de caja,
              compra de insumos, etc).
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleMovementSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Tipo</label>
                <select
                  value={movementType}
                  onChange={(e) =>
                    setMovementType(e.target.value as 'INCOME' | 'EXPENSE')
                  }
                  className="w-full h-10 px-3 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="INCOME">Ingreso (Entrada)</option>
                  <option value="EXPENSE">Egreso (Salida)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Monto ($) *</label>
                <Input
                  type="number"
                  step="0.01"
                  value={movementAmount}
                  onChange={(e) => setMovementAmount(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">
                Descripción / Concepto *
              </label>
              <Input
                placeholder="Ej: Retiro para depósito bancario, Compra de café..."
                value={movementDescription}
                onChange={(e) => setMovementDescription(e.target.value)}
                required
              />
            </div>
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsMovementModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={movementMutation.isPending}>
                Registrar Movimiento
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!selectedHistorySessionId}
        onOpenChange={(open) => !open && setSelectedHistorySessionId(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Detalle de Sesión de Caja #{selectedHistorySessionId}
            </DialogTitle>
          </DialogHeader>
          {selectedHistoryDetails && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm border-b pb-4">
                <div>
                  <span className="text-muted-foreground block">Abierta:</span>
                  <span className="font-semibold">
                    {selectedHistoryDetails.session?.openedAt
                      ? formatDateTime(selectedHistoryDetails.session.openedAt)
                      : '-'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Cerrada:</span>
                  <span className="font-semibold">
                    {selectedHistoryDetails.session?.closedAt
                      ? formatDateTime(selectedHistoryDetails.session.closedAt)
                      : 'Abierta'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">
                    Monto Inicial:
                  </span>
                  <span className="font-semibold">
                    ${selectedHistoryDetails.session?.openingAmount}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">
                    Cierre Real:
                  </span>
                  <span className="font-semibold">
                    $
                    {selectedHistoryDetails.session?.actualClosingAmount || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">
                    Diferencia:
                  </span>
                  <span className="font-semibold text-primary">
                    ${selectedHistoryDetails.session?.difference || '0.00'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Notas:</span>
                  <span className="font-medium text-xs block max-w-xs">
                    {selectedHistoryDetails.session?.notes || '-'}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2">
                  Movimientos Registrados
                </h4>
                <div className="max-h-60 overflow-y-auto border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Hora</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedHistoryDetails.movements.map((move) => {
                        const isIncome = move.movementType === 'INCOME'
                        return (
                          <TableRow key={move.id}>
                            <TableCell className="text-xs text-muted-foreground">
                              {formatDateTime(move.createdAt).split(', ')[1]}
                            </TableCell>
                            <TableCell className="font-medium">
                              {move.description}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {move.paymentMethod}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {isIncome ? (
                                <Badge className="bg-emerald-500/10 text-emerald-600 border-none flex w-fit items-center gap-0.5">
                                  <ArrowUpRight className="size-3" /> Ingreso
                                </Badge>
                              ) : (
                                <Badge className="bg-red-500/10 text-red-600 border-none flex w-fit items-center gap-0.5">
                                  <ArrowDownLeft className="size-3" /> Egreso
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell
                              className={`text-right font-semibold ${isIncome ? 'text-emerald-600' : 'text-red-600'}`}
                            >
                              {isIncome ? '+' : '-'}${move.amount}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
