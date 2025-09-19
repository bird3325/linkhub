import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  
  return {
    plugins: [react()],
    
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    
    build: {
      outDir: 'dist',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            router: ['react-router-dom'],
          }
        }
      },
      chunkSizeWarningLimit: 1000,
    },
    
    // 개발 서버에서 히스토리 API 폴백 설정
    server: {
      port: 3000,
      historyApiFallback: true,
    },
    
    // 미리보기 서버에서도 히스토리 API 폴백 설정
    preview: {
      port: 4173,
      historyApiFallback: true,
    },
    
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom'],
    },
    
    envPrefix: ['VITE_', 'REACT_APP_'],
  };
});
