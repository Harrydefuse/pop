import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/** Where `node bot/src/cli.js serve` listens. Override with BOT_API. */
const BOT_API = process.env.BOT_API ?? 'http://127.0.0.1:7331'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        // The Relay landing page.
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        // The memebot control panel — a separate page, not a route on the site.
        dashboard: fileURLToPath(new URL('./dashboard.html', import.meta.url)),
      },
    },
  },
  server: {
    proxy: {
      // Keeps the dashboard same-origin in dev, so no CORS and EventSource just works.
      '/api': {
        target: BOT_API,
        changeOrigin: true,
        // SSE must not be buffered or the stream never flushes.
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes) => {
            if (proxyRes.headers['content-type']?.includes('text/event-stream')) {
              proxyRes.headers['cache-control'] = 'no-cache, no-transform'
            }
          })
        },
      },
    },
  },
})
