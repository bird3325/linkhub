import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { MOCK_USER, TEMPLATES } from '../constants';
import type { User, Link as TLink, TemplateID } from '../types';
import { PlusIcon, DragHandleIcon, EditIcon, ExternalLinkIcon } from '../components/icons/Icons';
import PublicProfileContent from '../components/PublicProfileContent';
import { LinkContext } from '../contexts/LinkContext';
import { AuthContext } from '../contexts/AuthContext';
import Toggle from '../components/Toggle';
import { VisitorTracker } from '../utils/analytics';

// ProfileService import 수정 - 실제 파일 위치에 맞게 조정
// import { ProfileService } from '../services/profileService';  // services 폴더에 있다면
// import { ProfileService } from '../utils/profileService';     // utils 폴더에 있다면

const DashboardPage: React.FC = () => {
    const [user, setUser] = useState<User>(MOCK_USER);
    const [profileLoading, setProfileLoading] = useState(false); // true -> false로 임시 변경
    const { links, setLinks } = useContext(LinkContext);
    const { user: authUser } = useContext(AuthContext);
    const navigate = useNavigate();
    
    const dragItem = React.useRef<number | null>(null);
    const dragOverItem = React.useRef<number | null>(null);

    // 방문자 추적 로그 기록
    useEffect(() => {
        if (authUser) {
            console.log('대시보드 방문 로그 기록 (로그인 사용자):', authUser);
            VisitorTracker.logVisit('/dashboard', undefined, true);
        }
    }, [authUser]);

    // 프로필 정보 로드 - 임시로 주석 처리
    /*
    useEffect(() => {
        const loadProfileData = async () => {
            if (!authUser?.id) {
                setProfileLoading(false);
                return;
            }
            try {
                const result = await ProfileService.getProfile(authUser.id);
                if (result.success && result.profile) {
                    setUser(prevUser => ({
                        ...prevUser,
                        displayName: result.profile.displayName || prevUser.displayName,
                        username: result.profile.username || prevUser.username,
                        bio: result.profile.bio || prevUser.bio,
                        avatar: result.profile.avatar || prevUser.avatar,
                    }));
                    console.log('프로필 정보 로드됨:', result.profile);
                } else {
                    console.log('프로필 정보가 없음, 기본값 사용');
                }
            } catch (error) {
                console.warn('프로필 정보 로드 실패:', error);
            } finally {
                setProfileLoading(false);
            }
        };
        loadProfileData();
    }, [authUser]);
    */

    const handleSort = () => {
        if(dragItem.current === null || dragOverItem.current === null) return;
        let _links = [...links];
        const draggedItemContent = _links.splice(dragItem.current, 1)[0];
        _links.splice(dragOverItem.current, 0, draggedItemContent);
        dragItem.current = null;
        dragOverItem.current = null;
        const reorderedLinks = _links.map((link, index) => ({ ...link, order: index + 1 }));
        setLinks(reorderedLinks);
    };

    const handleTemplateChange = (templateId: TemplateID) => {
        setUser(prevUser => ({...prevUser, template: templateId}));
    };
    
    const handleToggleActive = (linkId: string, isActive: boolean) => {
        setLinks(links.map(link => link.id === linkId ? {...link, isActive} : link));
    };

    // 프로필 정보 업데이트 감지 - 임시로 주석 처리
    /*
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden && authUser?.id) {
                const refreshProfile = async () => {
                    try {
                        ProfileService.clearCache(authUser.id);
                        const result = await ProfileService.getProfile(authUser.id);
                        if (result.success && result.profile) {
                            setUser(prevUser => ({
                                ...prevUser,
                                displayName: result.profile.displayName || prevUser.displayName,
                                username: result.profile.username || prevUser.username,
                                bio: result.profile.bio || prevUser.bio,
                                avatar: result.profile.avatar || prevUser.avatar,
                            }));
                            console.log('프로필 정보 새로고침됨:', result.profile);
                        }
                    } catch (error) {
                        console.warn('프로필 새로고침 실패:', error);
                    }
                };
                refreshProfile();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [authUser]);
    */
    
    return (
        <div className="bg-gray-100 min-h-screen flex flex-col">
            <Header />
            <main className="container mx-auto p-4 sm:p-6 lg:p-8 flex-1">
                <div className="flex justify-center">
                    <div className="w-full max-w-2xl">
                        <div className="space-y-6 mb-8">
                            <button
                                onClick={() => navigate('/link/new')}
                                className="w-full bg-[#4F46E5] text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center space-x-2 hover:bg-[#4338CA] transition"
                            >
                                <PlusIcon className="h-5 w-5" />
                                <span>새 링크 추가</span>
                            </button>

                            <div>
                                {links.map((link, index) => (
                                    <div
                                        key={link.id}
                                        className="flex items-center bg-white p-4 rounded-lg shadow mb-3"
                                        draggable
                                        onDragStart={() => dragItem.current = index}
                                        onDragEnter={() => dragOverItem.current = index}
                                        onDragEnd={handleSort}
                                        onDragOver={(e) => e.preventDefault()}
                                    >
                                        <div className="cursor-grab text-gray-400">
                                            <DragHandleIcon className="h-6 w-6" />
                                        </div>
                                        <div className="flex-grow mx-4">
                                            <p className="font-semibold text-gray-800">{link.title}</p>
                                            <p className="text-sm text-gray-500">{link.url}</p>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            <button onClick={() => navigate(`/link/edit/${link.id}`)} className="text-gray-500 hover:text-[#4F46E5]">
                                                <EditIcon className="h-5 w-5" />
                                            </button>
                                            <div className="flex items-center">
                                                <span id={`toggle-label-${link.id}`} className="sr-only">Toggle link visibility for {link.title}</span>
                                                <Toggle labelId={`toggle-label-${link.id}`} checked={link.isActive} onChange={(checked) => handleToggleActive(link.id, checked)} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">템플릿 선택</h3>
                                <div className="flex justify-center">
                                    <div className="flex flex-wrap justify-center gap-4">
                                        {TEMPLATES.map(template => (
                                            <div key={template.id} className="flex items-center">
                                                <input
                                                    type="radio"
                                                    id={template.id}
                                                    name="template"
                                                    value={template.id}
                                                    checked={user.template === template.id}
                                                    onChange={() => handleTemplateChange(template.id as TemplateID)}
                                                    className="h-4 w-4 text-[#4F46E5] focus:ring-[#4F46E5] border-gray-300"
                                                />
                                                <label htmlFor={template.id} className="ml-2 block text-sm font-medium text-gray-700 whitespace-nowrap">{template.name}</label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Fixed Preview Section at Bottom - Full Width */}
            <div className="bg-white border-t border-gray-200 shadow-lg">
                <div className="container mx-auto p-4 sm:p-6">
                    <div className="flex justify-center">
                        <div className="w-full max-w-2xl">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">미리보기</h3>
                            
                            {profileLoading ? (
                                <div className="flex justify-center items-center py-8">
                                    <div className="text-gray-500">프로필 정보를 불러오는 중...</div>
                                </div>
                            ) : (
                                <div className="bg-white p-6 rounded-lg shadow border">
                                    {/* Desktop-style Preview spanning full width */}
                                    <div className="w-full bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                                        {/* Browser Header */}
                                        <div className="h-12 bg-gray-100 border-b border-gray-200 flex items-center px-4 space-x-3">
                                            <div className="flex space-x-2">
                                                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                            </div>
                                            <div className="bg-white rounded-full text-sm text-gray-500 px-4 py-2 flex-1 text-center max-w-md mx-auto">
                                                {`linkhub.dev/${user.username || 'username'}`}
                                            </div>
                                            <div className="w-20"></div> {/* Spacer for balance */}
                                        </div>
                                        
                                        {/* Content Area - Fixed Height */}
                                        <div className="bg-white overflow-hidden" style={{ height: '500px' }}>
                                            <div className="h-full flex flex-col">
                                                <PublicProfileContent user={user} links={links} isPreview={true} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            <div className="flex justify-center mt-4">
                                <a
                                    href={`/#/${user.username || 'username'}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-[#4F46E5] text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center space-x-2 hover:bg-[#4338CA] transition shadow-lg"
                                >
                                    <span>내 페이지 보기</span>
                                    <ExternalLinkIcon className="h-5 w-5" />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
