import React, { useState, useMemo, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Analytics } from "@vercel/analytics/react";
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
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

// AuthContext를 사용하는 래퍼 컴포넌트
const ProtectedRouteWrapper: React.FC = () => {
  const { isAuthenticated } = useContext(AuthContext);
  return <ProtectedRoute isAuthenticated={isAuthenticated} />;
};

function App() {
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
            {/* 정적 공개 라우트 (우선순위 높음) */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            
            {/* 관리자 라우트 (보호됨) */}
            <Route element={<ProtectedRouteWrapper />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/mypage" element={<MyPage />} />
              
              {/* 링크 관련 라우트 */}
              <Route path="/link/new" element={<LinkEditorPage />} />
              <Route path="/link/edit/:linkId" element={<LinkEditorPage />} />
              
              {/* 프로필 및 계정 관리 라우트 */}
              <Route path="/profile/edit" element={<ProfileEditPage />} />
              <Route path="/account/edit" element={<AccountEditPage />} />
              
              {/* 관리자용 프로필 보기 */}
              <Route path="/admin/profile/:username" element={<PublicProfilePage />} />
            </Route>
            
            {/* 동적 공개 프로필 라우트 (마지막에 배치) */}
            <Route path="/:username" element={<PublicProfilePage />} />
            
            {/* 404 처리 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <Analytics />
      </LinkContext.Provider>
    </AuthProvider>
  );
}

export default App;
