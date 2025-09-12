import React, { useState, useMemo, useCallback } from 'react';
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

import { AuthContext } from './contexts/AuthContext';
import { LinkContext } from './contexts/LinkContext';

import type { User, Link } from './types';

import { MOCK_USER, MOCK_LINKS } from './constants';

const ProtectedRoute: React.FC<{ isAuthenticated: boolean }> = ({ isAuthenticated }) => {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [links, setLinks] = useState<Link[]>(MOCK_LINKS.sort((a, b) => a.order - b.order));

  const login = useCallback(() => {
    setUser(MOCK_USER);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const authContextValue = useMemo(() => ({
    isAuthenticated,
    user,
    login,
    logout,
    setUser,
  }), [isAuthenticated, user, login, logout, setUser]);

  const linkContextValue = useMemo(() => ({
    links,
    setLinks,
  }), [links]);

  return (
    <AuthContext.Provider value={authContextValue}>
      <LinkContext.Provider value={linkContextValue}>
        <HashRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />

            <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/profile/:username" element={<PublicProfilePage />} />
              <Route path="/links/edit/:linkId" element={<LinkEditorPage />} />
              <Route path="/profile/edit" element={<ProfileEditPage />} />
              <Route path="/account/edit" element={<AccountEditPage />} />
              <Route path="/mypage" element={<MyPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </LinkContext.Provider>
    </AuthContext.Provider>
  );
}

export default App;
