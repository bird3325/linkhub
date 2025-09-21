import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { User, Link } from '../types';
import { TemplateID, LinkStyle } from '../types';

interface PublicProfileContentProps {
  user?: User;
  links: Link[];
  isPreview?: boolean;
  onLinkClick?: (link: Link) => void;
}

// 인라인 아이콘 컴포넌트들
const GridViewIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const ListViewIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
  </svg>
);

const ChevronDownIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
  </svg>
);

// 쇼핑몰 스타일 링크 카드 컴포넌트
const ProductCard: React.FC<{
  link: Link;
  onClick: (e: React.MouseEvent, link: Link) => void;
  isPreview: boolean;
}> = ({ link, onClick, isPreview }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 group overflow-hidden">
      <button
        onClick={(e) => onClick(e, link)}
        className="w-full text-left"
        disabled={isPreview}
      >
        {/* 상품 이미지 영역 */}
        <div className="aspect-square bg-gray-50 rounded-t-xl overflow-hidden">
          {link.imageUrl ? (
            <img 
              src={link.imageUrl} 
              alt={link.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-xl font-bold text-indigo-600">
                    {link.title.charAt(0)}
                  </span>
                </div>
                <div className="text-xs text-gray-400 font-medium">미리보기</div>
              </div>
            </div>
          )}
        </div>
        
        {/* 상품 정보 영역 */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 text-sm leading-tight">
            {link.title}
          </h3>
          <p className="text-xs text-gray-500 line-clamp-1">
            {link.description || '링크를 클릭해서 확인하세요'}
          </p>
          
          {/* 클릭 수 표시 */}
          {link.clickCount > 0 && (
            <div className="flex items-center mt-2 text-xs text-gray-400">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {link.clickCount}
            </div>
          )}
        </div>
      </button>
    </div>
  );
};

const PublicProfileContent: React.FC<PublicProfileContentProps> = ({
  user,
  links = [],
  isPreview = false,
  onLinkClick
}) => {
  const [layout, setLayout] = useState<'list' | 'grid'>('grid'); // 기본값을 grid로
  const [sortOrder, setSortOrder] = useState<'default' | 'latest' | 'clicks'>('default');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  // user 객체 안전성 검사
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">사용자 정보 로딩 중...</h1>
          <p className="text-gray-600">잠시만 기다려주세요.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setSortMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 안전한 배열 처리
  const safeLinks = useMemo(() => {
    if (!Array.isArray(links)) {
      console.warn('PublicProfileContent: links is not an array, using empty array');
      return [];
    }
    return links;
  }, [links]);

  const sortedLinks = useMemo(() => {
    const linksCopy = [...safeLinks];
    switch (sortOrder) {
      case 'latest':
        return linksCopy.sort((a, b) => {
          const numA = parseInt(a.id.replace('link-', ''), 10);
          const numB = parseInt(b.id.replace('link-', ''), 10);
          if (isNaN(numA) || isNaN(numB)) return 0;
          return numB - numA;
        });
      case 'clicks':
        return linksCopy.sort((a, b) => (b.clickCount || 0) - (a.clickCount || 0));
      case 'default':
      default:
        return linksCopy.sort((a, b) => (a.order || 0) - (b.order || 0));
    }
  }, [safeLinks, sortOrder]);

  const linkClickHandler = (e: React.MouseEvent, link: Link) => {
    if (isPreview) {
      e.preventDefault();
      return;
    }

    if (onLinkClick) {
      onLinkClick(link);
    }

    window.open(link.url, '_blank', 'noopener,noreferrer');
    e.preventDefault();
  };

  const sortOptions = {
    'default': '기본순',
    'latest': '최신순',
    'clicks': '클릭순',
  };

  // 활성 링크 필터링
  const activeLinks = useMemo(() => {
    return sortedLinks.filter(l => l && l.isActive);
  }, [sortedLinks]);

  if (isPreview) {
    const displayLinks = activeLinks.slice(0, 3);
    
    return (
      <div className="h-full bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-4 overflow-hidden relative">
        <div className="max-w-sm mx-auto h-full flex flex-col">
          {/* 헤더 */}
          <div className="text-center mb-4 flex-shrink-0">
            <div className="relative inline-block mb-3">
              <img 
                src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username || 'User')}&background=4F46E5&color=fff&size=200`}
                alt={user.displayName || user.username || 'User'}
                className="w-16 h-16 rounded-full border-2 border-white shadow-md"
              />
            </div>
            <h1 className="text-lg font-bold text-gray-800 mb-1">@{user.username || 'username'}</h1>
            <p className="text-xs leading-relaxed text-gray-600 line-clamp-2">{user.bio || '안녕하세요!'}</p>
          </div>

          {/* 컨트롤 */}
          <div className="flex items-center justify-between mb-3 p-2 bg-gray-50 rounded-lg border flex-shrink-0">
            <div className="relative" ref={sortDropdownRef}>
              <button
                onClick={() => setSortMenuOpen(!sortMenuOpen)}
                className="flex items-center space-x-1 px-2 py-1 rounded-md transition-colors text-xs text-gray-700 hover:bg-white border border-gray-200 shadow-sm"
              >
                <span>{sortOptions[sortOrder]}</span>
                <ChevronDownIcon className="w-3 h-3" />
              </button>
              
              {sortMenuOpen && (
                <div className="absolute top-full left-0 mt-1 w-24 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                  {(Object.keys(sortOptions) as Array<keyof typeof sortOptions>).map((key) => (
                    <button
                      key={key}
                      onClick={() => {
                        setSortOrder(key);
                        setSortMenuOpen(false);
                      }}
                      className={`w-full text-left block px-2 py-1 text-xs ${
                        sortOrder === key ? 'font-semibold text-gray-900 bg-gray-100' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      } first:rounded-t-md last:rounded-b-md`}
                    >
                      {sortOptions[key]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-1 bg-white rounded-md border border-gray-200 p-0.5">
              <button
                onClick={() => setLayout('list')}
                className={`p-1 rounded-sm transition-colors ${
                  layout === 'list' ? 'bg-gray-100 shadow-sm' : 'opacity-60 hover:opacity-100 hover:bg-gray-50'
                }`}
              >
                <ListViewIcon className="w-3 h-3 text-gray-600" />
              </button>
              <button
                onClick={() => setLayout('grid')}
                className={`p-1 rounded-sm transition-colors ${
                  layout === 'grid' ? 'bg-gray-100 shadow-sm' : 'opacity-60 hover:opacity-100 hover:bg-gray-50'
                }`}
              >
                <GridViewIcon className="w-3 h-3 text-gray-600" />
              </button>
            </div>
          </div>

          {/* 링크 */}
          <div className="grid grid-cols-2 gap-2 flex-1 overflow-hidden">
            {displayLinks.map((link) => (
              <ProductCard
                key={link.id}
                link={link}
                onClick={linkClickHandler}
                isPreview={isPreview}
              />
            ))}
          </div>

          {activeLinks.length > 3 && (
            <div className="text-center mt-2 flex-shrink-0">
              <p className="text-xs text-gray-400">+{activeLinks.length - 3}개 더</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ✅ 일반 공개 프로필 페이지 - 쇼핑몰 스타일 레이아웃
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* 헤더 */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img 
                src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username || 'User')}&background=4F46E5&color=fff&size=200`}
                alt={user.displayName || user.username || 'User'}
                className="w-12 h-12 rounded-full border-2 border-white shadow-md"
              />
              <div>
                <h1 className="text-lg font-bold text-gray-900">@{user.username || 'username'}</h1>
                <p className="text-sm text-gray-600">{user.bio || '안녕하세요! 제 페이지에 오신 것을 환영합니다 ✨'}</p>
              </div>
            </div>
            
            {/* 헤더 컨트롤 */}
            {activeLinks.length > 0 && (
              <div className="flex items-center space-x-3">
                <div className="relative" ref={sortDropdownRef}>
                  <button
                    onClick={() => setSortMenuOpen(!sortMenuOpen)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-full bg-white border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <span>{sortOptions[sortOrder]}</span>
                    <ChevronDownIcon className="w-4 h-4" />
                  </button>
                  
                  {sortMenuOpen && (
                    <div className="absolute top-full right-0 mt-2 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                      {(Object.keys(sortOptions) as Array<keyof typeof sortOptions>).map((key) => (
                        <button
                          key={key}
                          onClick={() => {
                            setSortOrder(key);
                            setSortMenuOpen(false);
                          }}
                          className={`w-full text-left block px-3 py-2 text-sm ${
                            sortOrder === key ? 'font-semibold text-gray-900 bg-gray-50' : 'text-gray-700 hover:bg-gray-50'
                          } first:rounded-t-lg last:rounded-b-lg`}
                        >
                          {sortOptions[key]}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center bg-white rounded-full border border-gray-200 p-1">
                  <button
                    onClick={() => setLayout('list')}
                    className={`p-2 rounded-full transition-colors ${
                      layout === 'list' ? 'bg-gray-100 shadow-sm' : 'hover:bg-gray-50'
                    }`}
                  >
                    <ListViewIcon className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => setLayout('grid')}
                    className={`p-2 rounded-full transition-colors ${
                      layout === 'grid' ? 'bg-gray-100 shadow-sm' : 'hover:bg-gray-50'
                    }`}
                  >
                    <GridViewIcon className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* 사이드바 */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <div className="text-center mb-6">
                <img 
                  src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username || 'User')}&background=4F46E5&color=fff&size=200`}
                  alt={user.displayName || user.username || 'User'}
                  className="w-24 h-24 rounded-full border-4 border-white shadow-lg mx-auto mb-4"
                />
                <h2 className="text-xl font-bold text-gray-900 mb-2">@{user.username || 'username'}</h2>
                <p className="text-gray-600 text-sm leading-relaxed">{user.bio || '안녕하세요! 제 페이지에 오신 것을 환영합니다 ✨'}</p>
              </div>
              
              {/* 통계 정보 */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">공개 링크</span>
                  <span className="font-semibold text-gray-900">{activeLinks.length}개</span>
                </div>
                {activeLinks.length > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">총 클릭수</span>
                    <span className="font-semibold text-gray-900">
                      {activeLinks.reduce((sum, link) => sum + (link.clickCount || 0), 0)}회
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 상품/링크 그리드 */}
          <div className="md:col-span-2">
            {activeLinks.length > 0 ? (
              <div className={
                layout === 'grid' 
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' 
                  : 'space-y-4'
              }>
                {activeLinks.map((link) => (
                  layout === 'grid' ? (
                    <ProductCard
                      key={link.id}
                      link={link}
                      onClick={linkClickHandler}
                      isPreview={isPreview}
                    />
                  ) : (
                    <div key={link.id} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 p-4">
                      <button
                        onClick={(e) => linkClickHandler(e, link)}
                        className="w-full text-left flex items-center space-x-4"
                      >
                        {link.imageUrl ? (
                          <img 
                            src={link.imageUrl} 
                            alt={link.title}
                            className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-lg font-bold text-indigo-600">
                              {link.title.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                            {link.title}
                          </h3>
                          <p className="text-sm text-gray-500 line-clamp-2">
                            {link.description || '링크를 클릭해서 확인하세요'}
                          </p>
                          {link.clickCount > 0 && (
                            <div className="flex items-center mt-2 text-xs text-gray-400">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {link.clickCount}회 클릭
                            </div>
                          )}
                        </div>
                      </button>
                    </div>
                  )
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">아직 공개된 링크가 없습니다</h3>
                <p className="text-gray-600">곧 새로운 콘텐츠가 추가될 예정이에요!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicProfileContent;
