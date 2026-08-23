import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
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
      '/commerce': {
        target: process.env.VITE_API_URL || 'http://localhost:8001',
        changeOrigin: true,
      },
      // Scoped to /drive/api (not bare /drive) — the frontend also owns the
      // page route /drive (and /drive/folder/:id) for the Drive UI itself;
      // proxying the bare prefix would intercept full-page loads of those
      // routes and forward them to the backend instead of serving the SPA.
      '/drive/api': {
        target: process.env.VITE_API_URL || 'http://localhost:8001',
        changeOrigin: true,
      },
    },
  },
});