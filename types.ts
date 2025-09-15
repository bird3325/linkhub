export enum TemplateID {
  Minimal = 'minimal',
  Colorful = 'colorful',
  Dark = 'dark',
  Glass = 'glass',
}

export enum LinkStyle {
  THUMBNAIL = 'thumbnail',
  SIMPLE = 'simple',
  CARD = 'card',
  BACKGROUND = 'background',
}

export interface User {
  id: string | number; // 문자열 또는 숫자 허용
  email: string;
  name: string;
  phone?: string;
  displayName?: string;
  username?: string;
  bio?: string;
  avatar?: string;
  template?: TemplateID;
  signupDate?: Date;
  kakaoId?: string;
}

export interface Link {
  id: string;
  userId: string; // 항상 문자열로 변환하여 저장
  title: string;
  url: string;
  style: LinkStyle;
  imageUrl?: string;
  isActive: boolean;
  order: number;
  clickCount: number;
}

export interface AnalyticsData {
  totalClicks: number;
  totalVisitors: number;
  mobilePercentage: number;
  linkPerformance: { title: string; clicks: number }[];
  weeklyClicks: { day: string; clicks: number }[];
}
