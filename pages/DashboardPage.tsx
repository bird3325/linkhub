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
  const [profileLoading, setProfileLoading] = useState(true); // 초기값을 true로 변경
  const [linksLoading, setLinksLoading] = useState(true);
  const [displayUser, setDisplayUser] = useState<User | null>(null); // 상태로 관리
  const { links, setLinks } = useContext(LinkContext);
  const { user: authUser, setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const dragItem = React.useRef<number | null>(null);
  const dragOverItem = React.useRef<number | null>(null);

  // 기본값이 포함된 사용자 정보 생성 함수
  const createDisplayUser = (authUser: any, profileData?: any): User => {
    if (!authUser) {
      // 로그인하지 않은 경우 기본 사용자 정보 반환
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
    
    // 프로필 데이터가 있으면 우선 사용, 없으면 authUser 데이터 사용
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
    console.log('현재 경로로 이동:', '/link/new');
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
          
          // AuthContext의 사용자 정보도 업데이트
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
        setLinks([]); // 빈 배열로 설정
        setLinksLoading(false);
        return;
      }

      try {
        setLinksLoading(true);
        console.log('구글 시트에서 링크 로드 시작');
        // 사용자 ID와 이메일 모두 전달
        const googleLinks = await LinkService.getLinks(authUser.id, authUser.email);
        
        if (googleLinks && googleLinks.length > 0) {
          console.log('구글 시트에서 링크 로드 성공:', googleLinks.length, '개');
          setLinks(googleLinks);
        } else {
          console.log('구글 시트에 링크가 없음, 빈 배열 설정');
          setLinks([]); // MOCK_LINKS 대신 빈 배열
        }
      } catch (error) {
        console.warn('링크 로드 실패:', error);
        setLinks([]); // 오류 시에도 빈 배열
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

    // 구글 시트에 순서 업데이트
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
    
    // AuthContext의 사용자 정보 업데이트
    const updatedAuthUser = {
      ...authUser,
      template: templateId
    };
    
    setUser(updatedAuthUser);
    
    // 디스플레이 사용자 정보도 업데이트
    setDisplayUser({
      ...displayUser,
      template: templateId
    });
    
    // TODO: 템플릿 변경을 구글 시트에도 저장하려면 여기에 ProfileService 호출 추가
    try {
      // 향후 템플릿 정보를 프로필에 저장하는 기능 추가 가능
      console.log('템플릿 변경 완료:', templateId);
    } catch (error) {
      console.warn('템플릿 변경 저장 실패:', error);
    }
  };

  // 링크 활성/비활성 토글
  const handleToggleActive = async (linkId: string, isActive: boolean) => {
    // 로컬 상태 먼저 업데이트
    setLinks(links.map(link => link.id === linkId ? {...link, isActive} : link));

    // 구글 시트에 업데이트
    try {
      const result = await LinkService.toggleLinkActive(linkId, isActive);
      if (result.success) {
        console.log('링크 활성 상태 구글 시트에 업데이트됨:', linkId, isActive);
      } else {
        console.warn('링크 활성 상태 업데이트 실패:', result.message);
        // 실패 시 로컬 상태 되돌리기
        setLinks(links.map(link => link.id === linkId ? {...link, isActive: !isActive} : link));
      }
    } catch (error) {
      console.warn('링크 활성 상태 업데이트 오류:', error);
      // 실패 시 로컬 상태 되돌리기
      setLinks(links.map(link => link.id === linkId ? {...link, isActive: !isActive} : link));
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
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                    draggable
                    onDragStart={() => dragItem.current = index}
                    onDragEnter={() => dragOverItem.current = index}
                    onDragEnd={handleSort}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    <div className="flex items-center space-x-4">
                      <DragHandleIcon className="w-5 h-5 text-gray-400 cursor-move" />
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
                          <h4 className="font-medium text-gray-900">{link.title}</h4>
                          <p className="text-sm text-gray-500 truncate max-w-md">{link.url}</p>
                          <p className="text-xs text-gray-400">
                            스타일: {link.style} • 클릭: {link.clickCount || 0}회
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <button 
                        onClick={() => navigate(`/link/edit/${link.id}`)} 
                        className="text-gray-500 hover:text-[#4F46E5] p-1"
                        title="링크 수정"
                      >
                        <EditIcon className="w-5 h-5" />
                      </button>
                      <div className="flex items-center space-x-2">
                        <Toggle 
                          checked={link.isActive}
                          onChange={(checked) => handleToggleActive(link.id, checked)}
                          labelId={`toggle-link-visibility-${link.id}`}
                        />
                        <span className="text-xs text-gray-500">
                          {link.isActive ? '공개' : '비공개'}
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
                실제 사용자들이 보게 될 페이지의 모습입니다
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
                    <p>활성 링크: <strong>{links.filter(l => l.isActive).length}개</strong></p>
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
