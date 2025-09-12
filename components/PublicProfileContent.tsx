import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { User, Link } from '../types';
import { TemplateID, LinkStyle } from '../types';
import { GridViewIcon, ListViewIcon, ChevronDownIcon } from './icons/Icons';

interface PublicProfileContentProps {
    user: User;
    links: Link[];
    isPreview?: boolean;
    onLinkClick?: (link: Link) => void; // 링크 클릭 추적을 위한 콜백 추가
}

const LinkBlock: React.FC<{ 
    link: Link, 
    styles: any, 
    isPreview: boolean, 
    onClick: (e: React.MouseEvent, link: Link) => void, 
    layout: 'list' | 'grid' 
}> = ({ link, styles, isPreview, onClick, layout }) => {
    
    const baseClasses = `block w-full font-semibold rounded-lg transition-transform transform flex items-center justify-center text-center ${!isPreview ? 'hover:scale-105' : ''} ${!link.isActive && isPreview ? 'opacity-50' : ''}`;

    if (layout === 'grid' && isPreview) {
        return (
             <a 
                href={link.url} 
                onClick={(e) => onClick(e, link)} 
                className={`${baseClasses} ${styles.linkBg} ${styles.linkText} ${styles.linkBorder} aspect-square flex-col text-xs p-1`}
             >
                 {link.imageUrl ? (
                    <img src={link.imageUrl} alt={link.title} className="w-8 h-8 rounded-md object-cover mb-1" />
                 ) : (
                    <div className={`w-8 h-8 rounded-md mb-1 flex items-center justify-center text-lg ${styles.linkBg}`}>
                        {link.title.charAt(0)}
                    </div>
                 )}
                 <span className="truncate max-w-full px-1">{link.title}</span>
            </a>
        )
    }

    switch (link.style) {
        case LinkStyle.THUMBNAIL:
            return (
                <a 
                    href={link.url} 
                    onClick={(e) => onClick(e, link)} 
                    className={`${baseClasses} ${styles.linkBg} ${styles.linkText} ${styles.linkBorder} justify-start p-3`}
                >
                    {link.imageUrl ? (
                       <img src={link.imageUrl} alt={link.title} className="w-10 h-10 rounded-md object-cover flex-shrink-0" />
                    ) : (
                       <div className="w-10 h-10 rounded-md bg-gray-500/50 flex-shrink-0"></div>
                    )}
                    <span className="flex-grow px-4">{link.title}</span>
                </a>
            );
        
        case LinkStyle.CARD:
             return (
                <a 
                    href={link.url} 
                    onClick={(e) => onClick(e, link)} 
                    className={`${baseClasses} bg-white/80 backdrop-blur-sm border border-gray-200/50 text-gray-800 shadow-md p-3`}
                >
                    <span>{link.title}</span>
                </a>
            );
        
        case LinkStyle.BACKGROUND:
            return (
                 <a 
                    href={link.url} 
                    onClick={(e) => onClick(e, link)} 
                    className={`${baseClasses} h-20 bg-cover bg-center text-white font-bold text-lg relative overflow-hidden p-3`} 
                    style={link.imageUrl ? { backgroundImage: `url(${link.imageUrl})` } : {}}
                 >
                    {!link.imageUrl && <div className={`absolute inset-0 ${styles.linkBg}`}></div>}
                    <div className="absolute inset-0 bg-black/30"></div>
                    <span className="relative z-10">{link.title}</span>
                </a>
            );
            
        case LinkStyle.SIMPLE:
        default:
            return (
                <a 
                    href={link.url} 
                    onClick={(e) => onClick(e, link)} 
                    className={`${baseClasses} ${styles.linkBg} ${styles.linkText} ${styles.linkBorder} p-3`}
                >
                    <span>{link.title}</span>
                </a>
            );
    }
};

const PublicProfileContent: React.FC<PublicProfileContentProps> = ({ 
    user, 
    links, 
    isPreview = false,
    onLinkClick // 링크 클릭 콜백 추가
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
            bg: 'bg-gray-100',
            text: 'text-gray-800',
            bioText: 'text-gray-600',
            linkBg: 'bg-white hover:bg-gray-200',
            linkText: 'text-gray-800',
            linkBorder: 'border border-gray-300',
        },
        [TemplateID.Colorful]: {
            bg: 'bg-gradient-to-br from-purple-500 to-indigo-600',
            text: 'text-white',
            bioText: 'text-indigo-100',
            linkBg: 'bg-white/20 hover:bg-white/30',
            linkText: 'text-white',
            linkBorder: 'border border-transparent',
        },
        [TemplateID.Dark]: {
            bg: 'bg-gray-900',
            text: 'text-white',
            bioText: 'text-gray-400',
            linkBg: 'bg-gray-800 hover:bg-gray-700',
            linkText: 'text-white',
            linkBorder: 'border border-gray-600',
        },
        [TemplateID.Glass]: {
            bg: 'bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600',
            text: 'text-white',
            bioText: 'text-blue-100',
            linkBg: 'bg-white/20 backdrop-blur-md hover:bg-white/30 shadow-lg',
            linkText: 'text-white',
            linkBorder: 'border border-white/30',
        },
    };

    const styles = templateStyles[user.template] || templateStyles[TemplateID.Minimal];

    // 링크 클릭 핸들러 수정 - 추적 기능 추가
    const linkClickHandler = (e: React.MouseEvent, link: Link) => {
        if (isPreview) {
            e.preventDefault();
            return;
        }

        // 링크 클릭 추적 콜백 호출
        if (onLinkClick) {
            onLinkClick(link);
        }

        // 새 창에서 링크 열기
        window.open(link.url, '_blank', 'noopener,noreferrer');
        
        // 기본 링크 동작 방지 (새 창에서 열기 때문에)
        e.preventDefault();
    }

    const linkContainerClasses = isPreview && previewLayout === 'grid' ? 'grid grid-cols-3 gap-2' : 'space-y-3';

    const sortOptions = {
        default: '기본순',
        latest: '최신순',
        clicks: '클릭순',
    };

    return (
        <div className={`flex flex-col items-center p-6 md:p-8 h-full ${styles.bg}`}>
            <img 
                src={user.avatar} 
                alt={user.displayName}
                className="w-24 h-24 rounded-full border-4 border-white/50 shadow-lg" 
            />
            <h1 className={`mt-4 text-xl font-bold ${styles.text} [text-shadow:0_1px_3px_rgba(0,0,0,0.3)]`}>@{user.username}</h1>
            <p className={`mt-2 text-center text-sm w-full max-w-sm md:max-w-md ${styles.bioText} [text-shadow:0_1px_3px_rgba(0,0,0,0.2)]`}>{user.bio}</p>

            {isPreview && (
                <div className="w-full max-w-sm md:max-w-md mx-auto flex justify-between items-center my-4">
                    <div ref={sortDropdownRef} className="relative">
                        <button
                            onClick={() => setSortMenuOpen(!sortMenuOpen)}
                            className={`flex items-center space-x-1 p-1.5 rounded-md transition-colors text-xs ${styles.linkText} opacity-80 hover:opacity-100 hover:bg-black/10`}
                            aria-haspopup="true"
                            aria-expanded={sortMenuOpen}
                        >
                            <span>{sortOptions[sortOrder]}</span>
                            <ChevronDownIcon className="h-3 w-3" />
                        </button>
                        {sortMenuOpen && (
                            <div className="absolute left-0 mt-2 w-28 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                                <div className="py-1" role="menu" aria-orientation="vertical">
                                    {(Object.keys(sortOptions) as Array<keyof typeof sortOptions>).map((key) => (
                                        <button
                                            key={key}
                                            onClick={() => { setSortOrder(key); setSortMenuOpen(false); }}
                                            className={`w-full text-left block px-3 py-2 text-sm ${sortOrder === key ? 'font-semibold text-gray-900 bg-gray-100' : 'text-gray-700'} hover:bg-gray-100 hover:text-gray-900`}
                                            role="menuitem"
                                        >
                                            {sortOptions[key]}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center space-x-0.5 p-0.5 bg-black/10 rounded-md">
                        <button
                            onClick={() => setPreviewLayout('list')}
                            className={`p-1.5 rounded-sm transition-colors ${previewLayout === 'list' ? `${styles.linkBg} shadow-sm` : `opacity-60 hover:opacity-100 hover:bg-black/10`}`}
                            aria-label="List view"
                        >
                            <ListViewIcon className={`h-4 w-4 ${styles.linkText}`} />
                        </button>
                        <button
                            onClick={() => setPreviewLayout('grid')}
                            className={`p-1.5 rounded-sm transition-colors ${previewLayout === 'grid' ? `${styles.linkBg} shadow-sm` : `opacity-60 hover:opacity-100 hover:bg-black/10`}`}
                            aria-label="Grid view"
                        >
                            <GridViewIcon className={`h-4 w-4 ${styles.linkText}`} />
                        </button>
                    </div>
                </div>
            )}

            <div className={`w-full max-w-sm md:max-w-md mx-auto mt-6 ${linkContainerClasses}`}>
                {sortedLinks.filter(l => l.isActive || isPreview).map(link => (
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
        </div>
    );
};

export default PublicProfileContent;
