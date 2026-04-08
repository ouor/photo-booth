import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const additionalAllowedHosts = env.__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS
    ?.split(',')
    .map((host) => host.trim())
    .filter(Boolean)

  return {
    plugins: [react()],
    server: additionalAllowedHosts?.length
      ? {
          allowedHosts: additionalAllowedHosts,
        }
      : undefined,
  }
})
