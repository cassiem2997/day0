import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],
// })

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('🔗 Proxy request:', req.method, req.url);
            console.log('🍪 Original cookies:', req.headers.cookie);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('📡 Proxy response:', proxyRes.statusCode, req.url);
            console.log('🍪 Set-Cookie headers:', proxyRes.headers['set-cookie']);
          });
        },
        rewrite: (p) => p.replace(/^\/api/, ""),
      },
    },
  },
});