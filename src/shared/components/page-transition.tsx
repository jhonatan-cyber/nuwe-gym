import type { ReactNode } from 'react'
import { useLocation } from '@tanstack/react-router'

interface PageTransitionProps {
  children: ReactNode
}

export function PageTransition({ children }: PageTransitionProps) {
  const { pathname } = useLocation()

  return (
    <div key={pathname} className="animate-in fade-in duration-500">
      {children}
    </div>
  )
}
