import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    // React 플러그인
    plugins: [react()],
    
    // 환경변수 정의
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    
    // 경로 별칭 설정
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), './src'),
        '~': path.resolve(process.cwd(), '.'),
      },
    },
    
    // 빌드 설정
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            router: ['react-router-dom'],
          }
        }
      },
    },
    
    // 개발 서버 설정
    server: {
      port: 3000,
      open: true,
      cors: true,
    },
    
    // 미리보기 서버 설정
    preview: {
      port: 4173,
      open: true,
    },
    
    // 최적화 설정
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom'
      ],
    },
  };
});
