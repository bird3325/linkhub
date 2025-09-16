import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { TEMPLATES } from '../constants';
import type { User, Link as TLink, TemplateID } from '../types';
import { PlusIcon, DragHandleIcon, EditIcon, ExternalLinkIcon } from '../components/icons/Icons';
import PublicProfileContent from '../components/PublicProfileContent';
import { LinkContext } from '../contexts/LinkContext';
import { AuthContext } from '../contexts/AuthContext';
import Toggle from '../components/Toggle';
import { VisitorTracker } from '../utils/analytics';
import { LinkService } from '../utils/linkService';
import { ProfileService } from '../utils/profileService';

const DashboardPage: React.FC = () => {
  const [profileLoading, setProfileLoading] = useState(true);
  const [linksLoading, setLinksLoading] = useState(true);
  const [displayUser, setDisplayUser] = useState<User | null>(null);
  const [toggleLoading, setToggleLoading] = useState<{ [key: string]: boolean }>({});
  const { links, setLinks } = useContext(LinkContext);
  const { user: authUser, setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const dragItem = React.useRef<number | null>(null);
  const dragOverItem = React.useRef<number | null>(null);

  // 기본값이 포함된 사용자 정보 생성 함수
  const createDisplayUser = (authUser: any, profileData?: any): User => {
    if (!authUser) {
      return {
        id: '',
        email: '',
        name: '사용자',
        phone: '',
        displayName: '사용자',
        username: 'username',
        bio: '안녕하세요! 저의 링크들을 확인해보세요.',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent('사용자')}&background=4F46E5&color=fff&size=200`,
        template: TemplateID.Glass,
        signupDate: new Date()
      };
    }
    
    const finalDisplayName = profileData?.displayName || authUser.displayName || authUser.name || '사용자';
    const finalUsername = profileData?.username || authUser.username || authUser.email?.split('@')[0] || 'username';
    const finalBio = profileData?.bio || authUser.bio || '안녕하세요! 저의 링크들을 확인해보세요.';
    const finalAvatar = profileData?.avatar || authUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(finalDisplayName)}&background=4F46E5&color=fff&size=200`;
    
    return {
      id: authUser.id,
      email: authUser.email,
      name: authUser.name,
      phone: authUser.phone || '',
      displayName: finalDisplayName,
      username: finalUsername,
      bio: finalBio,
      avatar: finalAvatar,
      template: (authUser.template as TemplateID) || TemplateID.Glass,
      signupDate: authUser.signupDate
    };
  };

  // 새 링크 추가 버튼 핸들러
  const handleAddNewLink = () => {
    console.log('새 링크 추가 버튼 클릭됨');
    navigate('/link/new');
  };

  // 프로필 정보 로드
  useEffect(() => {
    const loadProfile = async () => {
      if (!authUser?.email) {
        console.log('로그인된 사용자가 없어 프로필 로드 건너뜀');
        setDisplayUser(createDisplayUser(authUser));
        setProfileLoading(false);
        return;
      }

      try {
        setProfileLoading(true);
        console.log('구글 시트에서 프로필 정보 로드 시작');
        
        const result = await ProfileService.getProfile(authUser.id, undefined, authUser.email);
        
        if (result.success && result.profile) {
          console.log('구글 시트에서 프로필 로드 성공:', result.profile);
          
          const updatedAuthUser = {
            ...authUser,
            displayName: result.profile.displayName || authUser.displayName || authUser.name,
            username: result.profile.username || authUser.username || authUser.email?.split('@')[0],
            bio: result.profile.bio || authUser.bio,
            avatar: result.profile.avatar || authUser.avatar
          };
          
          setUser(updatedAuthUser);
          setDisplayUser(createDisplayUser(authUser, result.profile));
        } else {
          console.log('구글 시트에 프로필이 없음, 기본값 사용');
          setDisplayUser(createDisplayUser(authUser));
        }
      } catch (error) {
        console.warn('프로필 로드 실패:', error);
        setDisplayUser(createDisplayUser(authUser));
      } finally {
        setProfileLoading(false);
      }
    };

    loadProfile();
  }, [authUser?.id, authUser?.email, setUser]);

  // 방문자 추적 로그 기록
  useEffect(() => {
    if (authUser) {
      console.log('대시보드 방문 로그 기록 (로그인 사용자):', authUser);
      VisitorTracker.logVisit('/dashboard', undefined, true);
    }
  }, [authUser]);

  // 링크 데이터 로드
  useEffect(() => {
    const loadLinks = async () => {
      if (!authUser?.id) {
        console.log('로그인된 사용자가 없어 링크 로드 건너뜀');
        setLinks([]);
        setLinksLoading(false);
        return;
      }

      try {
        setLinksLoading(true);
        console.log('구글 시트에서 링크 로드 시작');
        const googleLinks = await LinkService.getLinks(authUser.id, authUser.email);
        
        if (googleLinks && googleLinks.length > 0) {
          console.log('구글 시트에서 링크 로드 성공:', googleLinks.length, '개');
          setLinks(googleLinks);
        } else {
          console.log('구글 시트에 링크가 없음, 빈 배열 설정');
          setLinks([]);
        }
      } catch (error) {
        console.warn('링크 로드 실패:', error);
        setLinks([]);
      } finally {
        setLinksLoading(false);
      }
    };

    loadLinks();
  }, [authUser, setLinks]);

  const handleSort = async () => {
    if(dragItem.current === null || dragOverItem.current === null || !authUser?.id) return;

    let _links = [...links];
    const draggedItemContent = _links.splice(dragItem.current, 1)[0];
    _links.splice(dragOverItem.current, 0, draggedItemContent);

    dragItem.current = null;
    dragOverItem.current = null;

    const reorderedLinks = _links.map((link, index) => ({ ...link, order: index + 1 }));
    setLinks(reorderedLinks);

    try {
      const linkOrders: { [key: string]: number } = {};
      reorderedLinks.forEach((link, index) => {
        linkOrders[link.id] = index + 1;
      });
      await LinkService.updateLinkOrders(authUser.id, linkOrders, authUser.email);
      console.log('링크 순서 구글 시트에 업데이트됨');
    } catch (error) {
      console.warn('링크 순서 업데이트 실패:', error);
    }
  };

  const handleTemplateChange = async (templateId: TemplateID) => {
    if (!authUser || !setUser || !displayUser) return;

    console.log('템플릿 변경:', templateId);
    
    const updatedAuthUser = {
      ...authUser,
      template: templateId
    };
    
    setUser(updatedAuthUser);
    
    setDisplayUser({
      ...displayUser,
      template: templateId
    });
    
    try {
      console.log('템플릿 변경 완료:', templateId);
    } catch (error) {
      console.warn('템플릿 변경 저장 실패:', error);
    }
  };

  // 링크 활성/비활성 토글 (더욱 안전한 처리)
  const handleToggleActive = async (linkId: string, isActive: boolean) => {
    console.log('링크 활성 상태 변경 시작:', { linkId, isActive });

    if (!authUser?.id) {
      console.error('사용자 정보가 없습니다');
      alert('사용자 정보가 없습니다. 다시 로그인해주세요.');
      return;
    }

    // 링크 존재 확인
    const targetLink = links.find(l => l.id === linkId);
    if (!targetLink) {
      console.error('해당 링크를 찾을 수 없습니다:', linkId);
      alert('해당 링크를 찾을 수 없습니다.');
      return;
    }

    // 이미 같은 상태인 경우 처리하지 않음
    if (targetLink.isActive === isActive) {
      console.log('이미 같은 상태입니다:', isActive);
      return;
    }

    // 토글 로딩 상태 설정
    setToggleLoading(prev => ({ ...prev, [linkId]: true }));

    // 즉시 UI 업데이트 (낙관적 업데이트)
    const originalLinks = [...links];
    setLinks(links.map(link => 
      link.id === linkId ? { ...link, isActive } : link
    ));

    try {
      console.log('서버에 토글 요청 전송 중...');
      
      // 최소한의 데이터만 전송
      const result = await LinkService.updateLink(linkId, { 
        isActive: isActive 
      });
      
      if (result.success) {
        console.log('링크 활성 상태 변경 성공:', {
          linkId,
          isActive,
          title: targetLink.title
        });
        
        // 성공 알림 (선택사항)
        console.log(`${targetLink.title}이(가) ${isActive ? '공개' : '비공개'}되었습니다.`);
        
      } else {
        console.warn('서버에서 실패 응답:', result.message);
        
        // 실패 시 원래 상태로 되돌리기
        setLinks(originalLinks);
        
        alert(`링크 ${isActive ? '공개' : '비공개'} 설정에 실패했습니다.\n${result.message || '알 수 없는 오류'}`);
      }
    } catch (error: any) {
      console.error('링크 활성 상태 변경 오류:', error);
      
      // 실패 시 원래 상태로 되돌리기
      setLinks(originalLinks);
      
      let errorMessage = '링크 상태 변경 중 오류가 발생했습니다.';
      
      if (error.message.includes('네트워크')) {
        errorMessage = '네트워크 연결을 확인해주세요.';
      } else if (error.message.includes('권한')) {
        errorMessage = '권한이 없습니다. 다시 로그인해주세요.';
      } else if (error.message.includes('찾을 수 없습니다')) {
        errorMessage = '해당 링크를 찾을 수 없습니다.';
      }
      
      alert(errorMessage);
      
    } finally {
      // 토글 로딩 상태 해제
      setTimeout(() => {
        setToggleLoading(prev => {
          const newState = { ...prev };
          delete newState[linkId];
          return newState;
        });
      }, 500); // 0.5초 후 로딩 상태 해제
    }
  };

  // displayUser가 null일 때 로딩 상태 표시
  if (!displayUser) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4F46E5] mx-auto mb-4"></div>
            <p className="text-gray-600">사용자 정보를 불러오는 중...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          
          {/* Links Management Section */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">내 링크 관리</h2>
              <button
                onClick={handleAddNewLink}
                className="bg-[#4F46E5] text-white font-semibold py-2 px-4 rounded-lg text-sm hover:bg-[#4338CA] flex items-center"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                새 링크 추가
              </button>
            </div>

            {linksLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4F46E5] mx-auto mb-4"></div>
                <p className="text-gray-500">링크를 불러오는 중...</p>
              </div>
            ) : links.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">아직 추가된 링크가 없습니다.</p>
                <button
                  onClick={handleAddNewLink}
                  className="bg-[#4F46E5] text-white font-semibold py-2 px-4 rounded-lg text-sm hover:bg-[#4338CA]"
                >
                  첫 번째 링크 추가하기
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {links.map((link, index) => (
                  <div
                    key={link.id}
                    className={`flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all ${
                      !link.isActive ? 'opacity-60 bg-gray-50' : ''
                    }`}
                    draggable={!toggleLoading[link.id]}
                    onDragStart={() => !toggleLoading[link.id] && (dragItem.current = index)}
                    onDragEnter={() => !toggleLoading[link.id] && (dragOverItem.current = index)}
                    onDragEnd={handleSort}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    <div className="flex items-center space-x-4">
                      <DragHandleIcon 
                        className={`w-5 h-5 text-gray-400 ${toggleLoading[link.id] ? 'cursor-not-allowed' : 'cursor-move'}`} 
                      />
                      <div className="flex items-center space-x-3">
                        {/* 링크 스타일에 따른 썸네일 표시 */}
                        {link.imageUrl && (link.style === 'THUMBNAIL' || link.style === 'BACKGROUND') && (
                          <img 
                            src={link.imageUrl} 
                            alt={link.title}
                            className="w-10 h-10 rounded object-cover flex-shrink-0"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        )}
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-gray-900">{link.title}</h4>
                            {!link.isActive && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                비공개
                              </span>
                            )}
                            {link.isActive && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-600">
                                공개
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 truncate max-w-md">{link.url}</p>
                          <p className="text-xs text-gray-400">
                            스타일: {link.style} • 클릭: {link.clickCount || 0}회 • 순서: {link.order || index + 1}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <button 
                        onClick={() => navigate(`/link/edit/${link.id}`)} 
                        className="text-gray-500 hover:text-[#4F46E5] p-1"
                        title="링크 수정"
                        disabled={toggleLoading[link.id]}
                      >
                        <EditIcon className="w-5 h-5" />
                      </button>
                      <div className="flex items-center space-x-2">
                        <div className="relative">
                          <Toggle 
                            checked={link.isActive}
                            onChange={(checked) => handleToggleActive(link.id, checked)}
                            labelId={`toggle-link-visibility-${link.id}`}
                            disabled={toggleLoading[link.id]}
                          />
                          {/* 로딩 표시 */}
                          {toggleLoading[link.id] && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-3 h-3 border border-[#4F46E5] border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          )}
                        </div>
                        <span className={`text-xs font-medium ${
                          toggleLoading[link.id] ? 'text-gray-400' : 
                          link.isActive ? 'text-green-600' : 'text-gray-500'
                        }`}>
                          {toggleLoading[link.id] ? '변경 중...' : (link.isActive ? '공개' : '비공개')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Template Selection */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">템플릿 선택</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {TEMPLATES.map(template => (
                <label key={template.id} className="cursor-pointer">
                  <input
                    type="radio"
                    name="template"
                    value={template.id}
                    checked={displayUser.template === template.id}
                    onChange={() => handleTemplateChange(template.id as TemplateID)}
                    className="h-4 w-4 text-[#4F46E5] focus:ring-[#4F46E5] border-gray-300"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">{template.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Preview Section */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">미리보기</h2>
              <p className="text-sm text-gray-500 mt-1">
                실제 사용자들이 보게 될 페이지의 모습입니다 (공개된 링크만 표시)
              </p>
            </div>
            
            {profileLoading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4F46E5] mx-auto mb-4"></div>
                <p className="text-gray-500">프로필 정보를 불러오는 중...</p>
              </div>
            ) : (
              <div className="p-6">
                {/* Desktop-style Preview spanning full width */}
                <div className="bg-gray-100 rounded-lg overflow-hidden">
                  {/* Browser Header */}
                  <div className="bg-gray-200 px-4 py-2 flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    </div>
                    <div className="flex-1 text-center">
                      <span className="text-sm text-gray-600">{`linkhub.dev/${displayUser.username}`}</span>
                    </div>
                    {/* Spacer for balance */}
                    <div className="w-16"></div>
                  </div>
                  
                  {/* Content Area */}
                  <div className="bg-white" style={{ minHeight: '400px', maxHeight: '600px', overflow: 'auto' }}>
                    <PublicProfileContent 
                      user={displayUser} 
                      links={links.filter(l => l.isActive)} 
                      isPreview={true}
                    />
                  </div>
                </div>
                
                <div className="mt-6 text-center space-y-2">
                  <div className="text-sm text-gray-600">
                    <p>현재 표시명: <strong>{displayUser.displayName}</strong></p>
                    <p>사용자명: <strong>{displayUser.username}</strong></p>
                    <p>전체 링크: <strong>{links.length}개</strong></p>
                    <p>활성 링크: <strong className="text-green-600">{links.filter(l => l.isActive).length}개</strong></p>
                    <p>비활성 링크: <strong className="text-gray-500">{links.filter(l => !l.isActive).length}개</strong></p>
                  </div>
                  <a
                    href={`/#/profile/${displayUser.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#4F46E5] hover:bg-[#4338CA]"
                  >
                    <ExternalLinkIcon className="w-4 h-4 mr-2" />
                    내 페이지 보기
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
