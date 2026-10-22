import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Netlify build metadata → exposed to the client for error reports.
process.env.VITE_RELEASE ??= process.env.COMMIT_REF
process.env.VITE_DEPLOY_CONTEXT ??= process.env.CONTEXT

// Local mode (no Firebase) is for development only: a Netlify build without
// the Firebase config would ship an app with no login and no data protection.
const REQUIRED_ON_NETLIFY = ['VITE_FIREBASE_API_KEY', 'VITE_FIREBASE_AUTH_DOMAIN', 'VITE_FIREBASE_PROJECT_ID', 'VITE_FIREBASE_APP_ID']

export default defineConfig(({ mode }) => {
  if (process.env.NETLIFY === 'true') {
    const env = loadEnv(mode, process.cwd(), 'VITE_')
    const missing = REQUIRED_ON_NETLIFY.filter(k => !env[k])
    if (missing.length) throw new Error(`[tonic] Netlify build without Firebase config: missing ${missing.join(', ')}`)
  }
  return {
    plugins: [react()],
    worker: { format: 'es' },
    build: {
      rollupOptions: {
        output: {
          // Libraries needed on every load get their own long-cached chunks, so
          // a deploy that only changes app code doesn't re-download them.
          // Lazy-only libraries (Firestore, tfjs, …) are split automatically.
          manualChunks(id) {
            if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'vendor-react'
            if (/node_modules\/@firebase\/(app|auth|component|logger|util)\//.test(id) || /node_modules\/(firebase\/(app|auth)|idb)\//.test(id)) return 'vendor-firebase'
            if (/node_modules\/@sentry\//.test(id)) return 'vendor-sentry'
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@features': path.resolve(__dirname, './src/features'),
        '@shared': path.resolve(__dirname, './src/shared'),
      },
    },
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
        // Same functions, called by their Netlify path (Modal Buddy, AI proposals).
        '/.netlify/functions': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
  }
})
