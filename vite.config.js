import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: [
      'minaki-billing-system.onrender.com',
      '.onrender.com', // This allows any Render subdomain
    ],
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:8001',
        changeOrigin: true,
      },
      '/billing_system': {
        target: process.env.VITE_API_URL || 'http://localhost:8001',
        changeOrigin: true,
      },
    },
  },
});