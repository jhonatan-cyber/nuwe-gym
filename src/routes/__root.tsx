import type { ReactNode } from 'react'
import { useEffect } from 'react'
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { ThemeProvider } from 'next-themes'

import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Trainix POS' },
      {
        name: 'description',
        content: 'Sistema de administración para gimnasios con POS integrado',
      },
      // Open Graph / Facebook
      { property: 'og:type', content: 'website' },
      { property: 'og:title', content: 'Trainix POS' },
      {
        property: 'og:description',
        content: 'Sistema de administración para gimnasios con POS integrado',
      },
      { property: 'og:image', content: 'http://localhost:3000/logo-dark.png' },
      { property: 'og:url', content: 'http://localhost:3000' },
      // Twitter / X
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'Trainix POS' },
      {
        name: 'twitter:description',
        content: 'Sistema de administración para gimnasios con POS integrado',
      },
      { name: 'twitter:image', content: 'http://localhost:3000/logo-dark.png' },
    ],
    links: [
      { rel: 'canonical', href: 'http://localhost:3000' },
      { rel: 'stylesheet', href: appCss },
      {
        rel: 'preconnect',
        href: 'https://fonts.googleapis.com',
      },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
      },
    ],
  }),
  component: RootComponent,
  shellComponent: RootDocument,
})

function RootComponent() {
  useEffect(() => {
    if (typeof document === 'undefined') return

    const cleanupSvgTitles = () => {
      document.querySelectorAll('svg title').forEach((t) => t.remove())
    }

    // Run initial cleanup
    cleanupSvgTitles()

    // Observe changes to clean up dynamically rendered charts/SVGs
    const observer = new MutationObserver(cleanupSvgTitles)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [])

  return <Outlet />
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  )
}
