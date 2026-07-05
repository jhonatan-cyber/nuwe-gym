import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  ChevronRight,
  DollarSign,
  CalendarDays,
  Gift,
  TrendingUp,
} from 'lucide-react'
import { ModuleLayout } from '#/shared/components/layout/module-layout.tsx'
import { Card, CardContent, CardHeader } from '#/shared/components/ui/card'
import { Button } from '#/shared/components/ui/button'
import { Separator } from '#/shared/components/ui/separator'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '#/shared/components/ui/tabs'
import { SearchInput } from '#/shared/components/search-input.tsx'
import { PayrollTabContent } from './components/payroll-tab-content.tsx'
import { BonusesTabContent } from './components/bonuses-tab-content.tsx'
import { CommissionsTabContent } from './components/commissions-tab-content.tsx'
import {
  getPayrollRecords,
  markPayrollPaid,
  getPayrollStats,
} from './payroll-server.ts'
import { getBonuses, deleteBonus } from './bonus-server.ts'

import { CreateBonusDialog } from './components/create-bonus-dialog.tsx'
import {
  getTrainerCommissionsForPeriod,
  getEmployeeCommissionBridge,
  getCommissionsDashboard,
} from './commission-server.ts'
import { GeneratePayrollDialog } from './components/generate-payroll-dialog.tsx'

// ── Main Page ──

export function PayrollPage() {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState('payroll')
  const [generateDialog, setGenerateDialog] = useState(false)
  const [bonusDialog, setBonusDialog] = useState(false)
  const [search, setSearch] = useState('')
  const [commissionPeriod, setCommissionPeriod] = useState(() => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now)
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    }
  })

  const { data: payrollRecords, isLoading: payrollLoading } = useQuery({
    queryKey: ['payroll'],
    queryFn: () => getPayrollRecords({ data: { employeeId: '', status: '' } }),
  })

  const { data: bonuses, isLoading: bonusesLoading } = useQuery({
    queryKey: ['bonuses'],
    queryFn: () => getBonuses({ data: { employeeId: '' } }),
  })

  const { data: stats } = useQuery({
    queryKey: ['payrollStats'],
    queryFn: getPayrollStats,
  })

  const { data: commissionData, isLoading: commissionLoading } = useQuery({
    queryKey: [
      'commissions-period',
      commissionPeriod.start,
      commissionPeriod.end,
    ],
    queryFn: () =>
      getTrainerCommissionsForPeriod({
        data: {
          periodStart: commissionPeriod.start,
          periodEnd: commissionPeriod.end,
        },
      }),
  })

  useQuery({
    queryKey: ['commission-bridge'],
    queryFn: getEmployeeCommissionBridge,
  })

  const { data: commissionDash } = useQuery({
    queryKey: ['commission-dashboard'],
    queryFn: getCommissionsDashboard,
  })

  const markPaidMutation = useMutation({
    mutationFn: markPayrollPaid,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] })
      queryClient.invalidateQueries({ queryKey: ['payrollStats'] })
      toast.success('Nómina marcada como pagada')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteBonusMutation = useMutation({
    mutationFn: deleteBonus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bonuses'] })
      toast.success('Bonificación eliminada')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const filteredPayroll = payrollRecords?.filter(
    (r) =>
      !search ||
      r.employee?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      r.status.toLowerCase().includes(search.toLowerCase()),
  )

  const filteredBonuses = bonuses?.filter(
    (b) =>
      !search ||
      b.employee?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      b.type.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <ModuleLayout
      breadcrumb={
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">RRHH</span>
          <ChevronRight className="size-3 text-muted-foreground/50" />
          <span className="text-foreground font-semibold">Sueldos</span>
        </div>
      }
      title="Sueldos y Bonificaciones"
      leftPanel={
        <div className="flex flex-col gap-6 z-10 w-full">
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
              Acciones
            </p>
            <Button
              onClick={() => setGenerateDialog(true)}
              className="w-full justify-start gap-2.5 px-4 py-2.5 rounded-2xl font-semibold text-sm bg-primary/10 text-primary hover:bg-primary/15"
            >
              <CalendarDays className="size-4 shrink-0" />
              Generar Nómina
            </Button>
            <Button
              onClick={() => setBonusDialog(true)}
              className="w-full justify-start gap-2.5 px-4 py-2.5 rounded-2xl font-semibold text-sm bg-amber-500/10 text-amber-600 hover:bg-amber-500/15"
            >
              <Gift className="size-4 shrink-0" />
              Nueva Bonificación
            </Button>
          </div>

          {stats && (
            <div className="space-y-3 pt-4 border-t border-border/5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
                Resumen Financiero
              </p>
              <Card className="rounded-2xl border-border/5 bg-muted/10">
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Pendiente</span>
                    <span className="font-bold text-amber-500">
                      ${stats.pendingAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Pagado</span>
                    <span className="font-bold text-emerald-500">
                      ${stats.paidAmount.toLocaleString()}
                    </span>
                  </div>
                  <Separator className="border-border/5" />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Total nóminas</span>
                    <span className="font-bold">
                      {stats.total} ({stats.pending} pend.)
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {commissionDash && (
            <div className="space-y-3 pt-4 border-t border-border/5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
                Comisiones de Entrenadores
              </p>
              <Card className="rounded-2xl border-border/5 bg-emerald-500/5">
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Entrenadores vinculados
                    </span>
                    <span className="font-bold">
                      {commissionDash.trainersWithCommissions} /{' '}
                      {commissionDash.totalTrainers}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Bonificaciones totales
                    </span>
                    <span className="font-bold">
                      {commissionDash.totalCommissionBonuses}
                    </span>
                  </div>
                  <Separator className="border-border/5" />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Pendiente por comisiones
                    </span>
                    <span className="font-bold text-amber-500">
                      ${commissionDash.totalPendingCommissions.toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="space-y-3 pt-4 border-t border-border/5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
              Info
            </p>
            <p className="text-xs text-muted-foreground px-1 leading-relaxed">
              Las bonificaciones creadas se incluyen automáticamente al generar
              la nómina del período. Las deducciones se calculan manualmente.
            </p>
          </div>
        </div>
      }
    >
      <Card className="rounded-[2rem] border-border/10 shadow-xl bg-card overflow-hidden relative">
        <div className="absolute -top-12 -left-12 size-36 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
        <CardHeader className="relative z-10">
          <div className="flex items-center justify-between">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="rounded-2xl bg-muted/20">
                <TabsTrigger
                  value="payroll"
                  className="rounded-xl text-xs font-semibold"
                >
                  <DollarSign className="size-3.5 mr-1" />
                  Nóminas
                </TabsTrigger>
                <TabsTrigger
                  value="bonuses"
                  className="rounded-xl text-xs font-semibold"
                >
                  <Gift className="size-3.5 mr-1" />
                  Bonificaciones
                </TabsTrigger>
                <TabsTrigger
                  value="commissions"
                  className="rounded-xl text-xs font-semibold"
                >
                  <TrendingUp className="size-3.5 mr-1" />
                  Comisiones
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <SearchInput
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsContent value="payroll">
              <PayrollTabContent
                payrollLoading={payrollLoading}
                payrollRecords={payrollRecords}
                filteredPayroll={filteredPayroll}
                markPaidMutation={markPaidMutation}
              />
            </TabsContent>

            <TabsContent value="bonuses" className="mt-4">
              <BonusesTabContent
                bonusesLoading={bonusesLoading}
                bonuses={bonuses}
                filteredBonuses={filteredBonuses}
                deleteBonusMutation={deleteBonusMutation}
              />
            </TabsContent>

            <TabsContent value="commissions" className="mt-4">
              <CommissionsTabContent
                commissionLoading={commissionLoading}
                commissionData={commissionData}
                commissionPeriod={commissionPeriod}
                setCommissionPeriod={setCommissionPeriod}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <GeneratePayrollDialog
        open={generateDialog}
        onClose={() => setGenerateDialog(false)}
      />
      <CreateBonusDialog
        open={bonusDialog}
        onClose={() => setBonusDialog(false)}
      />
    </ModuleLayout>
  )
}
