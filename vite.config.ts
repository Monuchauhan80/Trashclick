import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'src',
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html'),
        login: resolve(__dirname, 'src/login.html'),
        register: resolve(__dirname, 'src/register.html'),
        dashboard: resolve(__dirname, 'src/dashboard.html'),
        report: resolve(__dirname, 'src/report.html'),
        profile: resolve(__dirname, 'src/profile.html'),
      },
    },
  },
  server: {
    port: 3000,
    open: '/index.html',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
}); 