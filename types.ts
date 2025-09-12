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
  id: string;
  kakaoId: string;
  username: string;
  displayName: string;
  name: string;
  phone: string;
  email: string;
  bio: string;
  avatar: string;
  template: TemplateID;
}

export interface Link {
  id: string;
  userId: string;
  title: string;
  url: string;
  description?: string;
  order: number;
  isActive: boolean;
  clickCount: number;
  style: LinkStyle;
  imageUrl?: string;
}

export interface AnalyticsData {
  totalClicks: number;
  totalVisitors: number;
  mobilePercentage: number;
  linkPerformance: { title: string; clicks: number }[];
  weeklyClicks: { day: string; clicks: number }[];
}
