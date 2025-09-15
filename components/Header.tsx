import React, { useState, useContext, useRef, useEffect } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { LogoIcon, ChevronDownIcon } from './icons/Icons';
import { ProfileService } from '../utils/profileService';

const Header: React.FC = () => {
  const { user, logout, setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 컴포넌트 마운트 시 프로필 정보 로드
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user?.email || profileLoading) return;

      try {
        setProfileLoading(true);
        const result = await ProfileService.getProfile(user.id, undefined, user.email);
        
        if (result.success && result.profile) {
          // 프로필 정보가 있으면 사용자 정보 업데이트
          setUser(prevUser => {
            if (!prevUser) return prevUser;
            
            return {
              ...prevUser,
              displayName: result.profile.displayName || prevUser.displayName || prevUser.name,
              username: result.profile.username || prevUser.username || prevUser.email?.split('@')[0],
              bio: result.profile.bio || prevUser.bio,
              avatar: result.profile.avatar || prevUser.avatar
            };
          });
        }
      } catch (error) {
        console.warn('헤더에서 프로필 로드 실패:', error);
      } finally {
        setProfileLoading(false);
      }
    };

    // 초기 로드 및 주기적 업데이트 (5분마다)
    loadUserProfile();
    const interval = setInterval(loadUserProfile, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user?.email, user?.id, setUser]);

  // 기본값 설정
  const getDisplayName = () => {
    if (user?.displayName) return user.displayName;
    if (user?.name) return user.name;
    return '사용자';
  };

  const getUsername = () => {
    if (user?.username) return user.username;
    if (user?.email) return user.email.split('@')[0];
    return 'username';
  };

  const getAvatarUrl = () => {
    if (user?.avatar) return user.avatar;
    // 기본 아바타 또는 이니셜 기반 아바타
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(getDisplayName())}&background=4F46E5&color=fff&size=32`;
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <div className="flex-shrink-0 flex items-center space-x-2">
                <LogoIcon className="h-8 w-8 text-[#4F46E5]" />
                <span className="font-bold text-xl text-gray-800">LinkHub</span>
            </div>
            <nav className="hidden md:flex md:space-x-8">
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `text-base font-medium transition-colors ${
                    isActive ? 'text-[#4F46E5]' : 'text-gray-500 hover:text-gray-900'
                  }`
                }
              >
                내 링크
              </NavLink>
              <NavLink
                to="/analytics"
                className={({ isActive }) =>
                  `text-base font-medium transition-colors ${
                    isActive ? 'text-[#4F46E5]' : 'text-gray-500 hover:text-gray-900'
                  }`
                }
              >
                통계
              </NavLink>
            </nav>
          </div>
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center space-x-2 bg-gray-100 rounded-full p-1 pr-3 hover:bg-gray-200 transition"
            >
              <div className="relative">
                <img 
                  className="h-8 w-8 rounded-full" 
                  src={getAvatarUrl()} 
                  alt="User"
                  onError={(e) => {
                    // 이미지 로드 실패 시 기본 아바타로 교체
                    const target = e.target as HTMLImageElement;
                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(getDisplayName())}&background=4F46E5&color=fff&size=32`;
                  }}
                />
                {profileLoading && (
                  <div className="absolute inset-0 bg-black bg-opacity-30 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  </div>
                )}
              </div>
              <span className="text-gray-700 font-medium text-sm hidden sm:block">{getDisplayName()}</span>
              <ChevronDownIcon className="h-4 w-4 text-gray-600" />
            </button>
            {dropdownOpen && (
              <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 z-10">
                <a href={`/#/profile/${getUsername()}`} target="_blank" rel="noopener noreferrer" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  내 페이지 보기
                </a>
                <Link to="/profile/edit" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  프로필 수정
                </Link>
                <Link to="/account/edit" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  회원정보 수정
                </Link>
                <div className="border-t border-gray-100 my-1"></div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  로그아웃
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
