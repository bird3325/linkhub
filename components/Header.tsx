
import React, { useState, useContext, useRef, useEffect } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { LogoIcon, ChevronDownIcon } from './icons/Icons';

const Header: React.FC = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
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
              <img className="h-8 w-8 rounded-full" src={user?.avatar} alt="User" />
              <span className="text-gray-700 font-medium text-sm hidden sm:block">{user?.displayName}</span>
              <ChevronDownIcon className="h-4 w-4 text-gray-600" />
            </button>
            {dropdownOpen && (
              <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 z-10">
                <a href={`/#/${user?.username}`} target="_blank" rel="noopener noreferrer" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
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
