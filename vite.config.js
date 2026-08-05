import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync } from 'node:fs'

export default defineConfig({
  base: '/opskrifter/',
  plugins: [
    react(),
    {
      // GitHub Pages kender ikke til client-side routing.
      // 404.html = kopi af index.html får SPA'en til at overtage alle stier.
      name: 'spa-404',
      closeBundle() {
        copyFileSync('dist/index.html', 'dist/404.html')
      },
    },
  ],
})