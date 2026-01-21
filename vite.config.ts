import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')

  return {
    base: '/dauangoldgi/',

    build: {
      outDir: '.',          // 🔴 build ra root
      emptyOutDir: false,   // 🔴 KHÔNG xoá file source
    },

    plugins: [react()],

    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
  }
})
