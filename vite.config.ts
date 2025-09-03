import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/pomodoro-timer/',
  server: {
    host: true, // ネットワークアクセスを許可
    port: 5173,
  },
})