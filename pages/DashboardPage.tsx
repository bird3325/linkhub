import React, { useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import type { User, Link as TLink } from '../types';
import { PlusIcon, DragHandleIcon, EditIcon, ExternalLinkIcon } from '../components/icons/Icons';
import PublicProfileContent from '../components/PublicProfileContent';
import { LinkContext } from '../contexts/LinkContext';
import { AuthContext } from '../contexts/AuthContext';
import Toggle from '../components/Toggle';
import { VisitorTracker } from '../utils/analytics';
import { LinkService } from '../utils/linkService';
import { ProfileService } from '../utils/profileService';

// ✅ 초고속 스켈레톤 UI 컴포넌트들 (React.memo 적용)
const LinkSkeleton: React.FC = React.memo(() => (
  <div className="animate-pulse">
    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
      <div className="flex items-center space-x-4">
        <div className="w-5 h-5 bg-gray-300 rounded"></div>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-300 rounded"></div>
          <div>
            <div className="flex items-center space-x-2">
              <div className="h-4 bg-gray-300 rounded w-32"></div>
              <div className="h-5 bg-gray-200 rounded-full w-12"></div>
            </div>
            <div className="h-3 bg-gray-200 rounded w-48 mt-1"></div>
            <div className="h-2 bg-gray-200 rounded w-40 mt-1"></div>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="w-5 h-5 bg-gray-300 rounded"></div>
        <div className="flex items-center space-x-2">
          <div className="w-10 h-5 bg-gray-300 rounded-full"></div>
          <div className="h-3 bg-gray-200 rounded w-8"></div>
        </div>
      </div>
    </div>
  </div>
));

const LinkListSkeleton: React.FC = React.memo(() => (
  <div className="space-y-4">
    {[...Array(3)].map((_, index) => (
      <LinkSkeleton key={index} />
    ))}
  </div>
));

const PreviewSkeleton: React.FC = React.memo(() => (
  <div className="animate-pulse">
    <div className="bg-gray-100 rounded-lg overflow-hidden">
      <div className="bg-gray-200 px-4 py-2 flex items-center space-x-2">
        <div className="flex space-x-1">
          <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
          <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
          <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
        </div>
        <div className="flex-1 text-center">
          <div className="h-3 bg-gray-300 rounded w-40 mx-auto"></div>
        </div>
        <div className="w-16"></div>
      </div>
      
      <div className="bg-white p-8" style={{ minHeight: '400px' }}>
        {/* 프로필 헤더 스켈레톤 */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-gray-300 rounded-full mx-auto mb-4"></div>
          <div className="h-6 bg-gray-300 rounded w-32 mx-auto mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-48 mx-auto mb-1"></div>
          <div className="h-4 bg-gray-200 rounded w-40 mx-auto"></div>
        </div>
        
        {/* 링크 스켈레톤 */}
        <div className="space-y-3 max-w-md mx-auto">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="h-12 bg-gray-300 rounded-lg"></div>
          ))}
        </div>
      </div>
    </div>
  </div>
));

const HeaderSkeleton: React.FC = React.memo(() => (
  <div className="animate-pulse">
    <div className="flex justify-between items-center mb-6">
      <div className="h-6 bg-gray-300 rounded w-32"></div>
      <div className="h-9 bg-gray-300 rounded w-28"></div>
    </div>
  </div>
));

// ✅ 초고속 링크 항목 컴포넌트 (메모이제이션 강화)
const LinkItem: React.FC<{
  link: TLink;
  index: number;
  toggleLoading: { [key: string]: boolean };
  onEdit: (linkId: string) => void;
  onToggle: (linkId: string, isActive: boolean) => void;
  onDragStart: (index: number) => void;
  onDragEnter: (index: number) => void;
  onDragEnd: () => void;
}> = React.memo(({ 
  link, 
  index, 
  toggleLoading, 
  onEdit, 
  onToggle, 
  onDragStart, 
  onDragEnter, 
  onDragEnd 
}) => {
  console.log(`[LinkItem] 렌더링: ${link.id}`);

  const handleEditClick = useCallback(() => {
    onEdit(link.id);
  }, [link.id, onEdit]);

  const handleToggleChange = useCallback((isActive: boolean) => {
    onToggle(link.id, isActive);
  }, [link.id, onToggle]);

  const handleDragStart = useCallback(() => {
    if (!toggleLoading[link.id]) {
      onDragStart(index);
    }
  }, [index, link.id, toggleLoading, onDragStart]);

  const handleDragEnter = useCallback(() => {
    if (!toggleLoading[link.id]) {
      onDragEnter(index);
    }
  }, [index, link.id, toggleLoading, onDragEnter]);

  // ✅ 카테고리 표시 최적화
  const categoryDisplay = useMemo(() => {
    if (!link.category) return null;
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 mr-2">
        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
        {link.category}
      </span>
    );
  }, [link.category]);

  return (
    <div
      className={`flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all ${
        !link.isActive ? 'opacity-60 bg-gray-50' : ''
      }`}
      draggable={!toggleLoading[link.id]}
      onDragStart={handleDragStart}
      onDragEnter={handleDragEnter}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
    >
      <div className="flex items-center space-x-4">
        <DragHandleIcon 
          className={`w-5 h-5 text-gray-400 ${toggleLoading[link.id] ? 'cursor-not-allowed' : 'cursor-move'}`} 
        />
        <div className="flex items-center space-x-3">
          {link.imageUrl && (link.style === 'THUMBNAIL' || link.style === 'BACKGROUND') && (
            <img 
              src={link.imageUrl} 
              alt={link.title}
              className="w-10 h-10 rounded object-cover flex-shrink-0"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
              loading="lazy"
            />
          )}
          <div>
            <div className="flex items-center space-x-2 flex-wrap">
              <h4 className="font-medium text-gray-900">{link.title}</h4>
              {/* ✅ 카테고리 표시 */}
              {categoryDisplay}
              {!link.isActive && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                  비공개
                </span>
              )}
              {link.isActive && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-600">
                  공개
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 truncate max-w-md">{link.url}</p>
            <p className="text-xs text-gray-400">
              스타일: {link.style} • 클릭: {link.clickCount || 0}회 • 순서: {link.order || index + 1}
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <button 
          onClick={handleEditClick}
          className="text-gray-500 hover:text-[#4F46E5] p-1"
          title="링크 수정"
          disabled={toggleLoading[link.id]}
        >
          <EditIcon className="w-5 h-5" />
        </button>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Toggle 
              checked={link.isActive}
              onChange={handleToggleChange}
              labelId={`toggle-link-visibility-${link.id}`}
              disabled={toggleLoading[link.id]}
            />
            {toggleLoading[link.id] && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3 h-3 border border-[#4F46E5] border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
          <span className={`text-xs font-medium ${
            toggleLoading[link.id] ? 'text-gray-400' : 
            link.isActive ? 'text-green-600' : 'text-gray-500'
          }`}>
            {toggleLoading[link.id] ? '변경 중...' : (link.isActive ? '공개' : '비공개')}
          </span>
        </div>
      </div>
    </div>
  );
});

LinkItem.displayName = 'LinkItem';

const DashboardPage: React.FC = () => {
  // ✅ 초고속 상태 관리 최적화
  const [profileLoading, setProfileLoading] = useState(true);
  const [linksLoading, setLinksLoading] = useState(true);
  const [displayUser, setDisplayUser] = useState<User | null>(null);
  const [toggleLoading, setToggleLoading] = useState<{ [key: string]: boolean }>({});
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const { links, setLinks } = useContext(LinkContext);
  const { user: authUser, setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const dragItem = React.useRef<number | null>(null);
  const dragOverItem = React.useRef<number | null>(null);

  // ✅ 기본값이 포함된 사용자 정보 생성 함수 (메모이제이션 강화)
  const createDisplayUser = useCallback((authUser: any, profileData?: any): User => {
    if (!authUser) {
      return {
        id: '',
        email: '',
        name: '사용자',
        phone: '',
        displayName: '사용자',
        username: 'username',
        bio: '안녕하세요! 저의 링크들을 확인해보세요.',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent('사용자')}&background=4F46E5&color=fff&size=200`,
        template: 'Glass' as any,
        signupDate: new Date()
      };
    }
    
    const finalDisplayName = profileData?.displayName || authUser.displayName || authUser.name || '사용자';
    const finalUsername = profileData?.username || authUser.username || authUser.email?.split('@')[0] || 'username';
    const finalBio = profileData?.bio || authUser.bio || '안녕하세요! 저의 링크들을 확인해보세요.';
    const finalAvatar = profileData?.avatar || authUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(finalDisplayName)}&background=4F46E5&color=fff&size=200`;
    
    return {
      id: authUser.id,
      email: authUser.email,
      name: authUser.name,
      phone: authUser.phone || '',
      displayName: finalDisplayName,
      username: finalUsername,
      bio: finalBio,
      avatar: finalAvatar,
      template: authUser.template || 'Glass' as any,
      signupDate: authUser.signupDate
    };
  }, []);

  // ✅ 새 링크 추가 버튼 핸들러 (최적화)
  const handleAddNewLink = useCallback(() => {
    console.log('새 링크 추가 버튼 클릭됨');
    navigate('/link/new');
  }, [navigate]);

  // ✅ 내 페이지 보기 핸들러 (최적화)
  const handleViewMyPage = useCallback(() => {
    if (!displayUser?.username) {
      alert('사용자명이 설정되지 않았습니다. 프로필을 먼저 설정해주세요.');
      navigate('/profile/edit');
      return;
    }
    
    if (displayUser.username === 'username') {
      alert('고유한 사용자명을 설정해야 공개 페이지를 볼 수 있습니다. 프로필을 수정해주세요.');
      navigate('/profile/edit');
      return;
    }
    
    const profileUrl = `https://linkitda.vercel.app/${displayUser.username}`;
    console.log('내 페이지 링크:', profileUrl);
    window.open(profileUrl, '_blank', 'noopener,noreferrer');
  }, [displayUser?.username, navigate]);

  // ✅ 초고속 병렬 데이터 로딩 (프로필 + 링크 동시 처리)
  const loadUserData = useCallback(async () => {
    if (!authUser?.email) {
      console.log('로그인된 사용자가 없어 데이터 로드 건너뜀');
      setDisplayUser(createDisplayUser(authUser));
      setLinks([]);
      setProfileLoading(false);
      setLinksLoading(false);
      setInitialLoadComplete(true);
      return;
    }

    console.log('[Dashboard] 초고속 데이터 로딩 시작');
    const startTime = performance.now();

    try {
      // ✅ 병렬 로딩으로 속도 최적화
      const [profileResult, linksResult] = await Promise.allSettled([
        ProfileService.getProfile(authUser.id, undefined, authUser.email),
        LinkService.getLinks(authUser.id, authUser.email)
      ]);

      // 프로필 처리
      if (profileResult.status === 'fulfilled' && profileResult.value?.success && profileResult.value?.profile) {
        console.log('구글 시트에서 프로필 로드 성공:', profileResult.value.profile);
        
        const updatedAuthUser = {
          ...authUser,
          displayName: profileResult.value.profile.displayName || authUser.displayName || authUser.name,
          username: profileResult.value.profile.username || authUser.username || authUser.email?.split('@')[0],
          bio: profileResult.value.profile.bio || authUser.bio,
          avatar: profileResult.value.profile.avatar || authUser.avatar,
          template: profileResult.value.profile.template || authUser.template || 'Glass'
        };
        
        setUser(updatedAuthUser);
        const createdUser = createDisplayUser(authUser, profileResult.value.profile);
        setDisplayUser(createdUser);
      } else {
        console.log('구글 시트에 프로필이 없음, 기본값 사용');
        const createdUser = createDisplayUser(authUser);
        setDisplayUser(createdUser);
      }

      setProfileLoading(false);

      // 링크 처리
      if (linksResult.status === 'fulfilled' && linksResult.value && linksResult.value.length > 0) {
        console.log('구글 시트에서 링크 로드 성공:', linksResult.value.length, '개');
        
        // ✅ 정렬 최적화 (한 번만 수행)
        const sortedLinks = linksResult.value
          .filter(link => link && typeof link === 'object')
          .sort((a, b) => (a.order || 0) - (b.order || 0));
        
        setLinks(sortedLinks);
      } else {
        console.log('구글 시트에 링크가 없음, 빈 배열 설정');
        setLinks([]);
      }

      setLinksLoading(false);

      const endTime = performance.now();
      console.log(`[Dashboard] 데이터 로딩 완료: ${(endTime - startTime).toFixed(2)}ms`);

    } catch (error: any) {
      console.warn('데이터 로드 실패:', error);
      const createdUser = createDisplayUser(authUser);
      setDisplayUser(createdUser);
      setLinks([]);
    } finally {
      setProfileLoading(false);
      setLinksLoading(false);
      setInitialLoadComplete(true);
    }
  }, [authUser?.id, authUser?.email, setUser, setLinks, createDisplayUser]);

  // ✅ 초기 로딩
  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // ✅ 새로고침 핸들러 최적화
  const handleRefresh = useCallback(() => {
    console.log('[Dashboard] 수동 새로고침');
    setRefreshKey(prev => prev + 1);
    loadUserData();
  }, [loadUserData]);

  // ✅ 방문자 추적 로그 기록 (최적화 - 한번만 실행)
  useEffect(() => {
    const logVisit = async () => {
      try {
        await VisitorTracker.logVisit('/dashboard', undefined, true);
      } catch (error) {
        console.warn('[Dashboard] 방문 로그 실패:', error);
      }
    };

    if (authUser && initialLoadComplete) {
      console.log('대시보드 방문 로그 기록 (로그인 사용자):', authUser);
      // ✅ 메인 UI 로딩 후 실행
      setTimeout(logVisit, 100);
    }
  }, [authUser, initialLoadComplete]);

  // ✅ 드래그 정렬 최적화 (메모이제이션)
  const handleSort = useCallback(async () => {
    if(dragItem.current === null || dragOverItem.current === null || !authUser?.id) return;

    let _links = [...links];
    const draggedItemContent = _links.splice(dragItem.current, 1)[0];
    _links.splice(dragOverItem.current, 0, draggedItemContent);

    dragItem.current = null;
    dragOverItem.current = null;

    const reorderedLinks = _links.map((link, index) => ({ ...link, order: index + 1 }));
    setLinks(reorderedLinks);

    // ✅ 서버 업데이트를 비동기로 처리
    try {
      const linkOrders: { [key: string]: number } = {};
      reorderedLinks.forEach((link, index) => {
        linkOrders[link.id] = index + 1;
      });
      
      // 백그라운드에서 업데이트
      LinkService.updateLinkOrders(authUser.id, linkOrders, authUser.email)
        .then(() => console.log('링크 순서 구글 시트에 업데이트됨'))
        .catch(error => console.warn('링크 순서 업데이트 실패:', error));
    } catch (error) {
      console.warn('링크 순서 업데이트 실패:', error);
    }
  }, [links, authUser?.id, authUser?.email, setLinks]);

  // ✅ 링크 활성/비활성 토글 최적화 (Optimistic Update)
  const handleToggleActive = useCallback(async (linkId: string, isActive: boolean) => {
    console.log('[Dashboard] 링크 활성 상태 변경 시작:', { linkId, isActive });

    if (!authUser?.id) {
      console.error('사용자 정보가 없습니다');
      alert('사용자 정보가 없습니다. 다시 로그인해주세요.');
      return;
    }

    const targetLink = links.find(l => l.id === linkId);
    if (!targetLink) {
      console.error('해당 링크를 찾을 수 없습니다:', linkId);
      alert('해당 링크를 찾을 수 없습니다.');
      return;
    }

    if (targetLink.isActive === isActive) {
      console.log('이미 같은 상태입니다:', isActive);
      return;
    }

    setToggleLoading(prev => ({ ...prev, [linkId]: true }));

    const originalLinks = [...links];
    // ✅ 즉시 UI 업데이트 (Optimistic Update)
    setLinks(links.map(link => 
      link.id === linkId ? { ...link, isActive } : link
    ));

    try {
      console.log('서버에 토글 요청 전송 중...');
      
      const result = await LinkService.updateLink(linkId, { 
        isActive: isActive 
      });
      
      if (result.success) {
        console.log('[Dashboard] 링크 활성 상태 변경 성공:', {
          linkId,
          isActive,
          title: targetLink.title
        });
      } else {
        console.warn('서버에서 실패 응답:', result.message);
        // ✅ 실패 시 롤백
        setLinks(originalLinks);
        alert(`링크 ${isActive ? '공개' : '비공개'} 설정에 실패했습니다.\n${result.message || '알 수 없는 오류'}`);
      }
    } catch (error: any) {
      console.error('[Dashboard] 링크 활성 상태 변경 오류:', error);
      // ✅ 오류 시 롤백
      setLinks(originalLinks);
      
      let errorMessage = '링크 상태 변경 중 오류가 발생했습니다.';
      
      if (error.message.includes('네트워크')) {
        errorMessage = '네트워크 연결을 확인해주세요.';
      } else if (error.message.includes('권한')) {
        errorMessage = '권한이 없습니다. 다시 로그인해주세요.';
      } else if (error.message.includes('찾을 수 없습니다')) {
        errorMessage = '해당 링크를 찾을 수 없습니다.';
      }
      
      alert(errorMessage);
    } finally {
      // ✅ 로딩 상태 해제
      setTimeout(() => {
        setToggleLoading(prev => {
          const newState = { ...prev };
          delete newState[linkId];
          return newState;
        });
      }, 300);
    }
  }, [links, authUser?.id, setLinks]);

  // ✅ 드래그 핸들러들 메모이제이션
  const handleDragStart = useCallback((index: number) => {
    dragItem.current = index;
  }, []);

  const handleDragEnter = useCallback((index: number) => {
    dragOverItem.current = index;
  }, []);

  const handleEditLink = useCallback((linkId: string) => {
    console.log('[Dashboard] 링크 수정:', linkId);
    navigate(`/link/edit/${linkId}`);
  }, [navigate]);

  // ✅ 메모이제이션된 활성 링크 필터링
  const activeLinks = useMemo(() => {
    console.log('[Dashboard] 활성 링크 메모이제이션:', links.length);
    return links.filter(l => l.isActive);
  }, [links]);

  // ✅ 메모이제이션된 링크 목록
  const memoizedLinks = useMemo(() => {
    console.log('[Dashboard] 링크 메모이제이션:', links.length);
    return links;
  }, [links]);

  // ✅ 초기 로딩 상태 - 스켈레톤 UI 적용
  if (!initialLoadComplete) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-4xl mx-auto">
            
            {/* Links Management Section Skeleton */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <HeaderSkeleton />
              <LinkListSkeleton />
            </div>

            {/* Preview Section Skeleton */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-300 rounded w-20 mb-1"></div>
                  <div className="h-4 bg-gray-200 rounded w-80"></div>
                </div>
              </div>
              <div className="p-6">
                <PreviewSkeleton />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // displayUser가 null일 때도 스켈레톤 표시
  if (!displayUser) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-4xl mx-auto">
            
            {/* Links Management Section Skeleton */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <HeaderSkeleton />
              <div className="animate-pulse">
                <div className="text-center py-8">
                  <div className="h-5 bg-gray-300 rounded w-48 mx-auto mb-4"></div>
                  <div className="h-9 bg-gray-300 rounded w-36 mx-auto"></div>
                </div>
              </div>
            </div>

            {/* Preview Section Skeleton */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-300 rounded w-20 mb-1"></div>
                  <div className="h-4 bg-gray-200 rounded w-80"></div>
                </div>
              </div>
              <div className="p-6">
                <PreviewSkeleton />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          
          {/* ✅ Links Management Section (기존 UI 유지 + 최적화) */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">내 링크 관리</h2>
              <div className="flex space-x-3">
                <button
                  onClick={handleRefresh}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  disabled={profileLoading || linksLoading}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  새로고침
                </button>
                <button
                  onClick={handleAddNewLink}
                  className="bg-[#4F46E5] text-white font-semibold py-2 px-4 rounded-lg text-sm hover:bg-[#4338CA] flex items-center"
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  새 링크 추가
                </button>
              </div>
            </div>

            {linksLoading ? (
              <LinkListSkeleton />
            ) : memoizedLinks.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">아직 링크가 없습니다</h3>
                <p className="text-gray-500 mb-4">첫 번째 링크를 추가해보세요!</p>
                <button
                  onClick={handleAddNewLink}
                  className="bg-[#4F46E5] text-white font-semibold py-2 px-4 rounded-lg text-sm hover:bg-[#4338CA]"
                >
                  링크 추가하기
                </button>
              </div>
            ) : (
              <div className="space-y-4" key={refreshKey}>
                <div className="mb-4 text-sm text-gray-600">
                  총 {memoizedLinks.length}개의 링크가 있습니다 (공개: {activeLinks.length}개)
                </div>
                {memoizedLinks.map((link, index) => (
                  <LinkItem
                    key={link.id}
                    link={link}
                    index={index}
                    toggleLoading={toggleLoading}
                    onEdit={handleEditLink}
                    onToggle={handleToggleActive}
                    onDragStart={handleDragStart}
                    onDragEnter={handleDragEnter}
                    onDragEnd={handleSort}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ✅ Preview Section (기존 UI 유지 + 최적화) */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">미리보기</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    실제 사용자들이 보게 될 페이지의 모습입니다 (공개된 링크만 표시)
                  </p>
                </div>
                {displayUser?.username && displayUser.username !== 'username' && (
                  <a
                    href={`https://linkitda.vercel.app/${displayUser.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-indigo-600 hover:text-indigo-800"
                  >
                    공개 페이지 보기 →
                  </a>
                )}
              </div>
            </div>
            
            {profileLoading ? (
              <div className="p-6">
                <PreviewSkeleton />
              </div>
            ) : (
              <div className="p-6">
                <div className="bg-gray-100 rounded-lg overflow-hidden">
                  <div className="bg-gray-200 px-4 py-2 flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    </div>
                    <div className="flex-1 text-center">
                      <span className="text-sm text-gray-600">
                        linkitda.vercel.app/{displayUser.username}
                      </span>
                    </div>
                    <div className="w-16"></div>
                  </div>
                  
                  <div className="bg-white" style={{ minHeight: '400px', maxHeight: '600px', overflow: 'auto' }}>
                    <PublicProfileContent 
                      user={displayUser} 
                      links={activeLinks} // 메모이제이션된 활성 링크만 전달
                      isPreview={true}
                    />
                  </div>
                </div>
                
                <div className="mt-6 text-center space-y-2">
                  <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-4">
                    <button
                      onClick={handleViewMyPage}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#4F46E5] hover:bg-[#4338CA] transition-colors"
                      disabled={!displayUser.username || displayUser.username === 'username'}
                    >
                      <ExternalLinkIcon className="w-4 h-4 mr-2" />
                      내 페이지 보기
                    </button>
                  </div>
                  
                  {!displayUser.username || displayUser.username === 'username' ? (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <p className="text-sm text-yellow-800">
                          고유한 사용자명을 설정하여 개성 있는 프로필 URL을 만들어보세요!
                          <br />
                          <strong>linkitda.vercel.app/[사용자명]</strong> 형태로 공개됩니다.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500">
                        공개 URL: <span className="font-mono text-blue-600">https://linkitda.vercel.app/{displayUser.username}</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default React.memo(DashboardPage);
