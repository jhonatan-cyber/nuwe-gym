import { sileo, Toaster as SileoToaster } from 'sileo'
import type { SileoPosition, SileoOptions } from 'sileo'
import 'sileo/styles.css'
import React from 'react'

interface ToastOptions {
  description?: string | React.ReactNode
  duration?: number
  position?: SileoPosition
}

const mapOptions = (message: string | React.ReactNode, options?: ToastOptions): SileoOptions => {
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
const toastFunction = (message: string | React.ReactNode, options?: ToastOptions) => {
  return toast.custom(message, options)
}

Object.assign(toastFunction, toast)

export default toastFunction as typeof toastFunction & typeof toast

export const Toaster = ({
  position,
  theme,
}: {
  position?: SileoPosition
  theme?: 'light' | 'dark' | 'system'
  richColors?: boolean
  [key: string]: any
}) => {
  return <SileoToaster position={position} theme={theme} />
}
