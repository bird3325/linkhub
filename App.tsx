import React, { useState, useMemo, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import DashboardPage from './pages/DashboardPage';
import AnalyticsPage from './pages/AnalyticsPage';
import PublicProfilePage from './pages/PublicProfilePage';
import LinkEditorPage from './pages/LinkEditorPage';
import ProfileEditPage from './pages/ProfileEditPage';
import AccountEditPage from './pages/AccountEditPage';
import MyPage from './pages/MyPage';
import { AuthProvider, AuthContext } from './contexts/AuthContext';
import { LinkContext } from './contexts/LinkContext';
import type { Link } from './types';

const ProtectedRoute: React.FC<{ isAuthenticated: boolean }> = ({ isAuthenticated }) => {
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  return <Outlet />;
};

// AuthContext를 사용하는 래퍼 컴포넌트
const ProtectedRouteWrapper: React.FC = () => {
  const { isAuthenticated } = useContext(AuthContext);
  return <ProtectedRoute isAuthenticated={isAuthenticated} />;
};

function App() {
  // MOCK_LINKS 제거, 빈 배열로 초기화
  const [links, setLinks] = useState<Link[]>([]);
  
  const linkContextValue = useMemo(() => ({
    links,
    setLinks,
  }), [links]);

  return (
    <AuthProvider>
      <LinkContext.Provider value={linkContextValue}>
        <BrowserRouter>
          <Routes>
            {/* 공개 라우트 */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            
            {/* 보호된 라우트 */}
            <Route element={<ProtectedRouteWrapper />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              
              {/* 링크 관련 라우트 */}
              <Route path="/link/new" element={<LinkEditorPage />} />
              <Route path="/link/edit/:linkId" element={<LinkEditorPage />} />
              <Route path="/mypage" element={<MyPage />} />
              
              {/* 프로필 및 계정 관리 라우트 */}
              <Route path="/profile/edit" element={<ProfileEditPage />} />
              <Route path="/account/edit" element={<AccountEditPage />} />
              
              {/* 보호된 프로필 페이지 (관리용) */}
              <Route path="/profile/:username" element={<PublicProfilePage />} />
            </Route>
            
            {/* 공개 프로필 페이지 - 사용자명으로 직접 접근 (맨 마지막에 배치) */}
            <Route path="/:username" element={<PublicProfilePage />} />
            
            {/* 기본 리디렉션 */}
            <Route path="*" element={<Navigate to="/" />} />

            {/* 404 처리 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </LinkContext.Provider>
    </AuthProvider>
  );
}

export default App;
