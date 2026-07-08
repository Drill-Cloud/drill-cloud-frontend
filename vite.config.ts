import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const { DEV_API_URL } = loadEnv(mode, '.', '');

  return {
    plugins: [react()],
    build: {
      chunkSizeWarningLimit: 700,
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: DEV_API_URL,
          changeOrigin: true,
        },
      },
    },
  };
});
