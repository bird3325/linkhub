import React, { useState, useEffect, useContext, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LinkContext } from '../contexts/LinkContext';
import { AuthContext } from '../contexts/AuthContext';
import type { Link } from '../types';
import { LinkStyle } from '../types';
import { PlusIcon } from '../components/icons/Icons';
import Toggle from '../components/Toggle';
import { LinkService } from '../utils/linkService';

// ✅ 개선된 카테고리 선택/추가 컴포넌트 (기존 카테고리 선택 가능)
const CategorySelector: React.FC<{
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  existingCategories: string[];
  disabled?: boolean;
}> = ({ selectedCategory, onCategoryChange, existingCategories, disabled = false }) => {
  const [isCustom, setIsCustom] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 선택된 카테고리가 기존 카테고리에 없으면 커스텀으로 설정
    if (selectedCategory && !existingCategories.includes(selectedCategory)) {
      setIsCustom(true);
      setCustomCategory(selectedCategory);
    } else {
      setIsCustom(false);
      setCustomCategory('');
    }
  }, [selectedCategory, existingCategories]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCategorySelect = (category: string) => {
    if (category === '__custom__') {
      setIsCustom(true);
      setCustomCategory('');
      onCategoryChange('');
    } else if (category === '__none__') {
      // ✅ 카테고리 없음 선택
      setIsCustom(false);
      setCustomCategory('');
      onCategoryChange('');
    } else {
      setIsCustom(false);
      setCustomCategory('');
      onCategoryChange(category);
    }
    setIsDropdownOpen(false);
  };

  const handleCustomCategoryChange = (value: string) => {
    setCustomCategory(value);
    onCategoryChange(value);
  };

  // ✅ 현재 표시할 텍스트 결정
  const getDisplayText = () => {
    if (selectedCategory) {
      return selectedCategory;
    }
    return '카테고리 선택 (선택사항)';
  };

  return (
    <div className="space-y-3">
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => !disabled && setIsDropdownOpen(!isDropdownOpen)}
          disabled={disabled}
          className="w-full text-left border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white focus:outline-none focus:ring-[#4F46E5] focus:border-[#4F46E5] sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
        >
          <div className="flex items-center justify-between">
            <span className={selectedCategory ? 'text-gray-900' : 'text-gray-500'}>
              {getDisplayText()}
            </span>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {isDropdownOpen && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            {/* ✅ 카테고리 없음 옵션 */}
            <button
              type="button"
              onClick={() => handleCategorySelect('__none__')}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm text-gray-700 flex items-center justify-between border-b border-gray-100"
            >
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="italic">카테고리 없음</span>
              </div>
              {!selectedCategory && (
                <svg className="w-4 h-4 text-[#4F46E5]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>

            {/* ✅ 기존 카테고리 목록 */}
            {existingCategories.length > 0 && (
              <div>
                <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50">
                  기존 카테고리 ({existingCategories.length}개)
                </div>
                {existingCategories.map((category, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleCategorySelect(category)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm text-gray-900 flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <span>{category}</span>
                    </div>
                    {selectedCategory === category && (
                      <svg className="w-4 h-4 text-[#4F46E5]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
                <hr className="border-gray-200" />
              </div>
            )}
            
            {/* ✅ 새 카테고리 추가 옵션 */}
            <button
              type="button"
              onClick={() => handleCategorySelect('__custom__')}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm text-indigo-600 font-medium flex items-center"
            >
              <svg className="w-4 h-4 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              새 카테고리 추가
            </button>
          </div>
        )}
      </div>

      {/* ✅ 커스텀 카테고리 입력 필드 */}
      {isCustom && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <label className="block text-sm font-medium text-blue-800 mb-2">
            새 카테고리 이름
          </label>
          <input
            type="text"
            value={customCategory}
            onChange={(e) => handleCustomCategoryChange(e.target.value)}
            placeholder="예: 업무, 쇼핑, 취미 등..."
            className="block w-full border border-blue-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#4F46E5] focus:border-[#4F46E5] sm:text-sm"
            disabled={disabled}
            maxLength={20}
            autoFocus
          />
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-blue-600">
              최대 20자까지 입력 가능합니다 ({customCategory.length}/20)
            </p>
            {customCategory.trim().length > 0 && (
              <div className="flex items-center text-xs text-green-600">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                새 카테고리 생성
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const LinkEditorPage: React.FC = () => {
    const { linkId } = useParams<{ linkId: string }>();
    const navigate = useNavigate();
    const { links, setLinks } = useContext(LinkContext);
    const { user } = useContext(AuthContext);
    const isNew = linkId === 'new' || !linkId;
    
    const [title, setTitle] = useState('');
    const [url, setUrl] = useState('');
    const [category, setCategory] = useState('');
    const [style, setStyle] = useState(LinkStyle.SIMPLE);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isActive, setIsActive] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const showImageUploader = style === LinkStyle.THUMBNAIL || style === LinkStyle.BACKGROUND;

    // ✅ 기존 카테고리 목록 추출 (안전한 접근 + 중복 제거)
    const existingCategories = useMemo(() => {
        if (!Array.isArray(links)) {
            console.warn('Links is not an array:', links);
            return [];
        }
        
        const categories = links
            .filter(link => {
                // ✅ 링크 객체와 카테고리 존재 확인
                return link && 
                       typeof link === 'object' && 
                       link.category && 
                       typeof link.category === 'string' && 
                       link.category.trim().length > 0;
            })
            .map(link => link.category!.trim())
            .filter((category, index, array) => array.indexOf(category) === index)
            .sort();
        
        console.log('추출된 기존 카테고리:', categories);
        return categories;
    }, [links]);

    // ✅ 링크 데이터 로드 (안전한 접근)
    useEffect(() => {
        if (!isNew && linkId && linkId !== 'new') {
            if (!Array.isArray(links)) {
                console.warn('Links is not an array, navigating to dashboard');
                navigate('/dashboard');
                return;
            }

            const linkToEdit = links.find(l => l && l.id === linkId);
            if (linkToEdit) {
                console.log('편집할 링크 데이터:', linkToEdit);
                
                setTitle(linkToEdit.title || '');
                setUrl(linkToEdit.url || '');
                setCategory(linkToEdit.category || ''); // ✅ 안전한 카테고리 접근
                setStyle(linkToEdit.style || LinkStyle.SIMPLE);
                setImageUrl(linkToEdit.imageUrl || null);
                setIsActive(linkToEdit.isActive !== undefined ? linkToEdit.isActive : true);
            } else {
                console.warn('링크를 찾을 수 없음:', linkId);
                navigate('/dashboard');
            }
        }
    }, [linkId, links, isNew, navigate]);

    // 이미지 압축 함수 (기존과 동일)
    const compressImage = (file: File, maxWidth = 400, maxHeight = 400, quality = 0.7): Promise<string> => {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
            let { width, height } = img;
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            
            if (ratio < 1) {
                width = width * ratio;
                height = height * ratio;
            }

            canvas.width = width;
            canvas.height = height;
            ctx?.drawImage(img, 0, 0, width, height);
            
            // ✅ 더 높은 압축률 적용
            const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
            resolve(compressedDataUrl);
            };

            img.onerror = () => reject(new Error('이미지 로드 실패'));
            const reader = new FileReader();
            reader.onload = (e) => { img.src = e.target?.result as string; };
            reader.readAsDataURL(file);
        });
        };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const maxFileSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxFileSize) {
            setError('이미지 파일 크기는 10MB 이하여야 합니다.');
            return;
        }

        const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!supportedTypes.includes(file.type)) {
            setError('지원되는 이미지 형식: JPG, PNG, GIF, WebP');
            return;
        }

        try {
            setError('');
            setLoading(true);
            
            const compressedImage = await compressImage(file, 600, 600, 0.8);
            const sizeInMB = (compressedImage.length * 3) / 4 / (1024 * 1024);
            
            if (sizeInMB > 1.5) {
                const moreCompressed = await compressImage(file, 400, 400, 0.6);
                const newSizeInMB = (moreCompressed.length * 3) / 4 / (1024 * 1024);
                
                if (newSizeInMB > 1.5) {
                    setError('이미지가 너무 큽니다. 더 작은 이미지를 선택해주세요.');
                    return;
                }
                setImageUrl(moreCompressed);
            } else {
                setImageUrl(compressedImage);
            }
            
        } catch (error: any) {
            console.error('이미지 처리 오류:', error);
            setError('이미지 처리 중 오류가 발생했습니다: ' + error.message);
        } finally {
            setLoading(false);
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
                // ✅ 새 링크 저장 (카테고리 안전하게 처리)
                const linkData = {
                    userId: user.id,
                    userEmail: user.email,
                    title: title.trim(),
                    url: finalUrl,
                    category: category.trim() || undefined, // ✅ 빈 문자열이면 undefined
                    imageUrl: showImageUploader ? (imageUrl || '') : '',
                    style,
                    isActive
                };

                console.log('새 링크 저장 시도:', {
                    ...linkData,
                    imageUrl: linkData.imageUrl ? `[이미지 데이터 ${Math.round(linkData.imageUrl.length / 1024)}KB]` : '없음',
                    category: linkData.category || '카테고리 없음'
                });

                const result = await LinkService.saveLink(linkData);
                if (result.success) {
                    const actualUserId = result.actualUserId || user.id;
                    
                    // ✅ 새 링크 객체 (안전하게 생성)
                    const newLink: Link = {
                        id: result.linkId,
                        userId: actualUserId,
                        title: title.trim(),
                        url: finalUrl,
                        category: category.trim() || undefined, // ✅ 안전한 카테고리 설정
                        style,
                        imageUrl: showImageUploader ? (imageUrl || undefined) : undefined,
                        isActive,
                        order: (Array.isArray(links) ? links.length : 0) + 1,
                        clickCount: 0,
                    };

                    console.log('새 링크 로컬 상태에 추가:', newLink);
                    
                    // ✅ 안전한 링크 배열 업데이트
                    const currentLinks = Array.isArray(links) ? links : [];
                    setLinks([...currentLinks, newLink]);
                    navigate('/dashboard');
                } else {
                    setError(result.message || '링크 저장에 실패했습니다.');
                }
            } else {
                // ✅ 기존 링크 업데이트 (카테고리 안전하게 처리)
                const updateData = {
                    title: title.trim(),
                    url: finalUrl,
                    category: category.trim() || undefined, // ✅ 빈 문자열이면 undefined
                    imageUrl: showImageUploader ? (imageUrl || '') : '',
                    style,
                    isActive
                };

                console.log('링크 업데이트 시도:', {
                    linkId,
                    ...updateData,
                    imageUrl: updateData.imageUrl ? `[이미지 데이터 ${Math.round(updateData.imageUrl.length / 1024)}KB]` : '없음',
                    category: updateData.category || '카테고리 없음'
                });

                const result = await LinkService.updateLink(linkId!, updateData);
                if (result.success) {
                    // ✅ 안전한 링크 배열 업데이트
                    if (Array.isArray(links)) {
                        const updatedLinks = links.map(l => {
                            if (l && l.id === linkId) {
                                return {
                                    ...l,
                                    title: title.trim(),
                                    url: finalUrl,
                                    category: category.trim() || undefined, // ✅ 안전한 카테고리 설정
                                    style,
                                    imageUrl: showImageUploader ? (imageUrl || undefined) : undefined,
                                    isActive,
                                };
                            }
                            return l;
                        });
                        setLinks(updatedLinks);
                    }
                    navigate('/dashboard');
                } else {
                    setError(result.message || '링크 업데이트에 실패했습니다.');
                }
            }
        } catch (error: any) {
            console.error('링크 저장 오류:', error);
            if (error.message.includes('Failed to fetch')) {
                setError('네트워크 오류가 발생했습니다. 이미지 크기를 줄여서 다시 시도해주세요.');
            } else {
                setError(error.message || '링크 저장 중 오류가 발생했습니다.');
            }
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
                                <div className="flex items-center">
                                    <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    <p className="text-red-600 text-sm">{error}</p>
                                </div>
                            </div>
                        )}

                        {/* 스타일 선택 */}
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

                        {/* 기본 정보 입력 */}
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

                            {/* ✅ 개선된 카테고리 선택/추가 */}
                            <div>
                                <label className="text-base font-bold text-gray-800 flex items-center">
                                    카테고리
                                    <span className="ml-2 text-sm font-normal text-gray-500">(선택사항)</span>
                                </label>
                                <div className="mt-2">
                                    <CategorySelector
                                        selectedCategory={category}
                                        onCategoryChange={setCategory}
                                        existingCategories={existingCategories}
                                        disabled={loading}
                                    />
                                </div>
                                <div className="flex items-start mt-2 p-3 bg-gray-50 rounded-md">
                                    <svg className="w-4 h-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                    <div className="text-xs text-gray-600">
                                        <p className="font-medium mb-1">카테고리 사용 팁:</p>
                                        <ul className="list-disc list-inside space-y-0.5">
                                            <li>링크를 그룹별로 관리할 수 있습니다</li>
                                            <li>기존 카테고리를 선택하거나 새로 만들 수 있습니다</li>
                                            <li>공개 페이지에서 카테고리별로 필터링됩니다</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {showImageUploader && (
                                <div>
                                    <label className="text-base font-bold text-gray-800">이미지 *</label>
                                    <div className="mt-2">
                                        <div 
                                            className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-[#4F46E5] bg-gray-50 overflow-hidden relative"
                                            onClick={() => !loading && fileInputRef.current?.click()}
                                        >
                                            {imageUrl ? (
                                                <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <PlusIcon className="w-8 h-8 text-gray-400" />
                                            )}
                                            {loading && (
                                                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                                    <div className="text-white text-xs">처리중...</div>
                                                </div>
                                            )}
                                        </div>
                                        <input 
                                            type="file" 
                                            ref={fileInputRef} 
                                            onChange={handleImageUpload} 
                                            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp" 
                                            className="hidden"
                                            disabled={loading}
                                        />
                                        <p className="text-xs text-gray-500 mt-2">파일을 선택하여 업로드해주세요</p>
                                        <p className="text-xs text-gray-400">
                                            지원 형식: JPG, PNG, GIF, WebP<br />
                                            최대 크기: 10MB (자동 압축됩니다)
                                        </p>
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

                            {/* ✅ 개선된 Preview Section */}
                            <div className="border-t pt-6">
                                <h4 className="text-base font-bold text-gray-800 mb-4">미리보기</h4>
                                
                                {/* ✅ 카테고리 표시 (개선됨) */}
                                {category && (
                                    <div className="mb-4 flex justify-center">
                                        <div className="flex items-center px-3 py-1.5 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-full">
                                            <svg className="w-3 h-3 mr-1.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                            </svg>
                                            <span className="text-indigo-800 text-sm font-medium">{category}</span>
                                        </div>
                                    </div>
                                )}
                                
                                <div className="flex justify-center">
                                    <PreviewLink />
                                </div>
                                
                                {url && (
                                    <div className="mt-4 text-center">
                                        <p className="text-xs text-gray-500 mb-1">링크 주소:</p>
                                        <p className="text-sm text-blue-600 break-all font-mono bg-blue-50 px-3 py-1 rounded-md">
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
