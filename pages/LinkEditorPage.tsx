import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LinkContext } from '../contexts/LinkContext';
import { AuthContext } from '../contexts/AuthContext';
import type { Link } from '../types';
import { LinkStyle } from '../types';
import { PlusIcon } from '../components/icons/Icons';
import Toggle from '../components/Toggle';

const LinkEditorPage: React.FC = () => {
    const { linkId } = useParams<{ linkId: string }>();
    const navigate = useNavigate();
    const { links, setLinks } = useContext(LinkContext);
    const { user } = useContext(AuthContext);

    const isNew = !linkId;
    const [title, setTitle] = useState('');
    const [url, setUrl] = useState('');
    const [style, setStyle] = useState<LinkStyle>(LinkStyle.THUMBNAIL);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isActive, setIsActive] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const showImageUploader = style === LinkStyle.THUMBNAIL || style === LinkStyle.BACKGROUND;

    useEffect(() => {
        if (!isNew) {
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

    const handleSave = () => {
        if (!title || !url) {
            alert('제목과 URL을 모두 입력해주세요.');
            return;
        }
        if (showImageUploader && !imageUrl) {
            alert('선택한 스타일에는 이미지가 필요합니다.');
            return;
        }


        const linkData = {
            title,
            url,
            style,
            imageUrl: showImageUploader ? (imageUrl || undefined) : undefined,
            isActive,
        };

        if (isNew) {
            const newLink: Link = {
                id: `link-${Date.now()}`,
                userId: user!.id,
                ...linkData,
                order: links.length + 1,
                clickCount: 0,
            };
            setLinks([...links, newLink]);
        } else {
            setLinks(links.map(l => l.id === linkId ? {
                ...l,
                ...linkData,
            } : l));
        }
        navigate('/dashboard');
    };
    
    const styleOptions = [
        { id: LinkStyle.THUMBNAIL, name: '썸네일' },
        { id: LinkStyle.SIMPLE, name: '심플' },
        { id: LinkStyle.CARD, name: '카드' },
        { id: LinkStyle.BACKGROUND, name: '배경' },
    ];

    const stylePreviews: { [key in LinkStyle]: React.ReactNode } = {
        [LinkStyle.THUMBNAIL]: <div className="flex items-center w-full h-full p-1 space-x-1"><div className="w-4 h-8 bg-gray-400 rounded-sm flex-shrink-0"></div><div className="w-full h-2 bg-gray-400 rounded-sm"></div></div>,
        [LinkStyle.SIMPLE]: <div className="flex items-center justify-center w-full h-full p-1"><div className="w-10/12 h-2 bg-gray-400 rounded-sm"></div></div>,
        [LinkStyle.CARD]: <div className="flex items-center justify-center w-full h-full p-1"><div className="w-11/12 h-8/12 bg-gray-500 rounded-sm flex items-center justify-center"><div className="w-8/12 h-1.5 bg-gray-200 rounded-sm"></div></div></div>,
        [LinkStyle.BACKGROUND]: <div className="flex items-center justify-center w-full h-full p-1"><div className="w-11/12 h-8/12 bg-gray-400 bg-opacity-60 rounded-sm flex items-center justify-center"><div className="w-10/12 h-4 bg-gray-600 rounded-sm"></div></div></div>,
    };

    const PreviewLink = () => {
        const baseClasses = `w-full max-w-xs p-3 rounded-lg flex items-center shadow-md font-semibold text-center transition-all duration-300`;
        switch(style) {
            case LinkStyle.THUMBNAIL:
                return <div className={`${baseClasses} bg-white justify-start`}>
                    <div className="w-12 h-12 rounded-md bg-gray-300 flex-shrink-0 mr-3">
                        {imageUrl && <img src={imageUrl} alt="preview" className="w-full h-full object-cover rounded-md"/>}
                    </div>
                    <span className="text-gray-800 flex-grow text-left">{title || '타이틀'}</span>
                </div>
            case LinkStyle.SIMPLE:
                return <div className={`${baseClasses} bg-gray-800 text-white justify-center`}><span>{title || '타이틀'}</span></div>
            case LinkStyle.CARD:
                return <div className={`${baseClasses} bg-white/80 backdrop-blur-sm text-gray-800 justify-center border`}><span>{title || '타이틀'}</span></div>
            case LinkStyle.BACKGROUND:
                return <div className={`${baseClasses} h-20 bg-cover bg-center text-white justify-center relative`} style={imageUrl ? {backgroundImage: `url(${imageUrl})`} : {backgroundColor: '#aaa'}}>
                    <div className="absolute inset-0 bg-black/30"></div>
                    <span className="relative z-10">{title || '타이틀'}</span>
                </div>
            default: return null;
        }
    }


    return (
    <div className="bg-gray-100 min-h-screen">
        <div className="bg-white shadow-sm sticky top-0 z-20">
             <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <h1 className="text-xl font-bold text-gray-800">{isNew ? '새 링크 추가' : '링크 수정'}</h1>
                    <div>
                        <button onClick={() => navigate('/dashboard')} className="text-sm font-medium text-gray-600 hover:text-gray-900 mr-4">취소</button>
                        <button onClick={handleSave} className="bg-[#4F46E5] text-white font-semibold py-2 px-4 rounded-lg text-sm hover:bg-[#4338CA]">저장</button>
                    </div>
                </div>
            </div>
        </div>

        <main className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
               {/* Left Column: Form */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow">
                        <label className="text-base font-bold text-gray-800 flex items-center">스타일 <span className="text-red-500 ml-1">*</span></label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                            {styleOptions.map(opt => (
                                <button key={opt.id} onClick={() => setStyle(opt.id)} className={`relative p-3 border-2 rounded-lg text-center transition-all ${style === opt.id ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-300 hover:border-gray-400'}`}>
                                    <div className="h-12 bg-gray-200 rounded flex items-center justify-center mb-2">{stylePreviews[opt.id]}</div>
                                    <span className="font-medium text-sm text-gray-700">{opt.name}</span>
                                    {style === opt.id && <div className="absolute -top-2 -right-2 w-5 h-5 bg-indigo-500 text-white rounded-full flex items-center justify-center text-xs shadow"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg></div>}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow space-y-6">
                        <div>
                            <label htmlFor="url" className="text-base font-bold text-gray-800">연결할 주소 <span className="text-red-500 ml-1">*</span></label>
                            <input id="url" type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." className="mt-2 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#4F46E5] focus:border-[#4F46E5] sm:text-sm"/>
                        </div>
                        <div>
                            <label htmlFor="title" className="text-base font-bold text-gray-800">타이틀 <span className="text-red-500 ml-1">*</span></label>
                            <input id="title" type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="링크 제목" className="mt-2 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#4F46E5] focus:border-[#4F46E5] sm:text-sm"/>
                        </div>
                    </div>
                    
                    {showImageUploader && (
                        <div className="bg-white p-6 rounded-lg shadow">
                            <label className="text-base font-bold text-gray-800">이미지 <span className="text-red-500 ml-1">*</span></label>
                            <div className="mt-2 flex items-center space-x-4">
                                <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-[#4F46E5] bg-gray-50" onClick={() => fileInputRef.current?.click()}>
                                    {imageUrl ? <img src={imageUrl} alt="thumbnail" className="w-full h-full object-cover rounded-lg" /> : <PlusIcon className="w-8 h-8 text-gray-400"/>}
                                </div>
                                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden"/>
                                <div className="text-sm text-gray-500">
                                    <p>파일을 선택하여 업로드해주세요</p>
                                    <p className="text-xs text-gray-400 mt-1">1:1 비율 이미지를 권장합니다.</p>
                                    {imageUrl && <button onClick={() => setImageUrl(null)} className="text-red-500 hover:text-red-700 mt-2 font-semibold">이미지 삭제</button>}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-base font-bold text-gray-800 mb-4">링크 공개 여부</h3>
                        <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                            <span id="link-publish-label" className="font-medium text-gray-700">링크 공개</span>
                            <Toggle labelId="link-publish-label" checked={isActive} onChange={setIsActive} />
                        </div>
                    </div>
                </div>

                {/* Right Column: Preview */}
                <div className="relative">
                    <div className="sticky top-24">
                         <h2 className="text-lg font-bold text-gray-800 mb-4">미리보기</h2>
                         <div className="bg-gray-200 p-8 rounded-lg flex items-center justify-center">
                            <PreviewLink />
                         </div>
                    </div>
                </div>
            </div>
        </main>
    </div>
  );
};

export default LinkEditorPage;