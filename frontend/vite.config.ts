import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.REACT_APP_API_URL': JSON.stringify(process.env.VITE_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:8000/api'),
    'process.env.PUBLIC_URL': JSON.stringify('')
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@redux': path.resolve(__dirname, './src/redux'),
      '@services': path.resolve(__dirname, './src/services'),
      '@types': path.resolve(__dirname, './src/types')
    }
  }
});
