import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import type { User, Link } from '../types';
import PublicProfileContent from '../components/PublicProfileContent';
import { VisitorTracker } from '../utils/analytics';
import { ProfileService } from '../utils/profileService';
import { LinkService } from '../utils/linkService';

const PublicProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUserData = async () => {
      if (!username) {
        setError('사용자명이 제공되지 않았습니다.');
        setLoading(false);
        return;
      }

      setLoading(true);
      
      try {
        // 사용자명으로 프로필 조회
        const profileResult = await ProfileService.getProfile(undefined, username);
        
        if (profileResult.success && profileResult.profile) {
          // 프로필에서 사용자 정보 구성
          const profileUser: User = {
            id: profileResult.profile.userId,
            email: '', // 공개하지 않음
            name: profileResult.profile.displayName || username,
            phone: '',
            displayName: profileResult.profile.displayName || username,
            username: profileResult.profile.username || username,
            bio: profileResult.profile.bio || '',
            avatar: profileResult.profile.avatar || '',
            template: 'glass', // 기본 템플릿
            signupDate: profileResult.profile.createdDate || new Date()
          };
          
          setUser(profileUser);
          
          // 해당 사용자의 링크 조회
          try {
            const linksResult = await LinkService.getLinks(profileResult.profile.userId);
            if (linksResult && linksResult.length > 0) {
              // 활성화된 링크만 필터링하고 순서대로 정렬
              const activeLinks = linksResult
                .filter(link => link.isActive)
                .sort((a, b) => a.order - b.order);
              setLinks(activeLinks);
            } else {
              setLinks([]);
            }
          } catch (linkError) {
            console.warn('링크 로드 실패:', linkError);
            setLinks([]);
          }
          
          // 방문자 로그 기록
          console.log('퍼블릭 프로필 방문 로그 기록');
          VisitorTracker.logVisit(`/profile/${username}`, undefined, false);
          
        } else {
          setError('사용자를 찾을 수 없습니다.');
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
  const handleLinkClick = (link: Link) => {
    // 링크 클릭 로그 기록
    console.log('링크 클릭 로그 기록:', { link });
    VisitorTracker.logLinkClick(link.id, link.title, link.url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4F46E5] mx-auto mb-4"></div>
          <p className="text-gray-600">사용자 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">페이지를 찾을 수 없습니다</h1>
          <p className="text-gray-600 mb-8">{error || '요청하신 사용자를 찾을 수 없습니다.'}</p>
          <a 
            href="/#/" 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#4F46E5] hover:bg-[#4338CA]"
          >
            홈으로 돌아가기
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
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
