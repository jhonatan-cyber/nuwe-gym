import {
  Users,
  CheckCircle2,
  XCircle,
  Edit2,
  Zap,
} from 'lucide-react'
import { DataTable } from '#/shared/components/data-table.tsx'
import { StatCard } from '#/shared/components/ui/stat-card'
import { FilterBar } from '#/shared/components/ui/filter-bar'
import { Badge } from '#/shared/components/ui/badge'
import { Button } from '#/shared/components/ui/button'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '#/shared/components/ui/tooltip'
import type { TrainerWithDetails } from '#/features/trainers/types.ts'

interface TrainerListProps {
  filteredTrainers: TrainerWithDetails[]
  isLoading: boolean
  onEdit: (trainer: TrainerWithDetails) => void
  canWrite: boolean
  search?: string
}

export function TrainerList({
  filteredTrainers,
  isLoading,
  onEdit,
  canWrite,
  search,
}: TrainerListProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <DataTable
        columns={[
          {
            key: 'trainer',
            label: 'Entrenador',
            render: (t: TrainerWithDetails) => (
              <div className="flex items-center gap-3">
                <div className="ring-2 ring-foreground/10 rounded-full size-9 flex items-center justify-center bg-linear-to-br from-primary/10 to-primary/5 font-bold text-xs uppercase shrink-0 text-primary tracking-wider shadow-inner">
                  {t.user.name
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm dark:text-white text-foreground leading-tight truncate">
                    {t.user.name}
                  </p>
                  <p className="text-[10px] font-semibold text-muted-foreground">
                    {t.user.email}
                  </p>
                </div>
              </div>
            ),
          },
          {
            key: 'specialty',
            label: (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-default">Especialidad</span>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Área de entrenamiento del instructor</p>
                </TooltipContent>
              </Tooltip>
            ),
            render: (t: TrainerWithDetails) => {
              const displaySpecialty = t.specialty
                ? t.specialty.charAt(0).toUpperCase() + t.specialty.slice(1)
                : '\u2014'
              return (
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Zap className="size-3 text-muted-foreground" />
                  {displaySpecialty}
                </span>
              )
            },
          },
          {
            key: 'members',
            label: 'Socios',
            render: (t: TrainerWithDetails) => (
              <Badge
                variant="secondary"
                className="inline-flex items-center gap-1 font-bold text-[10px]"
              >
                <Users className="size-2.5" />
                {t.memberCount} socio{t.memberCount !== 1 ? 's' : ''}
              </Badge>
            ),
          },
          {
            key: 'status',
            label: '',
            render: (t: TrainerWithDetails) =>
              t.isActive ? (
                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] font-bold">
                  Activo
                </Badge>
              ) : (
                <Badge variant="destructive" className="text-[10px] font-bold">
                  Inactivo
                </Badge>
              ),
          },
          ...(canWrite
            ? [
                {
                  key: 'actions' as string,
                  label: '',
                  className: 'text-right' as string,
                  render: (t: TrainerWithDetails) => (
                    <div className="flex justify-end gap-0.5">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => onEdit(t)}
                          >
                            <Edit2 className="size-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p>Editar</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  ),
                },
              ]
            : []),
        ]}
        data={filteredTrainers}
        isLoading={isLoading}
        loadingMessage="Cargando..."
        emptyMessage={
          search
            ? 'No se encontraron entrenadores.'
            : 'No hay entrenadores registrados.'
        }
        keyExtractor={(t: TrainerWithDetails) => t.id}
        skeletonRows={5}
      />
    </TooltipProvider>
  )
}

export function TrainerStats({
  totalTrainers,
  activeTrainers,
  inactiveTrainers,
}: {
  totalTrainers: number
  activeTrainers: number
  inactiveTrainers: number
}) {
  return (
    <div className="space-y-3">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
        Métricas
      </p>
      <div className="grid grid-cols-1 gap-3">
        <StatCard
          label="Total Entrenadores"
          value={totalTrainers}
          icon={Users}
          variant="default"
        />
        <StatCard
          label="Activos"
          value={activeTrainers}
          icon={CheckCircle2}
          variant="emerald"
        />
        <StatCard
          label="Inactivos"
          value={inactiveTrainers}
          icon={XCircle}
          variant="foreground"
        />
      </div>
    </div>
  )
}

export function TrainerFilterBar({
  search,
  onSearchChange,
}: {
  search: string
  onSearchChange: (v: string) => void
}) {
  return (
    <FilterBar
      search={search}
      onSearchChange={onSearchChange}
      searchPlaceholder="Buscar por nombre, especialidad..."
    />
  )
}
