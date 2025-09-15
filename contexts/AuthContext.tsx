import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User } from '../types';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (userData?: any) => void;
  logout: () => void;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  login: () => {},
  logout: () => {},
  setUser: () => {},
  refreshUserProfile: async () => {},
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
    const rememberMe = localStorage.getItem('rememberMe') === 'true';
    
    if (savedUserInfo && savedAuthStatus === 'true') {
      try {
        const userData = JSON.parse(savedUserInfo);
        
        if (rememberMe) {
          // 로그인 유지가 체크된 경우 - 무제한 유지
          console.log('로그인 유지 설정으로 자동 로그인');
          setUser(userData);
          setIsAuthenticated(true);
          
          // 로그인 유지 시간 갱신 (최근 접속 시간 업데이트)
          localStorage.setItem('lastAccessTime', Date.now().toString());
        } else {
          // 로그인 유지가 체크되지 않은 경우 - 세션 만료 체크 (7일)
          const sessionData = localStorage.getItem('sessionTimestamp');
          if (sessionData) {
            const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
            if (parseInt(sessionData) < sevenDaysAgo) {
              console.log('세션 만료로 자동 로그아웃 (7일 경과)');
              localStorage.removeItem('userInfo');
              localStorage.removeItem('isAuthenticated');
              localStorage.removeItem('sessionTimestamp');
              return;
            } else {
              // 세션이 유효한 경우
              setUser(userData);
              setIsAuthenticated(true);
              // 세션 시간 갱신
              localStorage.setItem('sessionTimestamp', Date.now().toString());
            }
          } else {
            // 세션 데이터가 없는 경우 새로 생성
            setUser(userData);
            setIsAuthenticated(true);
            localStorage.setItem('sessionTimestamp', Date.now().toString());
          }
        }
        
        console.log('저장된 사용자 정보 복원:', userData);
      } catch (error) {
        console.error('사용자 정보 복원 실패:', error);
        // 오류 발생 시 모든 인증 관련 데이터 삭제
        localStorage.removeItem('userInfo');
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('loginTimestamp');
        localStorage.removeItem('sessionTimestamp');
        localStorage.removeItem('lastAccessTime');
      }
    }
  }, []);

  // 사용자 정보 변경 시 localStorage 업데이트
  useEffect(() => {
    if (user && isAuthenticated) {
      localStorage.setItem('userInfo', JSON.stringify(user));
    }
  }, [user, isAuthenticated]);

  // 활동 감지를 위한 이벤트 리스너 (로그인 유지 시에만)
  useEffect(() => {
    const rememberMe = localStorage.getItem('rememberMe') === 'true';
    
    if (isAuthenticated && rememberMe) {
      const updateLastAccess = () => {
        localStorage.setItem('lastAccessTime', Date.now().toString());
      };

      // 사용자 활동 감지 이벤트들
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
      
      events.forEach(event => {
        document.addEventListener(event, updateLastAccess, true);
      });

      return () => {
        events.forEach(event => {
          document.removeEventListener(event, updateLastAccess, true);
        });
      };
    }
  }, [isAuthenticated]);

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
      
      // 로그인 방식에 따른 시간 설정
      const rememberMe = localStorage.getItem('rememberMe') === 'true';
      if (rememberMe) {
        // 로그인 유지 - 무제한 유지를 위한 타임스탬프
        localStorage.setItem('loginTimestamp', Date.now().toString());
        localStorage.setItem('lastAccessTime', Date.now().toString());
        console.log('무제한 로그인 유지 설정됨');
      } else {
        // 일반 로그인 - 7일 세션
        localStorage.setItem('sessionTimestamp', Date.now().toString());
        console.log('7일 세션 로그인 설정됨');
      }
      
      console.log('사용자 정보 저장됨:', userInfo);
    } else {
      // 테스트용 MOCK_USER (개발 중에만 사용)
      console.warn('사용자 정보 없이 로그인됨 - 테스트 모드');
      setIsAuthenticated(true);
      localStorage.setItem('sessionTimestamp', Date.now().toString());
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    
    // 모든 인증 관련 localStorage 데이터 삭제
    localStorage.removeItem('userInfo');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('rememberMe');
    localStorage.removeItem('loginTimestamp');
    localStorage.removeItem('sessionTimestamp');
    localStorage.removeItem('lastAccessTime');
    
    // sessionStorage도 정리
    sessionStorage.clear();
    
    console.log('로그아웃 완료 - 모든 인증 데이터 삭제됨');
  };

  // 프로필 새로고침 함수
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
