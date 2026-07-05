import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authed/export')({
  // Server enforces permissions — no client-side check needed
})
