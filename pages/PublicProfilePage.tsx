import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { User, Link as TLink } from '../types';
import PublicProfileContent from '../components/PublicProfileContent';
import { VisitorTracker } from '../utils/analytics';
import { ProfileService } from '../utils/profileService';
import { LinkService } from '../utils/linkService';

// 스켈레톤 로딩 컴포넌트 (쇼핑몰 스타일)
const ProfileSkeleton: React.FC = React.memo(() => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
    {/* 헤더 스켈레톤 */}
    <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 animate-pulse">
            <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
            <div>
              <div className="h-5 bg-gray-300 rounded w-24 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-32"></div>
            </div>
          </div>
          <div className="flex space-x-2 animate-pulse">
            <div className="w-20 h-8 bg-gray-300 rounded-full"></div>
            <div className="w-8 h-8 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    </div>

    {/* 메인 콘텐츠 스켈레톤 */}
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* 사이드바 스켈레톤 */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-pulse">
            <div className="text-center mb-6">
              <div className="w-24 h-24 bg-gray-300 rounded-full mx-auto mb-4"></div>
              <div className="h-6 bg-gray-300 rounded w-32 mx-auto mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-40 mx-auto"></div>
            </div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>

        {/* 상품/링크 그리드 스켈레톤 */}
        <div className="md:col-span-2">
          <div className="mb-6 flex items-center justify-between animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-32"></div>
            <div className="flex space-x-2">
              <div className="w-8 h-8 bg-gray-300 rounded"></div>
              <div className="w-8 h-8 bg-gray-300 rounded"></div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="aspect-square bg-gray-300 rounded-lg mb-3"></div>
                <div className="h-4 bg-gray-300 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
));

// 프리미엄 스타일 푸터
const PoweredByFooter: React.FC = React.memo(() => (
  <footer className="bg-slate-50 border-t border-gray-100 mt-16">
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center">
        <a 
          href="https://linkitda.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-3 text-gray-500 hover:text-gray-700 transition-all duration-300 group"
        >
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-md flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="font-medium">Powered by</span>
            <span className="font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent group-hover:from-indigo-700 group-hover:to-purple-700">
              link:it.da
            </span>
          </div>
          <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors group-hover:translate-x-1 transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
        <p className="mt-2 text-sm text-gray-400">나만의 프리미엄 링크 페이지를 만들어보세요</p>
      </div>
    </div>
  </footer>
));

// 에러 페이지 (쇼핑몰 스타일)
const ErrorPage: React.FC<{ error: string; username?: string }> = React.memo(({ error, username }) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-3">페이지를 찾을 수 없습니다</h1>
        <p className="text-gray-600 mb-8 leading-relaxed">
          {error || `"${username}" 사용자의 페이지가 존재하지 않거나 비공개 상태입니다.`}
        </p>
        
        <div className="space-y-3">
          <Link 
            to="/" 
            className="block w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105"
          >
            홈으로 돌아가기
          </Link>
          
          <Link 
            to="/signup" 
            className="block w-full bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium py-3 px-6 rounded-xl border border-gray-200 transition-all duration-300"
          >
            내 페이지 만들기
          </Link>
        </div>
        
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-800">
              디버깅 정보 보기
            </summary>
            <div className="mt-3 p-4 bg-gray-50 rounded-lg border">
              <div className="text-xs space-y-2">
                <p><span className="font-medium">사용자명:</span> {username}</p>
                <p><span className="font-medium">오류:</span> {error}</p>
                <p><span className="font-medium">URL:</span> {window.location.href}</p>
              </div>
            </div>
          </details>
        )}
      </div>
    </div>
    <PoweredByFooter />
  </div>
));

const PublicProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [links, setLinks] = useState<TLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleLinkClick = useCallback((link: TLink) => {
    console.log('링크 클릭:', link);
    // 성능 최적화된 로그 기록
    setTimeout(() => {
      VisitorTracker.logLinkClick(link.id, link.title, link.url);
    }, 0);
  }, []);

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

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      try {
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

        const profileUser: User = {
          id: profile.userId || profile.id || '',
          email: '',
          name: profile.displayName || username,
          phone: '',
          displayName: profile.displayName || username,
          username: profile.username || username,
          bio: profile.bio || '안녕하세요! 제 페이지에 오신 것을 환영합니다 ✨',
          avatar: profile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=4F46E5&color=fff&size=200`,
          template: (profile.template as any) || 'Glass',
          signupDate: profile.createdDate ? new Date(profile.createdDate) : new Date()
        };

        setUser(profileUser);
        setLoading(false);

        console.log(`[Profile] 기본 정보 설정 완료`);

        // 백그라운드 링크 로딩
        if (profile.userId) {
          console.log(`[Profile] 백그라운드 링크 조회: ${profile.userId}`);
          
          LinkService.getLinks(profile.userId)
            .then((linksResult) => {
              console.log('[Profile] 링크 조회 완료:', linksResult?.length);
              
              if (Array.isArray(linksResult) && linksResult.length > 0) {
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

        // 백그라운드 방문자 로그
        setTimeout(() => {
          VisitorTracker.logVisit(`/${username}`, undefined, false)
            .catch(console.warn);
        }, 100);

      } catch (error: any) {
        console.error('[Profile] 로드 실패:', error);
        
        if (error.name === 'AbortError' || error.message.includes('타임아웃')) {
          setError('페이지 로드 시간이 초과되었습니다. 새로고침을 시도해보세요.');
        } else {
          setError(`프로필을 불러오는 중 오류가 발생했습니다: ${error.message}`);
        }
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    };

    loadUserData();

    return () => {
      console.log(`[Profile] 클린업: ${username}`);
    };
  }, [username]);

  const memoizedLinks = useMemo(() => links, [links]);

  // 로딩 상태
  if (loading) {
    return (
      <div className="min-h-screen">
        <ProfileSkeleton />
        <PoweredByFooter />
      </div>
    );
  }

  // 오류 상태
  if (error || !user) {
    return <ErrorPage error={error || ''} username={username} />;
  }

  // 정상 상태 - 쇼핑몰 스타일 레이아웃
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
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

export default React.memo(PublicProfilePage);
