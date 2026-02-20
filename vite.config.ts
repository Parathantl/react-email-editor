import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: 'examples/basic',
  resolve: {
    alias: {
      '@parathantl/react-email-editor': path.resolve(__dirname, 'src/index.ts'),
    },
  },
  optimizeDeps: {
    include: ['mjml-browser'],
  },
  server: {
    port: 3000,
    open: true,
  },
});
