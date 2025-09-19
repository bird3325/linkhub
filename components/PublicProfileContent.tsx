import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { User, Link } from '../types';
import { TemplateID, LinkStyle } from '../types';
import { GridViewIcon, ListViewIcon, ChevronDownIcon } from './icons/Icons';

interface PublicProfileContentProps {
  user: User;
  links: Link[];
  isPreview?: boolean;
  onLinkClick?: (link: Link) => void;
}

const LinkBlock: React.FC<{
  link: Link,
  styles: any,
  isPreview: boolean,
  onClick: (e: React.MouseEvent, link: Link) => void,
  layout: 'list' | 'grid'
}> = ({ link, styles, isPreview, onClick, layout }) => {
  const baseClasses = `block w-full font-semibold rounded-lg transition-transform transform ${!isPreview ? 'hover:scale-105' : ''} ${!link.isActive && isPreview ? 'opacity-50' : ''}`;

  if (layout === 'grid' && isPreview) {
    return (
      <button
        onClick={(e) => onClick(e, link)}
        className={`${baseClasses} ${styles.linkBg} ${styles.linkText} ${styles.linkBorder} aspect-square flex flex-col relative overflow-hidden p-0`}
      >
        {link.imageUrl ? (
          <>
            <img 
              src={link.imageUrl} 
              alt={link.title}
              className="w-full h-full object-cover absolute inset-0"
            />
            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-end p-2">
              <span className="text-white text-xs font-semibold truncate w-full text-center">
                {link.title}
              </span>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-300 text-gray-700">
            <div className="text-lg font-bold mb-1">
              {link.title.charAt(0)}
            </div>
            <span className="text-xs font-semibold truncate w-full text-center px-1">
              {link.title}
            </span>
          </div>
        )}
      </button>
    );
  }

  switch (link.style) {
    case LinkStyle.THUMBNAIL:
      return (
        <button
          onClick={(e) => onClick(e, link)}
          className={`${baseClasses} ${styles.linkBg} ${styles.linkText} ${styles.linkBorder} flex items-center justify-start text-left p-3`}
        >
          <div className="flex items-center space-x-3 w-full">
            {link.imageUrl ? (
              <img 
                src={link.imageUrl} 
                alt={link.title}
                className="w-8 h-8 rounded object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 bg-gray-300 rounded flex items-center justify-center text-sm font-bold flex-shrink-0">
                {link.title.charAt(0)}
              </div>
            )}
            <span className="flex-1 truncate text-left">{link.title}</span>
          </div>
        </button>
      );
    
    case LinkStyle.CARD:
      return (
        <button
          onClick={(e) => onClick(e, link)}
          className={`${baseClasses} bg-white/80 backdrop-blur-sm border border-gray-200/50 text-gray-800 shadow-md flex items-center justify-start text-left p-3`}
        >
          <span className="w-full text-left">{link.title}</span>
        </button>
      );
    
    case LinkStyle.BACKGROUND:
      return (
        <button
          onClick={(e) => onClick(e, link)}
          className={`${baseClasses} h-20 bg-cover bg-center text-white font-bold text-lg relative overflow-hidden flex items-center justify-start text-left p-3`}
          style={link.imageUrl ? { backgroundImage: `url(${link.imageUrl})` } : {}}
        >
          {!link.imageUrl && <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600"></div>}
          <span className="relative z-10 w-full text-left">{link.title}</span>
        </button>
      );
    
    case LinkStyle.SIMPLE:
    default:
      return (
        <button
          onClick={(e) => onClick(e, link)}
          className={`${baseClasses} ${styles.linkBg} ${styles.linkText} ${styles.linkBorder} flex items-center justify-start text-left p-3`}
        >
          <span className="w-full text-left">{link.title}</span>
        </button>
      );
  }
};

const PublicProfileContent: React.FC<PublicProfileContentProps> = ({
  user,
  links,
  isPreview = false,
  onLinkClick
}) => {
  const [previewLayout, setPreviewLayout] = useState<'list' | 'grid'>('list');
  const [sortOrder, setSortOrder] = useState<'default' | 'latest' | 'clicks'>('default');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setSortMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const sortedLinks = useMemo(() => {
    const linksCopy = [...links];
    switch (sortOrder) {
      case 'latest':
        return linksCopy.sort((a, b) => {
          const numA = parseInt(a.id.replace('link-', ''), 10);
          const numB = parseInt(b.id.replace('link-', ''), 10);
          if (isNaN(numA) || isNaN(numB)) return 0;
          return numB - numA;
        });
      case 'clicks':
        return linksCopy.sort((a, b) => b.clickCount - a.clickCount);
      case 'default':
      default:
        return linksCopy.sort((a, b) => a.order - b.order);
    }
  }, [links, sortOrder]);

  const templateStyles = {
    [TemplateID.Minimal]: {
      bg: 'bg-white',
      text: 'text-gray-800',
      bioText: 'text-gray-600',
      linkBg: 'bg-white hover:bg-gray-50 border-gray-200',
      linkText: 'text-gray-800',
      linkBorder: 'border border-gray-200',
    },
    [TemplateID.Colorful]: {
      bg: 'bg-white',
      text: 'text-gray-800',
      bioText: 'text-gray-600',
      linkBg: 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700',
      linkText: 'text-white',
      linkBorder: 'border border-transparent shadow-lg',
    },
    [TemplateID.Dark]: {
      bg: 'bg-white',
      text: 'text-gray-800',
      bioText: 'text-gray-600',
      linkBg: 'bg-gray-800 hover:bg-gray-700',
      linkText: 'text-white',
      linkBorder: 'border border-gray-300 shadow-md',
    },
    [TemplateID.Glass]: {
      bg: 'bg-white',
      text: 'text-gray-800',
      bioText: 'text-gray-600',
      linkBg: 'bg-white/90 backdrop-blur-sm hover:bg-gray-50 border-gray-200 shadow-md',
      linkText: 'text-gray-800',
      linkBorder: 'border border-gray-200',
    },
  };

  const styles = templateStyles[user.template] || templateStyles[TemplateID.Minimal];

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

  const linkContainerClasses = isPreview && previewLayout === 'grid' ? 'grid grid-cols-3 gap-2' : 'space-y-3';

  const sortOptions = {
    default: '기본순',
    latest: '최신순',
    clicks: '클릭순',
  };

  // 미리보기용 컴팩트 버전
  if (isPreview) {
    const displayLinks = sortedLinks.filter(l => l.isActive).slice(0, 3); // 최대 3개만 표시
    
    return (
      <div className={`h-full ${styles.bg} p-4 overflow-hidden relative`}>
        <div className="max-w-sm mx-auto h-full flex flex-col">
          {/* 프로필 섹션 - 축소 */}
          <div className="text-center mb-4 flex-shrink-0">
            <div className="relative inline-block mb-3">
              <img 
                src={user.avatar} 
                alt={user.displayName}
                className="w-16 h-16 rounded-full border-2 border-white shadow-md"
              />
            </div>
            
            <h1 className={`text-lg font-bold ${styles.text} mb-1`}>
              @{user.username}
            </h1>
            
            <p className={`${styles.bioText} text-xs leading-relaxed line-clamp-2`}>
              {user.bio}
            </p>
          </div>

          {/* 미리보기 컨트롤 - 축소 */}
          <div className="flex items-center justify-between mb-3 p-2 bg-gray-50 rounded-lg border flex-shrink-0 relative">
            <div className="relative" ref={sortDropdownRef}>
              <button
                onClick={() => setSortMenuOpen(!sortMenuOpen)}
                className="flex items-center space-x-1 px-2 py-1 rounded-md transition-colors text-xs text-gray-700 hover:bg-white border border-gray-200 shadow-sm"
                aria-haspopup="true"
                aria-expanded={sortMenuOpen}
              >
                <span>{sortOptions[sortOrder]}</span>
                <ChevronDownIcon className="w-3 h-3" />
              </button>
              
              {sortMenuOpen && (
                <div className="absolute top-full left-0 mt-1 w-24 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                  {(Object.keys(sortOptions) as Array<keyof typeof sortOptions>).map((key) => (
                    <button
                      key={key}
                      onClick={() => { setSortOrder(key); setSortMenuOpen(false); }}
                      className={`w-full text-left block px-2 py-1 text-xs ${sortOrder === key ? 'font-semibold text-gray-900 bg-gray-100' : 'text-gray-700'} hover:bg-gray-100 hover:text-gray-900 first:rounded-t-md last:rounded-b-md`}
                      role="menuitem"
                    >
                      {sortOptions[key]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-1 bg-white rounded-md border border-gray-200 p-0.5">
              <button
                onClick={() => setPreviewLayout('list')}
                className={`p-1 rounded-sm transition-colors ${previewLayout === 'list' ? 'bg-gray-100 shadow-sm' : 'opacity-60 hover:opacity-100 hover:bg-gray-50'}`}
                aria-label="List view"
              >
                <ListViewIcon className="w-3 h-3 text-gray-600" />
              </button>
              <button
                onClick={() => setPreviewLayout('grid')}
                className={`p-1 rounded-sm transition-colors ${previewLayout === 'grid' ? 'bg-gray-100 shadow-sm' : 'opacity-60 hover:opacity-100 hover:bg-gray-50'}`}
                aria-label="Grid view"
              >
                <GridViewIcon className="w-3 h-3 text-gray-600" />
              </button>
            </div>
          </div>

          {/* 링크 섹션 - 제한된 개수 */}
          <div className={`${linkContainerClasses} flex-1 overflow-hidden`}>
            {displayLinks.map(link => (
              <LinkBlock
                key={link.id}
                link={link}
                styles={styles}
                isPreview={isPreview}
                onClick={linkClickHandler}
                layout={previewLayout}
              />
            ))}
          </div>

          {/* 추가 링크 표시 */}
          {sortedLinks.filter(l => l.isActive).length > 3 && (
            <div className="text-center mt-2 flex-shrink-0">
              <p className="text-xs text-gray-400">
                +{sortedLinks.filter(l => l.isActive).length - 3}개 더 있음
              </p>
            </div>
          )}

          {/* 빈 상태 */}
          {displayLinks.length === 0 && (
            <div className="text-center py-6 flex-1 flex items-center justify-center">
              <div>
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <p className="text-gray-500 text-xs">공개 링크 없음</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 일반 버전 (풀 페이지)
  return (
    <div className={`min-h-screen ${styles.bg} py-8 px-4`}>
      <div className="max-w-md mx-auto">
        {/* 프로필 섹션 */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-4">
            <img 
              src={user.avatar} 
              alt={user.displayName}
              className="w-20 h-20 rounded-full border-4 border-white shadow-lg"
            />
          </div>
          
          <h1 className={`text-xl font-bold ${styles.text} mb-2`}>
            @{user.username}
          </h1>
          
          <p className={`${styles.bioText} text-sm leading-relaxed`}>
            {user.bio}
          </p>
        </div>

        {/* 링크 섹션 */}
        <div className={linkContainerClasses}>
          {sortedLinks.filter(l => l.isActive).map(link => (
            <LinkBlock
              key={link.id}
              link={link}
              styles={styles}
              isPreview={isPreview}
              onClick={linkClickHandler}
              layout={'list'}
            />
          ))}
        </div>

        {/* 빈 상태 */}
        {sortedLinks.filter(l => l.isActive).length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">아직 공개된 링크가 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicProfileContent;
