import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { User, Link as TLink } from '../types';
import PublicProfileContent from '../components/PublicProfileContent';
import { VisitorTracker } from '../utils/analytics';
import { ProfileService } from '../utils/profileService';
import { LinkService } from '../utils/linkService';

// 스켈레톤 로딩 컴포넌트 (최적화됨)
const ProfileSkeleton: React.FC = React.memo(() => (
  <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
    <div className="max-w-md mx-auto animate-pulse">
      <div className="text-center mb-8">
        <div className="w-24 h-24 bg-gray-300 rounded-full mx-auto mb-4"></div>
        <div className="h-6 bg-gray-300 rounded w-32 mx-auto mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-48 mx-auto"></div>
      </div>
      
      {/* 컨트롤 스켈레톤 추가 */}
      <div className="flex items-center justify-between mb-6 p-3 bg-gray-200 rounded-lg animate-pulse">
        <div className="h-8 bg-gray-300 rounded w-20"></div>
        <div className="flex space-x-1">
          <div className="w-8 h-8 bg-gray-300 rounded"></div>
          <div className="w-8 h-8 bg-gray-300 rounded"></div>
        </div>
      </div>
      
      <div className="space-y-3">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-12 bg-gray-300 rounded-lg"></div>
        ))}
      </div>
    </div>
  </div>
));

// Powered by 푸터 컴포넌트 (메모이제이션)
const PoweredByFooter: React.FC = React.memo(() => (
  <div className="text-center py-8 px-4">
    <a 
      href="https://linkitda.vercel.app/"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center space-x-2 text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200 group"
    >
      <span className="font-medium">Powered by</span>
      <span className="font-bold text-[#4F46E5] group-hover:text-[#4338CA] transition-colors">
        link:it.da
      </span>
      <svg 
        className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth="2" 
          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" 
        />
      </svg>
    </a>
  </div>
));

// 오류 페이지 컴포넌트 (메모이제이션)
const ErrorPage: React.FC<{ error: string; username?: string }> = React.memo(({ error, username }) => (
  <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex flex-col">
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">페이지를 찾을 수 없습니다</h1>
        <p className="text-gray-600 mb-6">
          {error || `사용자 '${username}'을(를) 찾을 수 없습니다.`}
        </p>
        <Link 
          to="/" 
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#4F46E5] hover:bg-[#4338CA] transition-colors"
        >
          홈으로 돌아가기
        </Link>
        
        {/* 디버깅 정보 (개발 환경에서만) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 p-4 bg-gray-100 rounded text-left">
            <h3 className="font-bold text-sm mb-2">디버깅 정보:</h3>
            <p className="text-xs text-gray-600">요청한 사용자명: {username}</p>
            <p className="text-xs text-gray-600">오류: {error}</p>
          </div>
        )}
      </div>
    </div>
    <PoweredByFooter />
  </div>
));

const PublicProfilePage: React.FC = () => {
  // 🔄 모든 Hooks를 컴포넌트 최상단에서 호출 (조건부 없이)
  const { username } = useParams<{ username: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [links, setLinks] = useState<TLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🔄 useCallback도 항상 호출
  const handleLinkClick = useCallback((link: TLink) => {
    console.log('링크 클릭:', link);
    // 비동기 로그 기록으로 성능 최적화
    setTimeout(() => {
      VisitorTracker.logLinkClick(link.id, link.title, link.url);
    }, 0);
  }, []);

  // 🔄 useEffect도 항상 호출
  useEffect(() => {
    const loadUserData = async () => {
      if (!username) {
        setError('사용자명이 제공되지 않았습니다.');
        setLoading(false);
        return;
      }

      console.log(`[Profile] 로딩 시작: ${username}`);
      setLoading(true);
      setError(null);

      // AbortController로 타임아웃 처리
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      try {
        // 1. 프로필 조회 (우선 실행)
        console.log(`[Profile] 프로필 조회: ${username}`);
        const profileResult = await Promise.race([
          ProfileService.getProfile(undefined, username),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('프로필 조회 타임아웃')), 10000)
          )
        ]) as any;

        console.log('[Profile] 프로필 결과:', profileResult?.success);

        if (!profileResult?.success || !profileResult?.profile) {
          console.warn(`[Profile] 사용자 "${username}" 프로필 없음`);
          setError(`사용자 "${username}"을(를) 찾을 수 없습니다.`);
          return;
        }

        const profile = profileResult.profile;

        // 2. User 객체 구성 (즉시 UI 업데이트)
        const profileUser: User = {
          id: profile.userId || profile.id || '',
          email: '',
          name: profile.displayName || username,
          phone: '',
          displayName: profile.displayName || username,
          username: profile.username || username,
          bio: profile.bio || '안녕하세요!',
          avatar: profile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=4F46E5&color=fff&size=200`,
          template: (profile.template as any) || 'Glass',
          signupDate: profile.createdDate ? new Date(profile.createdDate) : new Date()
        };

        setUser(profileUser);
        setLoading(false); // 프로필만으로도 페이지 렌더링 시작

        console.log(`[Profile] 기본 정보 설정 완료`);

        // 3. 링크 조회 (백그라운드에서 실행)
        if (profile.userId) {
          console.log(`[Profile] 백그라운드 링크 조회: ${profile.userId}`);
          
          // 링크 조회를 별도 비동기로 처리 - 모든 링크를 가져와서 PublicProfileContent에서 필터링
          LinkService.getLinks(profile.userId)
            .then((linksResult) => {
              console.log('[Profile] 링크 조회 완료:', linksResult?.length);
              
              if (Array.isArray(linksResult) && linksResult.length > 0) {
                // 모든 링크를 전달 (PublicProfileContent에서 활성 링크만 필터링)
                const sortedLinks = linksResult.sort((a, b) => (a.order || 0) - (b.order || 0));
                console.log(`[Profile] 전체 링크 ${sortedLinks.length}개 설정`);
                setLinks(sortedLinks);
              }
            })
            .catch((linkError) => {
              console.warn('[Profile] 링크 로드 실패:', linkError);
              setLinks([]);
            });
        }

        // 4. 방문자 로그 (완전히 백그라운드)
        setTimeout(() => {
          VisitorTracker.logVisit(`/${username}`, undefined, false)
            .catch(console.warn);
        }, 100);

      } catch (error: any) {
        console.error('[Profile] 로드 실패:', error);
        
        if (error.name === 'AbortError' || error.message.includes('타임아웃')) {
          setError('페이지 로드 시간이 초과되었습니다. 다시 시도해주세요.');
        } else {
          setError(`프로필을 불러오는 중 오류가 발생했습니다: ${error.message}`);
        }
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    };

    loadUserData();

    // 클린업 함수
    return () => {
      console.log(`[Profile] 클린업: ${username}`);
    };
  }, [username]);

  // 🔄 useMemo도 항상 호출
  const memoizedLinks = useMemo(() => links, [links]);

  // 🔄 렌더링 로직 (Hooks 호출 이후)
  // 로딩 상태
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex flex-col">
        <div className="flex-1">
          <ProfileSkeleton />
        </div>
        <PoweredByFooter />
      </div>
    );
  }

  // 오류 상태
  if (error || !user) {
    return <ErrorPage error={error || ''} username={username} />;
  }

  // 정상 상태
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex flex-col">
      <div className="flex-1">
        <PublicProfileContent 
          user={user} 
          links={memoizedLinks}
          isPreview={false}
          onLinkClick={handleLinkClick}
        />
      </div>
      <PoweredByFooter />
    </div>
  );
};

// 메모이제이션으로 불필요한 리렌더링 방지
export default React.memo(PublicProfilePage);
