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

const DashboardPage: React.FC = () => {
    const [user, setUser] = useState<User>(MOCK_USER);
    const { links, setLinks } = useContext(LinkContext);
    const { user: authUser } = useContext(AuthContext);
    const navigate = useNavigate();
    
    const dragItem = React.useRef<number | null>(null);
    const dragOverItem = React.useRef<number | null>(null);

    // 방문자 추적 로그 기록 - 로그인한 사용자 정보 기록
    useEffect(() => {
        if (authUser) {
            console.log('대시보드 방문 로그 기록 (로그인 사용자):', authUser);
            VisitorTracker.logVisit('/dashboard', undefined, true);
        }
    }, [authUser]);

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
    
    return (
        <div className="bg-gray-100 min-h-screen">
            <Header />
            <main className="container mx-auto p-4 sm:p-6 lg:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left - Link Management */}
                    <div className="lg:col-span-2 space-y-6">
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
                            <div className="flex space-x-4">
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
                                        <label htmlFor={template.id} className="ml-2 block text-sm font-medium text-gray-700">{template.name}</label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right - Preview */}
                    <div className="relative">
                        <div className="sticky top-8">
                            <div className="w-full mx-auto bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                                 {/* Mock browser header */}
                                <div className="h-10 bg-gray-100 border-b border-gray-200 flex items-center px-4 space-x-2">
                                    <div className="flex space-x-1.5">
                                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                    </div>
                                    <div className="bg-white rounded-full text-xs text-gray-500 px-4 py-1 flex-1 text-center truncate">
                                        {`linkhub.dev/${user.username}`}
                                    </div>
                                </div>
                                <div className="w-full bg-white">
                                    <PublicProfileContent user={user} links={links} isPreview={true} />
                                </div>
                            </div>
                             <a
                                href={`/#/${user.username}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-4 w-full bg-white text-gray-800 font-bold py-3 px-6 rounded-lg flex items-center justify-center space-x-2 border border-gray-300 hover:bg-gray-50 transition"
                            >
                                <span>내 페이지 보기</span>
                                <ExternalLinkIcon className="h-5 w-5 text-gray-500" />
                             </a>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default DashboardPage;
