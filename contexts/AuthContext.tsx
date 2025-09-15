import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User } from '../types';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (userData?: any) => void;
  logout: () => void;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  refreshUserProfile: () => Promise<void>; // 새로 추가
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  login: () => {},
  logout: () => {},
  setUser: () => {},
  refreshUserProfile: async () => {}, // 새로 추가
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // 페이지 로드 시 localStorage에서 사용자 정보 복원
  useEffect(() => {
    const savedUserInfo = localStorage.getItem('userInfo');
    const savedAuthStatus = localStorage.getItem('isAuthenticated');
    
    if (savedUserInfo && savedAuthStatus === 'true') {
      try {
        const userData = JSON.parse(savedUserInfo);
        setUser(userData);
        setIsAuthenticated(true);
        console.log('저장된 사용자 정보 복원:', userData);
      } catch (error) {
        console.error('사용자 정보 복원 실패:', error);
        localStorage.removeItem('userInfo');
        localStorage.removeItem('isAuthenticated');
      }
    }
  }, []);

  // 사용자 정보 변경 시 localStorage 업데이트
  useEffect(() => {
    if (user && isAuthenticated) {
      localStorage.setItem('userInfo', JSON.stringify(user));
    }
  }, [user, isAuthenticated]);

  const login = (userData?: any) => {
    console.log('로그인 처리:', userData);
    
    if (userData) {
      // 실제 로그인 성공 시 서버에서 받은 사용자 정보 사용
      const userInfo: User = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        phone: userData.phone || '',
        displayName: userData.displayName || userData.name,
        username: userData.username || '',
        bio: userData.bio || '',
        avatar: userData.avatar || '',
        template: 'glass', // 기본 템플릿
        signupDate: userData.signupDate
      };
      
      setUser(userInfo);
      setIsAuthenticated(true);
      
      // localStorage에 사용자 정보 저장
      localStorage.setItem('userInfo', JSON.stringify(userInfo));
      localStorage.setItem('isAuthenticated', 'true');
      
      console.log('사용자 정보 저장됨:', userInfo);
    } else {
      // 테스트용 MOCK_USER (개발 중에만 사용)
      console.warn('사용자 정보 없이 로그인됨 - 테스트 모드');
      setIsAuthenticated(true);
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('userInfo');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('sessionId');
    console.log('로그아웃 완료');
  };

  // 프로필 새로고침 함수 (새로 추가)
  const refreshUserProfile = async () => {
    if (!user?.email) return;

    try {
      const { ProfileService } = await import('../utils/profileService');
      const result = await ProfileService.getProfile(user.id, undefined, user.email);
      
      if (result.success && result.profile) {
        const updatedUser: User = {
          ...user,
          displayName: result.profile.displayName || user.displayName || user.name,
          username: result.profile.username || user.username || user.email?.split('@')[0] || '',
          bio: result.profile.bio || user.bio || '',
          avatar: result.profile.avatar || user.avatar || ''
        };
        
        setUser(updatedUser);
        localStorage.setItem('userInfo', JSON.stringify(updatedUser));
        console.log('프로필 새로고침 완료:', updatedUser);
      }
    } catch (error) {
      console.warn('프로필 새로고침 실패:', error);
    }
  };

  const contextValue = React.useMemo(() => ({
    isAuthenticated,
    user,
    login,
    logout,
    setUser,
    refreshUserProfile
  }), [isAuthenticated, user]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
export const useAuth = () => useContext(AuthContext);
