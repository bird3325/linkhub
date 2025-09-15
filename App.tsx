import React, { useState, useMemo } from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';

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
import { MOCK_LINKS } from './constants';

const ProtectedRoute: React.FC<{ isAuthenticated: boolean }> = ({ isAuthenticated }) => {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

// AuthContext를 사용하는 래퍼 컴포넌트
const ProtectedRouteWrapper: React.FC = () => {
  const { isAuthenticated } = React.useContext(AuthContext);
  return <ProtectedRoute isAuthenticated={isAuthenticated} />;
};

function App() {
  const [links, setLinks] = useState<Link[]>(MOCK_LINKS.sort((a, b) => a.order - b.order));

  const linkContextValue = useMemo(() => ({
    links,
    setLinks,
  }), [links]);

  return (
    <AuthProvider>
      <LinkContext.Provider value={linkContextValue}>
        <HashRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />

            <Route element={<ProtectedRouteWrapper />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/profile/:username" element={<PublicProfilePage />} />
              <Route path="/links/edit/:linkId" element={<LinkEditorPage />} />
              <Route path="/link/edit/:linkId" element={<LinkEditorPage />} />
              <Route path="/link/new" element={<LinkEditorPage />} />
              <Route path="/profile/edit" element={<ProfileEditPage />} />
              <Route path="/account/edit" element={<AccountEditPage />} />
              <Route path="/mypage" element={<MyPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </LinkContext.Provider>
    </AuthProvider>
  );
}

export default App;
