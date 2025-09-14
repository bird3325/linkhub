import React, { useState, useContext, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { PlusIcon } from '../components/icons/Icons';
import { ProfileService } from '../utils/profileService';

const ProfileEditPage: React.FC = () => {
    const { user, setUser } = useContext(AuthContext);
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
            setDisplayName(user.displayName || '');
            setUsername(user.username || '');
            setBio(user.bio || '');
            setAvatar(user.avatar || null);

            // 구글 시트에서 프로필 정보 불러오기
            loadProfile();
        }
    }, [user]);

    const loadProfile = async () => {
        if (!user?.id) return;

        try {
            const result = await ProfileService.getProfile(user.id);
            if (result.success && result.profile) {
                setDisplayName(result.profile.displayName || '');
                setUsername(result.profile.username || user.username);
                setBio(result.profile.bio || '');
                setAvatar(result.profile.avatar || null);
            }
        } catch (error) {
            console.warn('프로필 불러오기 실패:', error);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatar(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleSave = async () => {
        if (!user || !setUser) return;
        
        setError('');
        setLoading(true);

        try {
            // 구글 시트에 프로필 저장
            const profileData = {
                userId: user.id,
                displayName,
                username,
                bio,
                avatar: avatar || ''
            };

            const result = await ProfileService.saveProfile(profileData);

            if (result.success) {
                // 로컬 사용자 정보 업데이트
                setUser({
                    ...user,
                    displayName,
                    username,
                    bio,
                    avatar: avatar || user.avatar,
                });

                alert('프로필이 성공적으로 업데이트되었습니다.');
                navigate('/dashboard');
            } else {
                setError(result.message || '프로필 저장에 실패했습니다.');
            }
        } catch (error: any) {
            console.error('프로필 저장 오류:', error);
            setError(error.message || '프로필 저장 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return <div>사용자 정보를 불러오는 중입니다...</div>;
    }

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
                            <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-[#4F46E5] bg-gray-50 overflow-hidden" onClick={() => fileInputRef.current?.click()}>
                                {avatar ? <img src={avatar} alt="avatar" className="w-full h-full object-cover" /> : <PlusIcon className="w-8 h-8 text-gray-400"/>}
                            </div>
                            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" disabled={loading}/>
                             <div className="text-sm text-gray-500">
                                <p>프로필 사진을 업로드해주세요</p>
                                <p className="text-xs text-gray-400 mt-1">사용자 페이지에 표시될 사진입니다.</p>
                                {avatar && <button onClick={() => setAvatar(null)} className="text-red-500 hover:text-red-700 mt-2 font-semibold" disabled={loading}>이미지 삭제</button>}
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
                                placeholder="표시될 이름을 입력하세요" 
                                className="mt-2 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#4F46E5] focus:border-[#4F46E5] sm:text-sm"
                                disabled={loading}
                            />
                        </div>
                        <div>
                            <label htmlFor="username" className="text-base font-bold text-gray-800">사용자 이름 (URL)</label>
                            <div className="mt-2 flex rounded-md shadow-sm">
                                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                                    linkhub.dev/
                                </span>
                                <input 
                                    id="username" 
                                    type="text" 
                                    value={username} 
                                    onChange={e => setUsername(e.target.value)} 
                                    placeholder="username" 
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
                                placeholder="자신을 소개해보세요" 
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
