import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  
  return {
    // React 플러그인 추가
    plugins: [react()],
    
    // 환경변수 정의
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    
    // 경로 별칭 설정
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    
    // 빌드 설정 (SPA 라우팅 지원)
    build: {
      outDir: 'dist',
      // 빌드 최적화
      rollupOptions: {
        output: {
          manualChunks: {
            // 벤더 청크 분리로 캐싱 최적화
            vendor: ['react', 'react-dom'],
            router: ['react-router-dom'],
          }
        }
      },
      // 청크 크기 경고 임계값 증가 (이미지 처리 때문에)
      chunkSizeWarningLimit: 1000,
    },
    
    // 개발 서버 설정
    server: {
      port: 3000,
      // SPA 라우팅을 위한 히스토리 API 폴백
      historyApiFallback: true,
      // CORS 설정 (필요시)
      cors: true,
    },
    
    // 미리보기 서버 설정 (빌드 후 테스트용)
    preview: {
      port: 4173,
      // SPA 라우팅을 위한 히스토리 API 폴백
      historyApiFallback: true,
    },
    
    // 최적화 설정
    optimizeDeps: {
      // 사전 번들링할 의존성
      include: [
        'react',
        'react-dom',
        'react-router-dom'
      ],
    },
    
    // 환경변수 접두사 설정
    envPrefix: ['VITE_', 'REACT_APP_'],
  };
});
