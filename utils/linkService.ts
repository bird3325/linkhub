import type { Link } from '../types';

// 링크 서비스
export class LinkService {
  private static scriptUrl = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL;
  private static linkCache = new Map<string, { links: Link[]; timestamp: number }>();
  private static cacheTimeout = 2 * 60 * 1000; // 2분으로 단축

  // ✅ 빠른 로깅 (운영환경에서는 비활성화)
  private static log(message: string, data?: any) {
    if (import.meta.env.DEV) {
      console.log(`[LinkService] ${message}`, data);
    }
  }

  private static error(message: string, error?: any) {
    console.error(`[LinkService] ${message}`, error);
  }

  // ✅ 캐시 관리 최적화
  private static getCacheKey(userId: string | number, userEmail?: string): string {
    return userEmail ? `e_${userEmail}` : `u_${userId}`;
  }

  private static getCachedLinks(userId: string | number, userEmail?: string): Link[] | null {
    const cacheKey = this.getCacheKey(userId, userEmail);
    const cached = this.linkCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      this.log('캐시 사용', { count: cached.links.length });
      return cached.links;
    }
    return null;
  }

  private static setCachedLinks(userId: string | number, links: Link[], userEmail?: string) {
    const cacheKey = this.getCacheKey(userId, userEmail);
    this.linkCache.set(cacheKey, { links, timestamp: Date.now() });
  }

  private static invalidateCache() {
    this.linkCache.clear();
  }

  // ✅ 초고속 링크 저장 (압축 및 최적화 + 카테고리)
  static async saveLink(linkData: {
    userId: string | number;
    userEmail?: string;
    title: string;
    url: string;
    category?: string; // 🆕 카테고리 필드 추가
    description?: string;
    imageUrl?: string;
    style?: string;
    isActive?: boolean;
  }) {
    const startTime = performance.now();
    this.log('saveLink 호출됨', linkData);
    
    if (!this.scriptUrl) {
      const error = '앱스 스크립트 URL이 설정되지 않았습니다.';
      this.error(error);
      throw new Error(error);
    }

    // ✅ 빠른 검증
    const userIdStr = linkData.userId ? String(linkData.userId).trim() : '';
    const userEmailStr = linkData.userEmail ? String(linkData.userEmail).trim() : '';
    
    if (!userIdStr && !userEmailStr) {
      throw new Error('사용자 ID 또는 이메일이 필요합니다.');
    }

    if (!linkData.title?.trim()) {
      throw new Error('제목이 필요합니다.');
    }

    if (!linkData.url?.trim()) {
      throw new Error('URL이 필요합니다.');
    }

    // ✅ 이미지 사전 압축 (클라이언트에서)
    let processedImageUrl = linkData.imageUrl?.trim() || '';
    if (processedImageUrl) {
      const sizeInMB = processedImageUrl.length * 0.75 / (1024 * 1024);
      if (sizeInMB > 1.0) {
        this.log('이미지 크기 경고', `${sizeInMB.toFixed(2)}MB`);
        // 클라이언트에서 이미 압축되었다고 가정하고 진행
      }
    }

    try {
      // ✅ 카테고리 필드 포함한 요청 데이터
      const requestData = {
        action: 'save_link',
        userId: userIdStr,
        userEmail: userEmailStr,
        title: linkData.title.trim(),
        url: linkData.url.trim(),
        category: linkData.category?.trim() || '', // 🆕 카테고리 필드 추가
        description: linkData.description?.trim() || '',
        imageUrl: processedImageUrl,
        style: linkData.style || 'SIMPLE',
        isActive: linkData.isActive !== false
      };

      this.log('전송할 데이터 (카테고리 포함):', {
        ...requestData,
        imageUrl: requestData.imageUrl ? `[이미지 데이터 ${Math.round(requestData.imageUrl.length / 1024)}KB]` : '없음',
        category: requestData.category || '카테고리 없음' // 🔍 카테고리 확인
      });

      // ✅ fetch 옵션 최적화
      const response = await fetch(this.scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(requestData),
        mode: 'cors',
        cache: 'no-cache' // 캐시 비활성화로 속도 향상
      });

      this.log('응답 상태', { 
        status: response.status, 
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.error('HTTP 오류', { status: response.status, text: errorText });
        throw new Error(`서버 오류 (${response.status}): ${errorText || response.statusText}`);
      }

      const responseText = await response.text();
      this.log('응답 텍스트', responseText);

      if (!responseText) {
        throw new Error('서버에서 빈 응답을 받았습니다.');
      }

      let result;
      try {
        result = JSON.parse(responseText);
        this.log('파싱된 응답', result);
      } catch (parseError) {
        this.error('JSON 파싱 오류', { responseText, parseError });
        throw new Error('서버 응답을 파싱할 수 없습니다: ' + responseText);
      }

      if (result.success) {
        this.invalidateCache(); // 캐시 무효화
        
        const duration = performance.now() - startTime;
        this.log('링크 저장 완료', `${duration.toFixed(2)}ms`);
      }

      return result;

    } catch (error: any) {
      const duration = performance.now() - startTime;
      this.error('링크 저장 실패', `${duration.toFixed(2)}ms - ${error.message}`);
      
      if (error.message.includes('Failed to fetch')) {
        throw new Error('네트워크 오류입니다. 연결을 확인해주세요.');
      }
      throw error;
    }
  }

  // ✅ 캐시 우선 링크 조회 (카테고리 포함)
  static async getLinks(userId: string | number, userEmail?: string): Promise<Link[]> {
    this.log('getLinks 호출됨', { userId, userEmail });

    if (!this.scriptUrl) {
      throw new Error('앱스 스크립트 URL이 설정되지 않았습니다.');
    }

    // ✅ 캐시 먼저 확인
    const cachedLinks = this.getCachedLinks(userId, userEmail);
    if (cachedLinks) {
      return cachedLinks;
    }

    const startTime = performance.now();

    // 안전한 문자열 변환
    const userIdStr = userId ? String(userId).trim() : '';
    const userEmailStr = userEmail ? String(userEmail).trim() : '';

    if (!userIdStr && !userEmailStr) {
      throw new Error('사용자 ID 또는 이메일이 필요합니다.');
    }

    try {
      const requestData = {
        action: 'get_links',
        userId: userIdStr,
        userEmail: userEmailStr
      };

      this.log('링크 조회 요청 데이터', requestData);

      const response = await fetch(this.scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(requestData),
        mode: 'cors',
        cache: 'force-cache' // 조회는 캐시 활용
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`서버 오류 (${response.status}): ${errorText || response.statusText}`);
      }

      const responseText = await response.text();
      this.log('링크 조회 응답 텍스트', responseText);

      if (!responseText) {
        throw new Error('서버에서 빈 응답을 받았습니다.');
      }

      const result = JSON.parse(responseText);
      this.log('파싱된 링크 조회 응답', result);
      
      if (result.success) {
        // ✅ 구글 시트 데이터를 React Link 타입으로 변환 (카테고리 필드 포함)
        const convertedLinks: Link[] = (result.links || []).map((link: any) => ({
          id: link.id,
          userId: String(link.userId), // 문자열로 변환
          title: link.title,
          url: link.url,
          category: link.category || undefined, // 🆕 카테고리 필드 추가
          description: link.description || undefined,
          style: link.style,
          imageUrl: link.imageUrl || undefined,
          isActive: Boolean(link.isActive),
          order: Number(link.order) || 1,
          clickCount: Number(link.clickCount) || 0,
        }));
        
        this.log('변환된 링크들 (카테고리 포함):', convertedLinks);
        
        // 캐시에 저장
        this.setCachedLinks(userId, convertedLinks, userEmail);
        
        const duration = performance.now() - startTime;
        this.log('링크 조회 완료', `${duration.toFixed(2)}ms, ${convertedLinks.length}개`);
        
        return convertedLinks;
      } else {
        throw new Error(result.message || '링크 조회에 실패했습니다.');
      }

    } catch (error: any) {
      this.error('링크 조회 오류', error);
      return []; // 오류 시 빈 배열 반환
    }
  }

  // ✅ 고속 링크 업데이트 (카테고리 포함)
  static async updateLink(linkId: string, linkData: {
    title?: string;
    url?: string;
    category?: string; // 🆕 카테고리 필드 추가
    description?: string;
    imageUrl?: string;
    style?: string;
    isActive?: boolean;
  }) {
    this.log('updateLink 호출됨', { linkId, linkData });

    if (!this.scriptUrl) {
      throw new Error('앱스 스크립트 URL이 설정되지 않았습니다.');
    }

    if (!linkId) {
      throw new Error('링크 ID가 필요합니다.');
    }

    const startTime = performance.now();

    try {
      // undefined 값 제거하여 깔끔한 데이터 전송
      const cleanedData: { [key: string]: any } = {
        action: 'update_link',
        linkId: linkId
      };

      Object.keys(linkData).forEach(key => {
        const value = (linkData as any)[key];
        if (value !== undefined && value !== null) {
          cleanedData[key] = value;
        }
      });

      this.log('링크 업데이트 요청 데이터 (카테고리 포함):', cleanedData);

      const response = await fetch(this.scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(cleanedData),
        mode: 'cors'
      });

      this.log('링크 업데이트 응답 상태', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.error('링크 업데이트 HTTP 오류', { 
          status: response.status, 
          text: errorText 
        });
        throw new Error(`서버 오류 (${response.status}): ${errorText || response.statusText}`);
      }

      const responseText = await response.text();
      this.log('링크 업데이트 응답 텍스트', responseText);

      if (!responseText) {
        throw new Error('서버에서 빈 응답을 받았습니다.');
      }

      let result;
      try {
        result = JSON.parse(responseText);
        this.log('링크 업데이트 파싱된 응답', result);
      } catch (parseError) {
        this.error('링크 업데이트 JSON 파싱 오류', { responseText, parseError });
        throw new Error('서버 응답을 파싱할 수 없습니다: ' + responseText.substring(0, 200));
      }

      if (!result.success) {
        this.error('링크 업데이트 실패 응답', result);
        throw new Error(result.message || '링크 업데이트에 실패했습니다.');
      }

      if (result.success) {
        this.invalidateCache();
        const duration = performance.now() - startTime;
        this.log('링크 업데이트 완료', `${duration.toFixed(2)}ms`);
      }

      return result;

    } catch (error: any) {
      this.error('링크 업데이트 오류', error);
      
      // 에러 타입별 처리
      if (error.message.includes('Failed to fetch')) {
        throw new Error('네트워크 연결 오류가 발생했습니다. 인터넷 연결을 확인해주세요.');
      }
      
      if (error.message.includes('timeout')) {
        throw new Error('요청 시간이 초과되었습니다. 다시 시도해주세요.');
      }
      
      throw error;
    }
  }

  // ✅ 나머지 기존 함수들 (속도 최적화)
  static async updateLinkOrders(userId: string | number, linkOrders: { [key: string]: number }, userEmail?: string) {
    this.log('updateLinkOrders 호출됨', { userId, linkOrders, userEmail });

    if (!this.scriptUrl) {
      throw new Error('앱스 스크립트 URL이 설정되지 않았습니다.');
    }

    try {
      // 안전한 문자열 변환
      const userIdStr = userId ? String(userId).trim() : '';
      const userEmailStr = userEmail ? String(userEmail).trim() : '';

      const requestData = {
        action: 'update_link_orders',
        userId: userIdStr,
        userEmail: userEmailStr,
        linkOrders: linkOrders
      };

      const response = await fetch(this.scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(requestData),
        mode: 'cors'
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`서버 오류 (${response.status}): ${errorText || response.statusText}`);
      }

      const responseText = await response.text();
      const result = JSON.parse(responseText);
      
      if (result.success) {
        this.invalidateCache();
      }

      return result;

    } catch (error: any) {
      this.error('링크 순서 업데이트 오류', error);
      throw error;
    }
  }

  // 링크 활성/비활성 상태 업데이트
  static async toggleLinkActive(linkId: string, isActive: boolean) {
    this.log('toggleLinkActive 호출됨', { linkId, isActive });
    return this.updateLink(linkId, { isActive });
  }

  // 캐시 관리
  static clearCache() {
    this.invalidateCache();
    this.log('캐시 전체 삭제');
  }

  static getCacheStats() {
    return {
      size: this.linkCache.size,
      entries: Array.from(this.linkCache.keys())
    };
  }
}
