import React, { useState, useContext, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { PlusIcon } from '../components/icons/Icons';
import { ProfileService } from '../utils/profileService';

const ProfileEditPage: React.FC = () => {
    const { user, setUser, refreshUserProfile } = useContext(AuthContext); // refreshUserProfile 추가
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [displayName, setDisplayName] = useState('');
    const [username, setUsername] = useState('');
    const [bio, setBio] = useState('');
    const [avatar, setAvatar] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
            // 기본값 설정
            setDisplayName(user.displayName || user.name || '');
            setUsername(user.username || user.email?.split('@')[0] || '');
            setBio(user.bio || '');
            setAvatar(user.avatar || null);

            // 구글 시트에서 프로필 정보 불러오기
            loadProfile();
        }
    }, [user]);

    const loadProfile = async () => {
        if (!user?.id || !user?.email) return;

        try {
            const result = await ProfileService.getProfile(user.id, undefined, user.email);
            if (result.success && result.profile) {
                setDisplayName(result.profile.displayName || user.name || '');
                setUsername(result.profile.username || user.email?.split('@')[0] || '');
                setBio(result.profile.bio || '');
                setAvatar(result.profile.avatar || null);
            }
        } catch (error) {
            console.warn('프로필 불러오기 실패:', error);
        }
    };

    // 이미지 압축 함수
    const compressImage = (file: File, maxWidth = 800, maxHeight = 800, quality = 0.8): Promise<string> => {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                // 원본 이미지 크기
                let { width, height } = img;

                // 최대 크기에 맞춰 비율 계산
                const ratio = Math.min(maxWidth / width, maxHeight / height);
                
                if (ratio < 1) {
                    width = width * ratio;
                    height = height * ratio;
                }

                // 캔버스 크기 설정
                canvas.width = width;
                canvas.height = height;

                // 이미지 그리기
                ctx?.drawImage(img, 0, 0, width, height);

                // base64로 변환 (JPEG, 품질 조정)
                const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                
                console.log('이미지 압축 완료:', {
                    originalSize: file.size,
                    compressedSize: compressedDataUrl.length,
                    dimensions: `${width}x${height}`,
                    compressionRatio: ((file.size - compressedDataUrl.length) / file.size * 100).toFixed(1) + '%'
                });

                resolve(compressedDataUrl);
            };

            img.onerror = () => {
                reject(new Error('이미지 로드 실패'));
            };

            // 파일을 이미지로 로드
            const reader = new FileReader();
            reader.onload = (e) => {
                img.src = e.target?.result as string;
            };
            reader.onerror = () => {
                reject(new Error('파일 읽기 실패'));
            };
            reader.readAsDataURL(file);
        });
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 파일 크기 체크 (10MB 이상은 거부)
        const maxFileSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxFileSize) {
            setError('이미지 파일 크기는 10MB 이하여야 합니다.');
            return;
        }

        // 지원되는 이미지 형식 체크
        const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!supportedTypes.includes(file.type)) {
            setError('지원되는 이미지 형식: JPG, PNG, GIF, WebP');
            return;
        }

        try {
            setError('');
            setLoading(true);
            
            // 이미지 압축
            const compressedImage = await compressImage(file);
            
            // base64 크기 체크 (2MB 이하로 제한)
            const sizeInMB = (compressedImage.length * 3) / 4 / (1024 * 1024);
            if (sizeInMB > 2) {
                // 더 강한 압축 시도
                const moreCompressed = await compressImage(file, 400, 400, 0.6);
                const newSizeInMB = (moreCompressed.length * 3) / 4 / (1024 * 1024);
                
                if (newSizeInMB > 2) {
                    setError('이미지가 너무 큽니다. 더 작은 이미지를 선택해주세요.');
                    return;
                }
                setAvatar(moreCompressed);
            } else {
                setAvatar(compressedImage);
            }
            
        } catch (error: any) {
            console.error('이미지 처리 오류:', error);
            setError('이미지 처리 중 오류가 발생했습니다: ' + error.message);
        } finally {
            setLoading(false);
        }
    };
    
    const handleSave = async () => {
        if (!user || !setUser) return;
        
        // 이메일이 없으면 저장할 수 없음
        if (!user.email) {
            setError('사용자 이메일 정보가 필요합니다. 다시 로그인해주세요.');
            return;
        }
        
        setError('');
        setLoading(true);

        try {
            // 구글 시트에 프로필 저장 - userEmail을 필수로 전달
            const profileData = {
                userId: user.id || null,
                userEmail: user.email, // 필수 전달
                displayName: displayName || user.name || '',
                username: username || user.email?.split('@')[0] || '',
                bio: bio || '',
                avatar: avatar || ''
            };

            console.log('저장할 프로필 데이터:', {
                ...profileData,
                avatar: avatar ? `[이미지 데이터 ${Math.round(avatar.length / 1024)}KB]` : ''
            });

            const result = await ProfileService.saveProfile(profileData);

            if (result.success) {
                // 로컬 사용자 정보 업데이트 (실제 사용자 ID로)
                const actualUserId = result.actualUserId || user.id;
                const updatedUser = {
                    ...user,
                    id: actualUserId, // 실제 사용자 ID로 업데이트
                    displayName: displayName || user.name || '',
                    username: username || user.email?.split('@')[0] || '',
                    bio: bio || '',
                    avatar: avatar || user.avatar,
                };

                setUser(updatedUser);
                
                // 헤더와 다른 컴포넌트들이 최신 프로필 정보를 반영하도록 새로고침
                if (refreshUserProfile) {
                    await refreshUserProfile();
                }

                alert('프로필이 성공적으로 업데이트되었습니다.');
                navigate('/dashboard');
            } else {
                setError(result.message || '프로필 저장에 실패했습니다.');
            }
        } catch (error: any) {
            console.error('프로필 저장 오류:', error);
            if (error.message.includes('Failed to fetch')) {
                setError('네트워크 오류가 발생했습니다. 이미지 크기를 줄여서 다시 시도해주세요.');
            } else {
                setError(error.message || '프로필 저장 중 오류가 발생했습니다.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return <div>사용자 정보를 불러오는 중입니다...</div>;
    }

    // 기본 아바타 URL 생성
    const getDefaultAvatar = () => {
        const name = displayName || user.name || '사용자';
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4F46E5&color=fff&size=96`;
    };

    return (
         <div className="bg-gray-100 min-h-screen">
            <div className="bg-white shadow-sm sticky top-0 z-20">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <h1 className="text-xl font-bold text-gray-800">프로필 수정</h1>
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
                 <div className="max-w-3xl mx-auto space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-4">
                            <p className="text-red-600 text-sm">{error}</p>
                        </div>
                    )}

                    <div className="bg-white p-6 rounded-lg shadow">
                         <h3 className="text-lg font-bold text-gray-900 mb-4">프로필 사진</h3>
                         <div className="flex items-center space-x-4">
                            <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-[#4F46E5] bg-gray-50 overflow-hidden" onClick={() => !loading && fileInputRef.current?.click()}>
                                {avatar ? (
                                    <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <img src={getDefaultAvatar()} alt="default avatar" className="w-full h-full object-cover" />
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
                             <div className="text-sm text-gray-500">
                                <p>프로필 사진을 업로드해주세요</p>
                                <p className="text-xs text-gray-400 mt-1">
                                    지원 형식: JPG, PNG, GIF, WebP<br />
                                    최대 크기: 10MB (자동 압축됩니다)
                                </p>
                                {avatar && (
                                    <button 
                                        onClick={() => setAvatar(null)} 
                                        className="text-red-500 hover:text-red-700 mt-2 font-semibold" 
                                        disabled={loading}
                                    >
                                        이미지 삭제
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow space-y-6">
                        <div>
                            <label htmlFor="displayName" className="text-base font-bold text-gray-800">닉네임</label>
                            <input 
                                id="displayName" 
                                type="text" 
                                value={displayName} 
                                onChange={e => setDisplayName(e.target.value)} 
                                placeholder={user.name || "닉네임을 입력하세요"} 
                                className="mt-2 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#4F46E5] focus:border-[#4F46E5] sm:text-sm"
                                disabled={loading}
                            />
                        </div>
                        <div>
                            <label htmlFor="username" className="text-base font-bold text-gray-800">사용자 이름 (URL)</label>
                            <div className="mt-2 flex rounded-md shadow-sm">
                                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                                    linkitda.dev/
                                </span>
                                <input 
                                    id="username" 
                                    type="text" 
                                    value={username} 
                                    onChange={e => setUsername(e.target.value)} 
                                    placeholder={user.email?.split('@')[0] || "username"} 
                                    className="flex-1 block w-full min-w-0 rounded-none rounded-r-md border-gray-300 focus:outline-none focus:ring-[#4F46E5] focus:border-[#4F46E5] sm:text-sm px-3 py-2"
                                    disabled={loading}
                                />
                            </div>
                        </div>
                         <div>
                            <label htmlFor="bio" className="text-base font-bold text-gray-800">소개</label>
                            <textarea 
                                id="bio" 
                                value={bio} 
                                onChange={e => setBio(e.target.value)} 
                                rows={3} 
                                placeholder="안녕하세요! 저의 링크들을 확인해보세요." 
                                className="mt-2 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#4F46E5] focus:border-[#4F46E5] sm:text-sm"
                                disabled={loading}
                            />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ProfileEditPage;
