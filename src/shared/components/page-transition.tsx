import type { ReactNode } from 'react'
import { useLocation } from '@tanstack/react-router'

interface PageTransitionProps {
  children: ReactNode
}

export function PageTransition({ children }: PageTransitionProps) {
  const { pathname } = useLocation()

  return (
    <div
      key={pathname}
      className="animate-in fade-in slide-in-from-bottom-2 duration-400 ease-out"
      style={{ animationTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)' }}
    >
      {children}
    </div>
  )
}
