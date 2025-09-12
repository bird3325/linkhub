
import type { User, Link, AnalyticsData } from './types';
import { TemplateID, LinkStyle } from './types';

export const MOCK_USER: User = {
  id: 'user-123',
  kakaoId: 'kakao-987',
  username: 'kimlink',
  displayName: '김링크',
  name: '김링크',
  phone: '010-1234-5678',
  email: 'kimlink@example.com',
  bio: '🙋‍♀️ 안녕하세요! 크리에이터 김링크입니다',
  avatar: 'https://picsum.photos/id/237/200/200',
  template: TemplateID.Glass,
};

export const MOCK_LINKS: Link[] = [
  {
    id: 'link-1',
    userId: 'user-123',
    title: '📸 인스타그램',
    url: 'https://instagram.com',
    order: 1,
    isActive: true,
    clickCount: 45,
    style: LinkStyle.THUMBNAIL,
    imageUrl: 'https://picsum.photos/id/1060/200/200',
  },
  {
    id: 'link-2',
    userId: 'user-123',
    title: '📹 유튜브 채널',
    url: 'https://youtube.com',
    order: 2,
    isActive: true,
    clickCount: 32,
    style: LinkStyle.SIMPLE,
  },
  {
    id: 'link-3',
    userId: 'user-123',
    title: '📝 네이버 블로그',
    url: 'https://blog.naver.com',
    order: 3,
    isActive: true,
    clickCount: 28,
    style: LinkStyle.SIMPLE,
  },
  {
    id: 'link-4',
    userId: 'user-123',
    title: '🛒 온라인 스토어',
    url: 'https://smartstore.naver.com',
    order: 4,
    isActive: false,
    clickCount: 19,
    style: LinkStyle.SIMPLE,
  },
];

export const MOCK_ANALYTICS: AnalyticsData = {
  totalClicks: 124,
  totalVisitors: 89,
  mobilePercentage: 92,
  linkPerformance: [
    { title: '인스타그램', clicks: 45 },
    { title: '유튜브 채널', clicks: 32 },
    { title: '네이버 블로그', clicks: 28 },
    { title: '온라인 스토어', clicks: 19 },
  ],
  weeklyClicks: [
    { day: 'Mon', clicks: 12 },
    { day: 'Tue', clicks: 19 },
    { day: 'Wed', clicks: 15 },
    { day: 'Thu', clicks: 25 },
    { day: 'Fri', clicks: 22 },
    { day: 'Sat', clicks: 30 },
    { day: 'Sun', clicks: 18 },
  ],
};

export const TEMPLATES = [
    { id: TemplateID.Minimal, name: '미니멀' },
    { id: TemplateID.Colorful, name: '컬러풀' },
    { id: TemplateID.Dark, name: '다크' },
    { id: TemplateID.Glass, name: '글래스' },
];