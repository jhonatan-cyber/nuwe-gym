import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { getRouter } from './router'

const root = document.getElementById('root')
if (!root) {
  throw new Error('Root container not found')
}

const router = getRouter()
const rootInstance = createRoot(root)

rootInstance.render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
