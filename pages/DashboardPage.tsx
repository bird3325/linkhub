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
import { LinkService } from '../utils/linkService';

const DashboardPage: React.FC = () => {
  const [profileLoading, setProfileLoading] = useState(false);
  const [linksLoading, setLinksLoading] = useState(true);
  const { links, setLinks } = useContext(LinkContext);
  const { user: authUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const dragItem = React.useRef<number | null>(null);
  const dragOverItem = React.useRef<number | null>(null);

  // 기본값이 포함된 사용자 정보 생성
  const getDisplayUser = (): User => {
    if (!authUser) return MOCK_USER;
    
    return {
      id: authUser.id,
      email: authUser.email,
      name: authUser.name,
      phone: authUser.phone || '',
      displayName: authUser.displayName || authUser.name || '사용자',
      username: authUser.username || authUser.email?.split('@')[0] || 'username',
      bio: authUser.bio || '안녕하세요! 저의 링크들을 확인해보세요.',
      avatar: authUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(authUser.displayName || authUser.name || '사용자')}&background=4F46E5&color=fff&size=200`,
      template: (authUser.template as TemplateID) || TemplateID.Glass,
      signupDate: authUser.signupDate
    };
  };

  const user = getDisplayUser();

  // 새 링크 추가 버튼 핸들러
  const handleAddNewLink = () => {
    console.log('새 링크 추가 버튼 클릭됨');
    console.log('현재 경로로 이동:', '/link/new');
    navigate('/link/new');
  };

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
        setLinksLoading(false);
        return;
      }

      try {
        // 사용자 ID와 이메일 모두 전달
        const googleLinks = await LinkService.getLinks(authUser.id, authUser.email);
        if (googleLinks && googleLinks.length > 0) {
          setLinks(googleLinks);
        } else {
          console.log('구글 시트에 링크가 없음, 기본 링크 사용');
        }
      } catch (error) {
        console.warn('링크 로드 실패:', error);
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

  const handleTemplateChange = (templateId: TemplateID) => {
    // 템플릿 변경 시 AuthContext의 setUser를 통해 업데이트해야 함
    // 여기서는 일시적으로 로컬 상태만 업데이트
    console.log('템플릿 변경:', templateId);
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
                      <div>
                        <h4 className="font-medium text-gray-900">{link.title}</h4>
                        <p className="text-sm text-gray-500">{link.url}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <button 
                        onClick={() => navigate(`/link/edit/${link.id}`)} 
                        className="text-gray-500 hover:text-[#4F46E5]"
                      >
                        <EditIcon className="w-5 h-5" />
                      </button>
                      <Toggle 
                        checked={link.isActive}
                        onChange={(checked) => handleToggleActive(link.id, checked)}
                        labelId={`toggle-link-visibility-${link.id}`}
                      />
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
                    checked={user.template === template.id}
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
            </div>
            
            {profileLoading ? (
              <div className="p-6 text-center">
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
                      <span className="text-sm text-gray-600">{`linkhub.dev/${user.username}`}</span>
                    </div>
                    {/* Spacer for balance */}
                    <div className="w-16"></div>
                  </div>
                  
                  {/* Content Area */}
                  <div className="bg-white" style={{ minHeight: '400px', maxHeight: '600px', overflow: 'auto' }}>
                    <PublicProfileContent 
                      user={user} 
                      links={links.filter(l => l.isActive)} 
                      isPreview={true}
                    />
                  </div>
                </div>
                
                <div className="mt-6 text-center">
                  <a
                    href={`/#/profile/${user.username}`}
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
