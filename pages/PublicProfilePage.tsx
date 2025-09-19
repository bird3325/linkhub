import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { User, Link as TLink } from '../types';
import PublicProfileContent from '../components/PublicProfileContent';
import { VisitorTracker } from '../utils/analytics';
import { ProfileService } from '../utils/profileService';
import { LinkService } from '../utils/linkService';

// 스켈레톤 로딩 컴포넌트
const ProfileSkeleton: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
    <div className="max-w-md mx-auto animate-pulse">
      <div className="text-center mb-8">
        <div className="w-24 h-24 bg-gray-300 rounded-full mx-auto mb-4"></div>
        <div className="h-6 bg-gray-300 rounded w-32 mx-auto mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-48 mx-auto"></div>
      </div>
      <div className="space-y-3">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="h-12 bg-gray-300 rounded-lg"></div>
        ))}
      </div>
    </div>
  </div>
);

const PublicProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [links, setLinks] = useState<TLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUserData = async () => {
      if (!username) {
        setError('사용자명이 제공되지 않았습니다.');
        setLoading(false);
        return;
      }

      console.log('공개 프로필 로딩 시작:', username);
      setLoading(true);
      setError(null);

      try {
        // 사용자명으로 프로필 조회
        console.log('프로필 조회 중...', username);
        const profileResult = await ProfileService.getProfile(undefined, username);
        
        console.log('프로필 조회 결과:', profileResult);

        if (profileResult.success && profileResult.profile) {
          console.log('프로필 발견:', profileResult.profile);
          
          // 프로필에서 사용자 정보 구성
          const profileUser: User = {
            id: profileResult.profile.userId || profileResult.profile.id || '',
            email: '', // 공개하지 않음
            name: profileResult.profile.displayName || username,
            phone: '',
            displayName: profileResult.profile.displayName || username,
            username: profileResult.profile.username || username,
            bio: profileResult.profile.bio || '안녕하세요!',
            avatar: profileResult.profile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=4F46E5&color=fff&size=200`,
            template: (profileResult.profile.template as any) || 'Glass',
            signupDate: profileResult.profile.createdDate ? new Date(profileResult.profile.createdDate) : new Date()
          };

          setUser(profileUser);
          console.log('사용자 정보 설정 완료:', profileUser);

          // 해당 사용자의 링크 조회
          try {
            console.log('링크 조회 중...', profileResult.profile.userId);
            const linksResult = await LinkService.getLinks(profileResult.profile.userId);
            console.log('링크 조회 결과:', linksResult);

            if (linksResult && linksResult.length > 0) {
              // 활성화된 링크만 필터링하고 순서대로 정렬
              const activeLinks = linksResult
                .filter(link => link.isActive)
                .sort((a, b) => (a.order || 0) - (b.order || 0));
              
              console.log('활성 링크들:', activeLinks);
              setLinks(activeLinks);
            } else {
              console.log('링크 없음');
              setLinks([]);
            }
          } catch (linkError) {
            console.warn('링크 로드 실패:', linkError);
            setLinks([]);
          }

          // 방문자 로그 기록 (비동기)
          setTimeout(() => {
            console.log('방문자 로그 기록:', username);
            VisitorTracker.logVisit(`/${username}`, undefined, false);
          }, 100);

        } else {
          console.log('프로필을 찾을 수 없음:', profileResult);
          setError(`사용자 '${username}'을(를) 찾을 수 없습니다.`);
        }

      } catch (error) {
        console.error('사용자 데이터 로드 실패:', error);
        setError('사용자 정보를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [username]);

  // 링크 클릭 핸들러
  const handleLinkClick = (link: TLink) => {
    console.log('링크 클릭:', link);
    // 링크 클릭 로그 기록 (비동기)
    setTimeout(() => {
      VisitorTracker.logLinkClick(link.id, link.title, link.url);
    }, 100);
  };

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
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
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <PublicProfileContent 
        user={user} 
        links={links}
        isPreview={false}
        onLinkClick={handleLinkClick}
      />
    </div>
  );
};

export default PublicProfilePage;
