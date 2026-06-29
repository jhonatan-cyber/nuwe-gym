import { sileo, Toaster as SileoToaster } from 'sileo'
import type { SileoPosition, SileoOptions } from 'sileo'
import 'sileo/styles.css'
import React from 'react'
import { useTheme } from 'next-themes'

interface ToastOptions {
  description?: string | React.ReactNode
  duration?: number
  position?: SileoPosition
}

const mapOptions = (
  message: string | React.ReactNode,
  options?: ToastOptions,
): SileoOptions => {
  const opts: SileoOptions = {}

  if (typeof message === 'string') {
    opts.title = message
  } else {
    opts.title = ''
    opts.description = message
  }

  if (options) {
    if (options.description) {
      opts.description = options.description
    }
    if (options.duration !== undefined) {
      opts.duration = options.duration
    }
    if (options.position) {
      opts.position = options.position
    }
  }

  return opts
}

export const toast = {
  success: (message: string | React.ReactNode, options?: ToastOptions) => {
    return sileo.success(mapOptions(message, options))
  },
  error: (message: string | React.ReactNode, options?: ToastOptions) => {
    return sileo.error(mapOptions(message, options))
  },
  info: (message: string | React.ReactNode, options?: ToastOptions) => {
    return sileo.info(mapOptions(message, options))
  },
  warning: (message: string | React.ReactNode, options?: ToastOptions) => {
    return sileo.warning(mapOptions(message, options))
  },
  custom: (message: string | React.ReactNode, options?: ToastOptions) => {
    return sileo.show(mapOptions(message, options))
  },
  dismiss: (id?: string) => {
    if (id) {
      sileo.dismiss(id)
    } else {
      sileo.clear()
    }
  },
}

// Fallback for calling toast("message") directly
const toastFunction = (
  message: string | React.ReactNode,
  options?: ToastOptions,
) => {
  return toast.custom(message, options)
}

Object.assign(toastFunction, toast)

export default toastFunction as typeof toastFunction & typeof toast

export const Toaster = ({
  position,
  theme: themeProp,
}: {
  position?: SileoPosition
  theme?: 'light' | 'dark' | 'system'
  richColors?: boolean
  [key: string]: any
}) => {
  const { resolvedTheme } = useTheme()
  const effectiveTheme: 'light' | 'dark' | 'system' =
    themeProp || (resolvedTheme as 'light' | 'dark' | undefined) || 'system'

  return (
    <>
      <style>{`
        /* Tema light de Sileo (fondo oscuro) */
        [data-sileo-viewport][data-theme="light"] [data-sileo-title] {
          color: #ffffff !important;
        }
        [data-sileo-viewport][data-theme="light"] [data-sileo-description] {
          color: rgba(255, 255, 255, 0.7) !important;
        }

        /* Tema dark de Sileo (fondo claro) */
        [data-sileo-viewport][data-theme="dark"] [data-sileo-title] {
          color: #18181b !important;
        }
        [data-sileo-viewport][data-theme="dark"] [data-sileo-description] {
          color: rgba(24, 24, 27, 0.7) !important;
        }

        [data-sileo-toast] {
          background: transparent !important;
          border: none !important;
        }
      `}</style>
      <SileoToaster position={position} theme={effectiveTheme} />
    </>
  )
}
