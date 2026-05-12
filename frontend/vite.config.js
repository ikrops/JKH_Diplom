import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const keyPath = path.resolve(__dirname, 'certs/localhost-key.pem')
const certPath = path.resolve(__dirname, 'certs/localhost-cert.pem')
const useHttps = process.env.VITE_USE_HTTPS === 'true' && fs.existsSync(keyPath) && fs.existsSync(certPath)

export default defineConfig({
  plugins: [react()],
  server: useHttps
    ? {
        https: {
          key: fs.readFileSync(keyPath),
          cert: fs.readFileSync(certPath),
        },
      }
    : {},
})
