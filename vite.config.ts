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
    include: [
      'use-sync-external-store/shim/with-selector',
      'react',
      'react-dom',
      'react-dom/client',
      'lucide-react',
      '@tanstack/react-router',
      '@tanstack/react-query',
      'clsx',
      'class-variance-authority',
      'tailwind-merge',
      // Heavy deps — pre-bundle once instead of on-the-fly
      'recharts',
      'next-themes',
      'radix-ui',
      'qrcode',
    ],
  },
  ssr: {
    noExternal: ['use-sync-external-store'],
  },
  plugins: [
    process.env.NODE_ENV === 'development' && devtools(),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ].filter(Boolean),
  server: {
    warmup: {
      clientFiles: [
        './src/shared/components/**/*.tsx',
        './src/shared/lib/**/*.ts',
        './src/shared/hooks/**/*.ts',
        './src/routes/__root.tsx',
        './src/routes/_authed.tsx',
        './src/routes/index.tsx',
        './src/routes/login.tsx',
        './src/routes/_authed/dashboard.tsx',
        './src/routes/_authed/members.tsx',
        './src/routes/_authed/check-ins.tsx',
      ],
      ssrFiles: [
        './src/shared/components/**/*.tsx',
        './src/shared/lib/**/*.ts',
        './src/shared/hooks/**/*.ts',
        './src/routes/__root.tsx',
        './src/routes/_authed.tsx',
        './src/routes/index.tsx',
        './src/routes/login.tsx',
        './src/routes/_authed/dashboard.tsx',
        './src/routes/_authed/members.tsx',
        './src/routes/_authed/check-ins.tsx',
      ],
    },
  },
})

export default config
