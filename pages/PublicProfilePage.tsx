import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MOCK_USER, MOCK_LINKS } from '../constants';
import type { User, Link } from '../types';
import PublicProfileContent from '../components/PublicProfileContent';
import { VisitorTracker } from '../utils/analytics';

const PublicProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate fetching data for the user
    setLoading(true);
    if (username === MOCK_USER.username) {
      setUser(MOCK_USER);
      setLinks(MOCK_LINKS.filter(l => l.isActive).sort((a, b) => a.order - b.order));
      setError(null);
      
      // 방문자 로그 기록 - 방문하는 페이지 사용자의 정보가 아닌 현재 로그인한 사용자 정보로 기록
      console.log('퍼블릭 프로필 방문 로그 기록 (로그인 사용자 기준)');
      VisitorTracker.logVisit(`/profile/${username}`, undefined, false);
    } else {
      setError('User not found.');
    }
    setLoading(false);
  }, [username]);

  // 링크 클릭 핸들러
  const handleLinkClick = (link: Link) => {
    // 링크 클릭 로그 기록 - 현재 로그인한 사용자 정보로 기록
    console.log('링크 클릭 로그 기록 (로그인 사용자 기준):', { link });
    VisitorTracker.logLinkClick(link.id, link.title, link.url);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error || !user) {
    return <div>{error}</div>;
  }

  return (
    <div>
      <PublicProfileContent 
        user={user} 
        links={links} 
        onLinkClick={handleLinkClick}
      />
    </div>
  );
};

export default PublicProfilePage;
