import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

const isContent = process.env.BUILD_TARGET === 'content'

export default defineConfig({
  plugins: [react()],
  define: isContent ? { 'process.env.NODE_ENV': '"production"' } : {},
  build: {
    outDir: 'dist',
    emptyOutDir: !isContent,
    rollupOptions: isContent
      ? {
          input: resolve(__dirname, 'src/content/index.jsx'),
          output: {
            format: 'iife',
            entryFileNames: 'content/index.js',
            inlineDynamicImports: true,
          },
        }
      : {
          input: { main: resolve(__dirname, 'index.html') },
          output: {
            entryFileNames: 'assets/[name]-[hash].js',
          },
        },
  },
})