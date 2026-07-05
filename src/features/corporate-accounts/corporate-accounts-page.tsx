import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ChevronRight,
  Building2,
  Plus,
  Users,
  CreditCard,
  Edit2,
  Eye,
  Trash2,
} from 'lucide-react'
import { ModuleLayout } from '#/shared/components/layout/module-layout.tsx'
import { Button } from '#/shared/components/ui/button'
import { DataTable } from '#/shared/components/data-table'
import { Badge } from '#/shared/components/ui/badge'
import { StatCard } from '#/shared/components/ui/stat-card'
import { LoadingButton } from '#/shared/components/ui/loading-button'
import { Input } from '#/shared/components/ui/input'
import { Label } from '#/shared/components/ui/label'
import { Textarea } from '#/shared/components/ui/textarea'
import { ConfirmDialog } from '#/shared/components/ui/confirm-dialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '#/shared/components/ui/dialog'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '#/shared/components/ui/tooltip'
import { toast } from 'sonner'
import {
  getCorporateAccounts,
  createCorporateAccount,
  updateCorporateAccount,
  deleteCorporateAccount,
  getCorporateAccountById,
  getCorporateBillingReport,
} from './server.ts'
import type { CorporateAccount } from './types.ts'
import { formatCurrency } from '#/shared/lib/formatters.ts'
import { cn } from '#/shared/lib/utils.ts'
import { useCurrentBranch } from '#/shared/hooks/use-current-branch.ts'

export function CorporateAccountsPage() {
  const queryClient = useQueryClient()
  const { branchId } = useCurrentBranch()
  const [showCreate, setShowCreate] = useState(false)
  const [editingAccount, setEditingAccount] = useState<CorporateAccount | null>(null)
  const [viewAccountId, setViewAccountId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CorporateAccount | null>(null)

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['corporate-accounts'],
    queryFn: () => getCorporateAccounts({}),
  })

  const filteredAccounts = branchId
    ? accounts.filter((a) => a.branchId === branchId || !a.branchId)
    : accounts

  const totalAccounts = filteredAccounts.length
  const totalEmployees = filteredAccounts.reduce((s, a) => s + a.employeeCount, 0)
  const activeAccounts = filteredAccounts.filter((a) => a.isActive).length

  const createMutation = useMutation({
    mutationFn: createCorporateAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['corporate-accounts'] })
      setShowCreate(false)
      toast.success('Cuenta corporativa creada')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const updateMutation = useMutation({
    mutationFn: updateCorporateAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['corporate-accounts'] })
      setEditingAccount(null)
      toast.success('Cuenta corporativa actualizada')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteCorporateAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['corporate-accounts'] })
      setDeleteTarget(null)
      toast.success('Cuenta corporativa eliminada')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <>
      <ModuleLayout
        breadcrumb={
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Administración</span>
            <ChevronRight className="size-3 text-muted-foreground/50" />
            <span className="text-foreground">Cuentas Corporativas</span>
          </div>
        }
        title="Cuentas Corporativas"
        headerActions={
          <Button
            onClick={() => setShowCreate(true)}
            className="rounded-full gap-1.5"
          >
            <Plus className="size-4" />
            Nueva
          </Button>
        }
        leftPanel={
          <div className="flex flex-col gap-6 z-10 w-full">
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
                Métricas
              </p>
              <div className="grid grid-cols-1 gap-3">
                <StatCard
                  label="Total Empresas"
                  value={totalAccounts}
                  icon={Building2}
                  variant="default"
                />
                <StatCard
                  label="Activas"
                  value={activeAccounts}
                  icon={Building2}
                  variant="emerald"
                />
                <StatCard
                  label="Empleados"
                  value={totalEmployees}
                  icon={Users}
                  variant="foreground"
                />
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
                Información
              </p>
              <p className="text-xs text-muted-foreground px-1 leading-relaxed">
                Gestioná empresas con membresías corporativas. Asigná empleados a una cuenta
                para tener facturación centralizada y reportes consolidados.
              </p>
            </div>
          </div>
        }
      >
        <TooltipProvider delayDuration={200}>
          <DataTable
            columns={[
              {
                key: 'company',
                label: 'Empresa',
                render: (acct: any) => (
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                      <Building2 className="size-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm leading-tight truncate">
                        {acct.companyName}
                      </p>
                      {acct.taxId && (
                        <p className="text-[10px] font-semibold text-muted-foreground">
                          {acct.taxId}
                        </p>
                      )}
                    </div>
                  </div>
                ),
              },
              {
                key: 'contact',
                label: 'Contacto',
                render: (acct: any) => (
                  <div className="text-xs text-muted-foreground min-w-0">
                    {acct.contactPerson && <p className="font-semibold truncate">{acct.contactPerson}</p>}
                    {acct.email && <p className="truncate text-[10px]">{acct.email}</p>}
                    {acct.phone && <p className="truncate text-[10px]">{acct.phone}</p>}
                  </div>
                ),
              },
              {
                key: 'employees',
                label: 'Empleados',
                render: (acct: any) => (
                  <div className="flex items-center gap-1.5">
                    <Users className="size-3.5 text-muted-foreground" />
                    <span className="font-bold text-sm">{acct.employeeCount}</span>
                  </div>
                ),
              },
              {
                key: 'active',
                label: 'Activas',
                render: (acct: any) => (
                  <div className="flex items-center gap-1.5">
                    <CreditCard className="size-3.5 text-emerald-500" />
                    <span className="font-bold text-sm">{acct.activeSubscriptions}</span>
                  </div>
                ),
              },
              {
                key: 'status',
                label: 'Estado',
                render: (acct: any) => (
                  <Badge
                    className={cn(
                      'text-[10px] font-bold',
                      acct.isActive
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        : 'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20',
                    )}
                  >
                    {acct.isActive ? 'Activa' : 'Inactiva'}
                  </Badge>
                ),
              },
              {
                key: 'actions',
                label: '',
                className: 'text-right',
                render: (acct: any) => (
                  <div className="flex justify-end gap-0.5">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                          onClick={() => setViewAccountId(acct.id)}
                        >
                          <Eye className="size-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom"><p>Ver detalle</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="text-amber-500 hover:text-amber-600 hover:bg-amber-500/10"
                          onClick={() => setEditingAccount(acct)}
                        >
                          <Edit2 className="size-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom"><p>Editar</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                          onClick={() => setDeleteTarget(acct)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom"><p>Eliminar</p></TooltipContent>
                    </Tooltip>
                  </div>
                ),
              },
            ]}
            data={filteredAccounts}
            isLoading={isLoading}
            loadingMessage="Cargando cuentas corporativas..."
            emptyMessage="No hay cuentas corporativas registradas."
            keyExtractor={(acct: any) => acct.id}
            skeletonRows={5}
          />
        </TooltipProvider>
      </ModuleLayout>

      {/* Create Dialog */}
      <CorporateAccountFormDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        title="Nueva cuenta corporativa"
        onSubmit={(data) => createMutation.mutate({ data })}
        isPending={createMutation.isPending}
      />

      {/* Edit Dialog */}
      <CorporateAccountFormDialog
        open={!!editingAccount}
        onOpenChange={(o) => { if (!o) setEditingAccount(null) }}
        title="Editar cuenta corporativa"
        initial={editingAccount}
        onSubmit={(data) => updateMutation.mutate({ data: { id: editingAccount!.id, ...data } })}
        isPending={updateMutation.isPending}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="Eliminar cuenta corporativa"
        description={
          deleteTarget ? (
            <span>
              Vas a eliminar <strong>{deleteTarget.companyName}</strong>. Los empleados
              asignados quedarán sin vinculación corporativa. ¿Estás seguro?
            </span>
          ) : null
        }
        confirmText="Eliminar"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate({ data: { id: deleteTarget!.id } })}
      />

      {/* Detail Dialog */}
      <CorporateAccountDetailDialog
        accountId={viewAccountId}
        onOpenChange={(o) => { if (!o) setViewAccountId(null) }}
      />
    </>
  )
}

// ── Form Dialog ──

function CorporateAccountFormDialog({
  open,
  onOpenChange,
  title,
  initial,
  onSubmit,
  isPending,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  title: string
  initial?: any
  onSubmit: (data: any) => void
  isPending: boolean
}) {
  const [companyName, setCompanyName] = useState(initial?.companyName ?? '')
  const [taxId, setTaxId] = useState(initial?.taxId ?? '')
  const [contactPerson, setContactPerson] = useState(initial?.contactPerson ?? '')
  const [email, setEmail] = useState(initial?.email ?? '')
  const [phone, setPhone] = useState(initial?.phone ?? '')
  const [address, setAddress] = useState(initial?.address ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')

  const handleSubmit = () => {
    if (!companyName.trim()) {
      toast.error('El nombre de la empresa es obligatorio')
      return
    }
    onSubmit({
      companyName: companyName.trim(),
      taxId: taxId.trim() || undefined,
      contactPerson: contactPerson.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      notes: notes.trim() || undefined,
      isActive: initial?.isActive ?? true,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="size-5 text-primary" />
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="Nombre de la empresa" required>
            <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Ej: TechCorp S.A." className="rounded-xl" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="RUC / NIT / CUIT">
              <Input value={taxId} onChange={(e) => setTaxId(e.target.value)}
                placeholder="12345678-9" className="rounded-xl" />
            </Field>
            <Field label="Teléfono">
              <Input value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder="+54 11 1234-5678" className="rounded-xl" />
            </Field>
          </div>
          <Field label="Persona de contacto">
            <Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)}
              placeholder="Nombre del encargado" className="rounded-xl" />
          </Field>
          <Field label="Email">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="facturacion@empresa.com" className="rounded-xl" />
          </Field>
          <Field label="Dirección">
            <Input value={address} onChange={(e) => setAddress(e.target.value)}
              placeholder="Dirección fiscal" className="rounded-xl" />
          </Field>
          <Field label="Notas">
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas adicionales..." className="rounded-xl min-h-[60px]" />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
            Cancelar
          </Button>
          <LoadingButton onClick={handleSubmit} isLoading={isPending} className="rounded-xl gap-1.5">
            <Building2 className="size-4" />
            {initial ? 'Guardar cambios' : 'Crear cuenta'}
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  )
}

// ── Detail Dialog ──

function CorporateAccountDetailDialog({
  accountId,
  onOpenChange,
}: {
  accountId: string | null
  onOpenChange: (o: boolean) => void
}) {
  const { data: account, isLoading } = useQuery({
    queryKey: ['corporate-account-detail', accountId],
    queryFn: () => getCorporateAccountById({ data: accountId! }),
    enabled: !!accountId,
  })

  const { data: billing } = useQuery({
    queryKey: ['corporate-billing', accountId],
    queryFn: () => getCorporateBillingReport({ data: { corporateAccountId: accountId! } }),
    enabled: !!accountId,
  })

  return (
    <Dialog open={!!accountId} onOpenChange={(o) => { if (!o) onOpenChange(false) }}>
      <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="size-5 text-primary" />
            {isLoading ? 'Cargando...' : account?.companyName ?? 'Cuenta Corporativa'}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Cargando...</div>
        ) : account ? (
          <div className="space-y-5">
            {/* Info */}
            <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-muted/30">
              {account.taxId && (
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">RUC / NIT</p>
                  <p className="font-semibold text-sm">{account.taxId}</p>
                </div>
              )}
              {account.contactPerson && (
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Contacto</p>
                  <p className="font-semibold text-sm">{account.contactPerson}</p>
                </div>
              )}
              {account.email && (
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Email</p>
                  <p className="font-semibold text-sm">{account.email}</p>
                </div>
              )}
              {account.phone && (
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Teléfono</p>
                  <p className="font-semibold text-sm">{account.phone}</p>
                </div>
              )}
              {account.address && (
                <div className="col-span-2">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Dirección</p>
                  <p className="font-semibold text-sm">{account.address}</p>
                </div>
              )}
              {account.notes && (
                <div className="col-span-2">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Notas</p>
                  <p className="text-sm text-muted-foreground">{account.notes}</p>
                </div>
              )}
            </div>

            {/* Billing Summary */}
            {billing && (
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                  📊 Resumen de facturación
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-600">Empleados</p>
                    <p className="text-xl font-black text-emerald-600">{billing.totals.totalEmployees}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-blue-600">Total gastado</p>
                    <p className="text-xl font-black text-blue-600">{formatCurrency(billing.totals.totalSpent)}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-violet-500/5 border border-violet-500/10">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-violet-600">Pagos</p>
                    <p className="text-xl font-black text-violet-600">{billing.totals.totalPayments}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-amber-600">Prom. por emp.</p>
                    <p className="text-xl font-black text-amber-600">{formatCurrency(billing.totals.avgPerMember)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Employees List */}
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                👥 Empleados ({account.employees.length})
              </h4>
              {account.employees.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground rounded-xl bg-muted/30">
                  No hay empleados asignados a esta cuenta.
                </div>
              ) : (
                <div className="space-y-2">
                  {account.employees.map((emp: any) => {
                    const activeSub = emp.subscriptions?.find((s: any) => s.status === 'ACTIVE')
                    return (
                      <div key={emp.id} className="flex items-center justify-between p-3 rounded-xl border dark:border-white/[0.04] border-black/[0.04] bg-foreground/[0.015] hover:bg-foreground/[0.03] transition-colors">
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-sm truncate">{emp.fullName}</p>
                          <p className="text-[10px] text-muted-foreground">
                            CI: {emp.documentNumber || '—'}
                            {activeSub && <span className="ml-2">· {activeSub.package?.name ?? 'Sin plan'}</span>}
                          </p>
                        </div>
                        <Badge className={cn(
                          'text-[10px] font-bold shrink-0',
                          activeSub ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20',
                        )}>
                          {activeSub ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-destructive">No se encontró la cuenta corporativa.</div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
