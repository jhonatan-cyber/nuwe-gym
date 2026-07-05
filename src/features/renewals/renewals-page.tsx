import { ChevronRight, User } from 'lucide-react'
import { ModuleLayout } from '#/shared/components/layout/module-layout.tsx'
import { WizardSidebar } from '#/features/renewals/components/wizard-sidebar.tsx'
import { Step2Content } from '#/features/renewals/components/step2-content.tsx'
import { Step3Content } from '#/features/renewals/components/step3-content.tsx'
import { useRenewalsPage } from '#/features/renewals/hooks/use-renewals-page.ts'

export function RenewalsPage() {
  const {
    step,
    setStep,
    searchQuery,
    setSearchQuery,
    selectedMember,
    isChangingPlan,
    setIsChangingPlan,
    formData,
    setFormData,
    isLoadingSession,
    isCashRegisterOpen,
    packages,
    memberSearchResults,
    allSearchResults,
    searchingMembers,
    renewalHistory,
    loadingHistory,
    renewMutation,
    selectedPkg,
    searchPage,
    setSearchPage,
    searchTotalPages,
    searchTotal,
    handleReset,
    handleSelectMember,
    handleSubmit,
  } = useRenewalsPage()

  return (
    <ModuleLayout
      breadcrumb={
        <div className="flex items-center gap-1">
          <span
            className="text-muted-foreground hover:underline cursor-pointer"
            onClick={handleReset}
          >
            Renovación
          </span>
          <ChevronRight className="size-3 text-muted-foreground/50" />
          <span className="text-foreground">Asistente</span>
        </div>
      }
      title="Renovacion"
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
              Asistente de Renovación de Membresía
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[280px] text-center leading-normal">
              Por favor, busque y seleccione un socio en el panel izquierdo para
              comenzar con el proceso de renovación.
            </p>
          </div>
        )}

        {step === 2 && selectedMember && (
          <Step2Content
            selectedMember={selectedMember}
            isChangingPlan={isChangingPlan}
            setIsChangingPlan={setIsChangingPlan}
            formData={formData}
            setFormData={setFormData}
            packages={packages}
            renewalHistory={renewalHistory}
            loadingHistory={loadingHistory}
            selectedPkg={selectedPkg}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}

        {step === 3 && selectedMember && selectedPkg && (
          <Step3Content
            selectedMember={selectedMember}
            selectedPkg={selectedPkg}
            formData={formData}
            setFormData={setFormData}
            isCashRegisterOpen={isCashRegisterOpen}
            isLoadingSession={isLoadingSession}
            isPending={renewMutation.isPending}
            onSubmit={handleSubmit}
            onBack={() => setStep(2)}
          />
        )}
      </div>
    </ModuleLayout>
  )
}
