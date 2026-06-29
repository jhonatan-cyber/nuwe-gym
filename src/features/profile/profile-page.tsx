import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { User, Lock, ChevronRight, Activity, Globe } from 'lucide-react'
import { useProfilePage } from '#/features/profile/hooks/use-profile-page.ts'

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '#/shared/components/ui/avatar'
import { ModuleLayout } from '#/shared/components/layout/module-layout.tsx'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '#/shared/components/ui/toggle-group'
import { ConfirmDialog } from '#/shared/components/ui/confirm-dialog'
import { RoleBadge } from '#/features/users/components/role-badge.tsx'

import { LoadingSkeleton } from './components/loading-skeleton'
import { ErrorDisplay } from './components/error-display'
import { InfoTab } from './components/info-tab'
import { EditInfoForm } from './components/edit-info-form'
import { SecurityTab } from './components/security-tab'
import { SessionsTab } from './components/sessions-tab'
import { ActivityTab } from './components/activity-tab'

export const Route = createFileRoute('/_authed/profile')({
  component: ProfilePage,
})

export function ProfilePage() {
  const { session } = Route.useRouteContext()
  const sUser = session.user

  const [isEditing, setIsEditing] = useState(false)

  const {
    activeTab,
    setActiveTab,
    user,
    userSessions,
    activeSessions,
    auditLogs,
    isLoading,
    isError,
    name,
    setName,
    phone,
    setPhone,
    address,
    setAddress,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    showCurrent,
    setShowCurrent,
    showNew,
    setShowNew,
    showConfirm,
    setShowConfirm,
    revokingSessionId,
    setRevokingSessionId,
    isPending,
    isPasswordPending,
    isRevoking,
    handleProfileSubmit,
    handlePasswordSubmit,
    handleRevokeSession,
    handleConfirmRevoke,
  } = useProfilePage(sUser.name, sUser.phone, sUser.address, {
    onSuccess: () => setIsEditing(false),
  })

  const dbUser = user || sUser

  return (
    <>
      <ModuleLayout
        breadcrumb={
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Mi Cuenta</span>
            <ChevronRight className="size-3 text-muted-foreground/50" />
            <span className="text-foreground">Perfil</span>
          </div>
        }
        title="Mi Perfil"
        leftPanel={
          <div className="flex flex-col gap-6 z-10 w-full">
            {/* ── Tarjeta de resumen ── */}
            <div className="flex flex-col items-center text-center p-5 rounded-2xl bg-black/5 dark:bg-white/5 border dark:border-white/5 border-black/5">
              <Avatar
                size="lg"
                className="size-20! border-2 border-primary/20 shadow-sm"
              >
                {sUser.image && (
                  <AvatarImage src={sUser.image} alt={sUser.name} />
                )}
                <AvatarFallback className="text-2xl bg-primary/10 text-primary font-black">
                  {sUser.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="mt-4 space-y-1">
                <h3 className="font-black text-lg leading-tight truncate max-w-[200px] text-foreground">
                  {sUser.name}
                </h3>
                <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                  {sUser.email}
                </p>
                <div className="pt-2 flex justify-center">
                  <RoleBadge role={sUser.role} />
                </div>
              </div>
            </div>

            {/* ── Navegación ── */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
                Navegación
              </p>
              <ToggleGroup
                type="single"
                value={activeTab}
                onValueChange={(v) => {
                  if (v) setActiveTab(v as any)
                }}
              >
                <ToggleGroupItem value="info">
                  <User className="size-3.5" /> Datos
                </ToggleGroupItem>
                <ToggleGroupItem value="security">
                  <Lock className="size-3.5" /> Seguridad
                </ToggleGroupItem>
                <ToggleGroupItem value="sessions">
                  <Activity className="size-3.5" /> Sesiones
                </ToggleGroupItem>
                <ToggleGroupItem value="activity">
                  <Globe className="size-3.5" /> Actividad
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
        }
      >
        {isLoading ? (
          <LoadingSkeleton />
        ) : isError ? (
          <ErrorDisplay />
        ) : activeTab === 'info' ? (
          isEditing ? (
            <EditInfoForm
              dbUser={dbUser}
              name={name}
              setName={setName}
              phone={phone}
              setPhone={setPhone}
              address={address}
              setAddress={setAddress}
              isPending={isPending}
              onSubmit={handleProfileSubmit}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <InfoTab dbUser={dbUser} onEdit={() => setIsEditing(true)} />
          )
        ) : activeTab === 'security' ? (
          <SecurityTab
            {...{
              currentPassword,
              setCurrentPassword,
              newPassword,
              setNewPassword,
              confirmPassword,
              setConfirmPassword,
              showCurrent,
              setShowCurrent,
              showNew,
              setShowNew,
              showConfirm,
              setShowConfirm,
            }}
            isPending={isPasswordPending}
            onSubmit={handlePasswordSubmit}
          />
        ) : activeTab === 'sessions' ? (
          <SessionsTab
            userSessions={userSessions}
            activeSessions={activeSessions}
            onRevoke={handleRevokeSession}
          />
        ) : (
          <ActivityTab auditLogs={auditLogs} />
        )}
      </ModuleLayout>

      <ConfirmDialog
        open={revokingSessionId !== null}
        onOpenChange={(open) => {
          if (!open) setRevokingSessionId(null)
        }}
        title="Cerrar Sesión"
        description="¿Estás seguro de que deseas cerrar esta sesión? Tendrás que volver a iniciar sesión en ese dispositivo."
        confirmText="Cerrar Sesión"
        variant="destructive"
        onConfirm={handleConfirmRevoke}
        isLoading={isRevoking}
      />
    </>
  )
}
