import type * as React from 'react'

interface ModuleLayoutProps {
  breadcrumb: React.ReactNode
  title: string
  headerActions?: React.ReactNode
  leftPanel?: React.ReactNode
  children: React.ReactNode
}

export function ModuleLayout({
  breadcrumb,
  title,
  headerActions,
  leftPanel,
  children,
}: ModuleLayoutProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[3fr_7fr] gap-5 dark:text-white text-foreground min-h-[calc(100vh-10rem)]">
      {/* ── LEFT PANEL ─────────────────────────────────────── */}
      <div className="bg-card p-5 rounded-[2rem] border border-border/10 shadow-xl flex flex-col gap-5 select-none relative overflow-hidden self-start lg:sticky lg:top-0">
        {/* ambient glow */}
        <div className="absolute -top-20 -left-20 size-56 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 size-40 bg-pink-500/5 rounded-full blur-3xl pointer-events-none" />
        {leftPanel}
      </div>

      {/* ── RIGHT COLUMN ───────────────────────────────────── */}
      <div className="flex flex-col gap-5 min-w-0">
        {/* Page header */}
        <div className="flex items-end justify-between gap-4 shrink-0">
          <div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1">
              {breadcrumb}
            </div>
            <h1 className="text-3xl font-black tracking-tight dark:text-white text-foreground leading-none">
              {title}
            </h1>
          </div>
          {headerActions && (
            <div className="flex items-center gap-2">{headerActions}</div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col gap-5 min-w-0">{children}</div>
      </div>
    </div>
  )
}
