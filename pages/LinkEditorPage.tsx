import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LinkContext } from '../contexts/LinkContext';
import { AuthContext } from '../contexts/AuthContext';
import type { Link } from '../types';
import { LinkStyle } from '../types';
import { PlusIcon } from '../components/icons/Icons';
import Toggle from '../components/Toggle';
import { LinkService } from '../utils/linkService';

const LinkEditorPage: React.FC = () => {
    const { linkId } = useParams<{ linkId: string }>();
    const navigate = useNavigate();
    const { links, setLinks } = useContext(LinkContext);
    const { user } = useContext(AuthContext);
    const isNew = linkId === 'new' || !linkId;
    
    const [title, setTitle] = useState('');
    const [url, setUrl] = useState('');
    const [style, setStyle] = useState(LinkStyle.SIMPLE);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isActive, setIsActive] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const showImageUploader = style === LinkStyle.THUMBNAIL || style === LinkStyle.BACKGROUND;

    useEffect(() => {
        if (!isNew && linkId && linkId !== 'new') {
            const linkToEdit = links.find(l => l.id === linkId);
            if (linkToEdit) {
                setTitle(linkToEdit.title);
                setUrl(linkToEdit.url);
                setStyle(linkToEdit.style);
                setImageUrl(linkToEdit.imageUrl || null);
                setIsActive(linkToEdit.isActive);
            } else {
                navigate('/dashboard');
            }
        }
    }, [linkId, links, isNew, navigate]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImageUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        if (!title.trim()) {
            setError('제목을 입력해주세요.');
            return;
        }

        if (!url.trim()) {
            setError('URL을 입력해주세요.');
            return;
        }

        // URL 유효성 검사
        try {
            const urlObject = new URL(url.startsWith('http') ? url : `https://${url}`);
            if (!urlObject.protocol.startsWith('http')) {
                throw new Error('Invalid URL');
            }
        } catch {
            setError('올바른 URL을 입력해주세요.');
            return;
        }

        if (showImageUploader && !imageUrl) {
            setError('선택한 스타일에는 이미지가 필요합니다.');
            return;
        }

        if (!user?.id) {
            setError('사용자 정보를 찾을 수 없습니다.');
            return;
        }

        setError('');
        setLoading(true);

        try {
            const finalUrl = url.startsWith('http') ? url : `https://${url}`;
            
            if (isNew) {
                // 새 링크 저장
                const linkData = {
                    userId: user.id,
                    userEmail: user.email, // 추가: 사용자 이메일 전달
                    title: title.trim(),
                    url: finalUrl,
                    imageUrl: showImageUploader ? (imageUrl || '') : '',
                    style,
                    isActive
                };

                console.log('새 링크 저장 시도:', linkData);

                const result = await LinkService.saveLink(linkData);

                if (result.success) {
                    // 서버에서 반환된 실제 사용자 ID 사용
                    const actualUserId = result.actualUserId || user.id;
                    
                    // 새로운 링크 객체 생성
                    const newLink: Link = {
                        id: result.linkId,
                        userId: actualUserId, // 실제 사용자 ID 사용
                        title: title.trim(),
                        url: finalUrl,
                        style,
                        imageUrl: showImageUploader ? (imageUrl || undefined) : undefined,
                        isActive,
                        order: links.length + 1,
                        clickCount: 0,
                    };

                    console.log('새 링크 로컬 상태에 추가:', newLink);
                    setLinks([...links, newLink]);
                    
                    // 성공 후 대시보드로 이동
                    navigate('/dashboard');
                } else {
                    setError(result.message || '링크 저장에 실패했습니다.');
                }
            } else {
                // 기존 링크 업데이트
                const updateData = {
                    title: title.trim(),
                    url: finalUrl,
                    imageUrl: showImageUploader ? (imageUrl || '') : '',
                    style,
                    isActive
                };

                const result = await LinkService.updateLink(linkId!, updateData);

                if (result.success) {
                    const updatedLinks = links.map(l => l.id === linkId ? {
                        ...l,
                        title: title.trim(),
                        url: finalUrl,
                        style,
                        imageUrl: showImageUploader ? (imageUrl || undefined) : undefined,
                        isActive,
                    } : l);

                    setLinks(updatedLinks);
                    navigate('/dashboard');
                } else {
                    setError(result.message || '링크 업데이트에 실패했습니다.');
                }
            }
        } catch (error: any) {
            console.error('링크 저장 오류:', error);
            setError(error.message || '링크 저장 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const styleOptions = [
        { id: LinkStyle.SIMPLE, name: '심플' },
        { id: LinkStyle.THUMBNAIL, name: '썸네일' },
        { id: LinkStyle.CARD, name: '카드' },
        { id: LinkStyle.BACKGROUND, name: '배경' },
    ];

    const stylePreviews: { [key in LinkStyle]: React.ReactNode } = {
        [LinkStyle.THUMBNAIL]: <div className="w-full h-12 bg-gray-200 rounded flex items-center px-3"><div className="w-8 h-8 bg-gray-400 rounded mr-2"></div><span className="text-xs">썸네일</span></div>,
        [LinkStyle.SIMPLE]: <div className="w-full h-12 bg-blue-100 rounded flex items-center justify-center"><span className="text-xs">심플</span></div>,
        [LinkStyle.CARD]: <div className="w-full h-12 bg-white border-2 rounded flex items-center justify-center"><span className="text-xs">카드</span></div>,
        [LinkStyle.BACKGROUND]: <div className="w-full h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded flex items-center justify-center text-white"><span className="text-xs">배경</span></div>,
    };

    const PreviewLink = () => {
        const baseClasses = `w-full max-w-xs p-3 rounded-lg flex items-center shadow-md font-semibold text-center transition-all duration-300`;
        const displayTitle = title.trim() || '링크 제목';

        switch(style) {
            case LinkStyle.THUMBNAIL:
                return (
                    <div className={`${baseClasses} bg-white border justify-start`}>
                        {imageUrl ? (
                            <img src={imageUrl} alt={displayTitle} className="w-10 h-10 rounded-md object-cover flex-shrink-0" />
                        ) : (
                            <div className="w-10 h-10 rounded-md bg-gray-300 flex-shrink-0"></div>
                        )}
                        <span className="flex-grow px-4">{displayTitle}</span>
                    </div>
                );
            
            case LinkStyle.CARD:
                return (
                    <div className={`${baseClasses} bg-white border-2 text-gray-800 justify-center`}>
                        <span>{displayTitle}</span>
                    </div>
                );
            
            case LinkStyle.BACKGROUND:
                return (
                    <div 
                        className={`${baseClasses} h-20 text-white font-bold text-lg relative overflow-hidden justify-center`}
                        style={imageUrl ? { backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                    >
                        {!imageUrl && <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500"></div>}
                        <div className="absolute inset-0 bg-black/30"></div>
                        <span className="relative z-10">{displayTitle}</span>
                    </div>
                );
                
            case LinkStyle.SIMPLE:
            default:
                return (
                    <div className={`${baseClasses} bg-blue-500 text-white justify-center`}>
                        <span>{displayTitle}</span>
                    </div>
                );
        }
    };

    return (
        <div className="bg-gray-100 min-h-screen">
            <div className="bg-white shadow-sm sticky top-0 z-20">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <h1 className="text-xl font-bold text-gray-800">
                            {isNew ? '새 링크 추가' : '링크 수정'}
                        </h1>
                        <div>
                            <button 
                                onClick={() => navigate('/dashboard')} 
                                className="text-sm font-medium text-gray-600 hover:text-gray-900 mr-4"
                                disabled={loading}
                            >
                                취소
                            </button>
                            <button 
                                onClick={handleSave} 
                                className="bg-[#4F46E5] text-white font-semibold py-2 px-4 rounded-lg text-sm hover:bg-[#4338CA] disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={loading}
                            >
                                {loading ? '저장 중...' : '저장'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <main className="container mx-auto p-4 sm:p-6 lg:px-8 py-8">
                <div className="max-w-2xl mx-auto">
                    <div className="space-y-6">
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-md p-4">
                                <p className="text-red-600 text-sm">{error}</p>
                            </div>
                        )}

                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">스타일 *</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {styleOptions.map(opt => (
                                    <div key={opt.id} className="relative">
                                        <input
                                            type="radio"
                                            id={opt.id}
                                            name="style"
                                            value={opt.id}
                                            checked={style === opt.id}
                                            onChange={() => setStyle(opt.id)}
                                            className="sr-only"
                                            disabled={loading}
                                        />
                                        <label 
                                            htmlFor={opt.id} 
                                            className={`block p-3 border-2 rounded-lg text-center transition-all cursor-pointer ${
                                                style === opt.id 
                                                    ? 'border-indigo-500 ring-2 ring-indigo-200' 
                                                    : 'border-gray-300 hover:border-gray-400'
                                            }`}
                                        >
                                            {stylePreviews[opt.id]}
                                            <span className="block mt-2 text-sm font-medium">{opt.name}</span>
                                            {style === opt.id && (
                                                <div className="absolute top-2 right-2 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            )}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow space-y-6">
                            <div>
                                <label htmlFor="url" className="text-base font-bold text-gray-800">연결할 주소 *</label>
                                <input 
                                    id="url"
                                    type="text" 
                                    value={url} 
                                    onChange={e => setUrl(e.target.value)} 
                                    placeholder="https://example.com 또는 example.com" 
                                    className="mt-2 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#4F46E5] focus:border-[#4F46E5] sm:text-sm"
                                    disabled={loading}
                                />
                            </div>

                            <div>
                                <label htmlFor="title" className="text-base font-bold text-gray-800">타이틀 *</label>
                                <input 
                                    id="title"
                                    type="text" 
                                    value={title} 
                                    onChange={e => setTitle(e.target.value)} 
                                    placeholder="링크 제목" 
                                    className="mt-2 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#4F46E5] focus:border-[#4F46E5] sm:text-sm"
                                    disabled={loading}
                                />
                            </div>

                            {showImageUploader && (
                                <div>
                                    <label className="text-base font-bold text-gray-800">이미지 *</label>
                                    <div className="mt-2">
                                        <div 
                                            className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-[#4F46E5] bg-gray-50 overflow-hidden"
                                            onClick={() => !loading && fileInputRef.current?.click()}
                                        >
                                            {imageUrl ? (
                                                <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <PlusIcon className="w-8 h-8 text-gray-400" />
                                            )}
                                        </div>
                                        <input 
                                            type="file" 
                                            ref={fileInputRef} 
                                            onChange={handleImageUpload} 
                                            accept="image/*" 
                                            className="hidden"
                                            disabled={loading}
                                        />
                                        <p className="text-xs text-gray-500 mt-2">파일을 선택하여 업로드해주세요</p>
                                        <p className="text-xs text-gray-400">1:1 비율 이미지를 권장합니다.</p>
                                        {imageUrl && (
                                            <button 
                                                onClick={() => setImageUrl(null)} 
                                                className="text-red-500 hover:text-red-700 mt-2 font-semibold text-sm"
                                                disabled={loading}
                                            >
                                                이미지 삭제
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div>
                                <div className="flex items-center justify-between">
                                    <label className="text-base font-bold text-gray-800">링크 공개 여부</label>
                                    <div className="flex items-center">
                                        <Toggle 
                                            checked={isActive} 
                                            onChange={setIsActive}
                                            labelId="link-active-toggle"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">
                                            {isActive ? '공개' : '비공개'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Preview Section */}
                            <div className="border-t pt-6">
                                <h4 className="text-base font-bold text-gray-800 mb-4">미리보기</h4>
                                <div className="flex justify-center">
                                    <PreviewLink />
                                </div>
                                {url && (
                                    <div className="mt-4 text-center">
                                        <p className="text-xs text-gray-500">링크 주소:</p>
                                        <p className="text-sm text-blue-600 break-all">
                                            {url.startsWith('http') ? url : `https://${url}`}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default LinkEditorPage;
