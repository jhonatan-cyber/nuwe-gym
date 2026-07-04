import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

const config = defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: {
      sonner: path.resolve(__dirname, './src/shared/components/ui/sonner.tsx'),
    },
  },
  optimizeDeps: {
    include: ['use-sync-external-store/shim/with-selector'],
    exclude: ['firebase-admin'],
  },
  ssr: {
    noExternal: ['use-sync-external-store'],
  },
  plugins: [
    devtools(),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
})

export default config
