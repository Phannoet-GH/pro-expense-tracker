import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (err, req, res) => {
            console.error('[Vite Proxy Error]:', err.message, 'on', req.url);
            if (!res.headersSent && res.writeHead) {
              res.writeHead(502, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: `Proxy unable to reach backend service (${err.code || err.message}). Please ensure backend API is running on port 5001.` }));
            }
          });
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log(`[Vite Proxy] ${req.method} ${req.url} -> http://127.0.0.1:5001`);
          });
          proxy.on('proxyRes', (proxyRes, req) => {
            console.log(`[Vite Proxy] ${req.method} ${req.url} <- Status: ${proxyRes.statusCode}`);
          });
        }
      }
    }
  }
})
