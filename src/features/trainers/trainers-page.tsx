import { ChevronRight, Plus, List } from 'lucide-react'
import { ModuleLayout } from '#/shared/components/layout/module-layout.tsx'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '#/shared/components/ui/toggle-group'
import { useTrainersPage } from '#/features/trainers/hooks/use-trainers-page.ts'
import { TrainerMyMembers } from '#/features/trainers/components/trainer-my-members.tsx'
import { TrainerList, TrainerStats, TrainerFilterBar } from '#/features/trainers/components/trainer-list.tsx'
import { TrainerForm, TrainerFormSidebar } from '#/features/trainers/components/trainer-form.tsx'
import type { ViewMode } from '#/features/trainers/types.ts'

interface TrainersPageProps {
  userRole: string
}

export function TrainersPage({ userRole }: TrainersPageProps) {
  const {
    activeView,
    setActiveView,
    search,
    setSearch,
    editingTrainer,
    userId,
    setUserId,
    specialty,
    setSpecialty,
    bio,
    setBio,
    commissionRate,
    setCommissionRate,
    selectedUser,
    isTrainer,
    canWrite,
    isLoading,
    filteredTrainers,
    myMembers,
    trainerUsers,
    totalTrainers,
    activeTrainers,
    inactiveTrainers,
    isCreating,
    isUpdating,
    handleFormSubmit,
    handleEdit,
    handleBackToList,
  } = useTrainersPage({ userRole })

  if (isTrainer) {
    return (
      <ModuleLayout
        breadcrumb={
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Entrenadores</span>
            <ChevronRight className="size-3 text-muted-foreground/50" />
            <span className="text-foreground">Mis Socios</span>
          </div>
        }
        title="Mis Socios"
      >
        <TrainerMyMembers members={myMembers} />
      </ModuleLayout>
    )
  }

  const isFormView = activeView === 'create' || activeView === 'edit'

  return (
    <ModuleLayout
      breadcrumb={
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">Entrenadores</span>
          <ChevronRight className="size-3 text-muted-foreground/50" />
          <span className="text-foreground">
            {isFormView ? (editingTrainer ? 'Editar' : 'Nuevo') : 'Listado'}
          </span>
        </div>
      }
      title={
        isFormView
          ? editingTrainer
            ? 'Editar Entrenador'
            : 'Nuevo Entrenador'
          : 'Entrenadores'
      }
      leftPanel={
        <div className="flex flex-col gap-6 z-10 w-full">
          <ToggleGroup
            type="single"
            value={activeView === 'trainers' ? 'trainers' : 'create'}
            onValueChange={(v) => {
              if (v) {
                setActiveView(v as ViewMode)
              }
            }}
          >
            <ToggleGroupItem value="trainers">
              <List className="size-3.5" /> Listado
            </ToggleGroupItem>
            {canWrite && (
              <ToggleGroupItem value="create">
                <Plus className="size-3.5" /> Crear nuevo
              </ToggleGroupItem>
            )}
          </ToggleGroup>

          {isFormView ? (
            <TrainerFormSidebar />
          ) : (
            <>
              <TrainerStats
                totalTrainers={totalTrainers}
                activeTrainers={activeTrainers}
                inactiveTrainers={inactiveTrainers}
              />
              <TrainerFilterBar search={search} onSearchChange={setSearch} />
            </>
          )}
        </div>
      }
    >
      {isFormView ? (
        <div className="flex-1 flex justify-center items-start pt-5">
          <TrainerForm
            editingTrainer={editingTrainer}
            userId={userId}
            onUserIdChange={setUserId}
            specialty={specialty}
            onSpecialtyChange={setSpecialty}
            bio={bio}
            onBioChange={setBio}
            commissionRate={commissionRate}
            onCommissionRateChange={setCommissionRate}
            selectedUser={selectedUser}
            trainerUsers={trainerUsers}
            isCreating={isCreating}
            isUpdating={isUpdating}
            onSubmit={handleFormSubmit}
            onCancel={handleBackToList}
          />
        </div>
      ) : (
        <TrainerList
          filteredTrainers={filteredTrainers}
          isLoading={isLoading}
          onEdit={handleEdit}
          canWrite={canWrite}
          search={search}
        />
      )}
    </ModuleLayout>
  )
}
