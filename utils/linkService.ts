import type { Link } from '../types';

// 링크 서비스
export class LinkService {
  private static scriptUrl = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL;
  private static linkCache = new Map<string, { links: Link[]; timestamp: number }>();
  private static cacheTimeout = 3 * 60 * 1000; // 3분 (링크는 더 자주 변경될 수 있으므로)

  // 디버깅용 로그 함수
  private static log(message: string, data?: any) {
    console.log(`[LinkService] ${message}`, data);
  }

  private static error(message: string, error?: any) {
    console.error(`[LinkService] ${message}`, error);
  }

  // 캐시 관련 메서드들 (새로 추가)
  private static getCacheKey(userId: string | number, userEmail?: string): string {
    return userEmail ? `email_${userEmail}` : `user_${userId}`;
  }

  private static getCachedLinks(userId: string | number, userEmail?: string): Link[] | null {
    const cacheKey = this.getCacheKey(userId, userEmail);
    const cached = this.linkCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      this.log('캐시된 링크 사용', { cacheKey, count: cached.links.length });
      return cached.links;
    }
    
    return null;
  }

  private static setCachedLinks(userId: string | number, links: Link[], userEmail?: string) {
    const cacheKey = this.getCacheKey(userId, userEmail);
    this.linkCache.set(cacheKey, {
      links,
      timestamp: Date.now()
    });
    this.log('링크 캐시 저장', { cacheKey, count: links.length });
  }

  private static invalidateCache(userId?: string | number, userEmail?: string) {
    if (userId || userEmail) {
      const cacheKey = this.getCacheKey(userId || '', userEmail);
      this.linkCache.delete(cacheKey);
      this.log('특정 사용자 링크 캐시 무효화', { cacheKey });
    } else {
      this.linkCache.clear();
      this.log('전체 링크 캐시 무효화');
    }
  }

  // 성능 측정 헬퍼 (새로 추가)
  private static async measurePerformance<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<{ result: T; duration: number }> {
    const startTime = performance.now();
    
    try {
      const result = await operation();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.log(`성능 측정 - ${operationName}`, {
        duration: `${duration.toFixed(2)}ms`,
        success: true
      });
      
      return { result, duration };
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.error(`성능 측정 - ${operationName} (실패)`, {
        duration: `${duration.toFixed(2)}ms`,
        error: error
      });
      
      throw error;
    }
  }

  // 새 링크 저장 (수정됨 - 성능 최적화)
  static async saveLink(linkData: {
    userId: string | number;
    userEmail?: string;
    title: string;
    url: string;
    category?: string;
    description?: string;
    imageUrl?: string;
    style?: string;
    isActive?: boolean;
  }) {
    this.log('saveLink 호출됨', linkData);

    if (!this.scriptUrl) {
      const error = '앱스 스크립트 URL이 설정되지 않았습니다.';
      this.error(error);
      throw new Error(error);
    }

    // 필수 데이터 검증 (수정됨)
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

    try {
      const requestData = {
        action: 'save_link',
        userId: userIdStr,
        userEmail: userEmailStr,
        title: linkData.title.trim(),
        url: linkData.url.trim(),
        description: linkData.description?.trim() || '',
        imageUrl: linkData.imageUrl?.trim() || '',
        style: linkData.style || 'SIMPLE',
        isActive: linkData.isActive !== undefined ? linkData.isActive : true
      };

      this.log('전송할 데이터', requestData);

      // 성능 측정과 함께 요청 실행
      const { result } = await this.measurePerformance(async () => {
        const response = await fetch(this.scriptUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8',
          },
          body: JSON.stringify(requestData),
          mode: 'cors'
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

        if (!result.success) {
          this.error('서버에서 실패 응답', result);
        }

        return result;
      }, 'saveLink');

      // 성공 시 캐시 무효화 (새 링크가 추가되었으므로)
      if (result.success) {
        this.invalidateCache(linkData.userId, linkData.userEmail);
      }

      return result;

    } catch (error: any) {
      this.error('saveLink 실행 중 오류', error);
      throw error;
    }
  }

  // 사용자의 모든 링크 조회 (수정됨 - 캐싱 추가)
  static async getLinks(userId: string | number, userEmail?: string): Promise<Link[]> {
    this.log('getLinks 호출됨', { userId, userEmail });

    if (!this.scriptUrl) {
      throw new Error('앱스 스크립트 URL이 설정되지 않았습니다.');
    }

    // 안전한 문자열 변환 (수정됨)
    const userIdStr = userId ? String(userId).trim() : '';
    const userEmailStr = userEmail ? String(userEmail).trim() : '';

    if (!userIdStr && !userEmailStr) {
      throw new Error('사용자 ID 또는 이메일이 필요합니다.');
    }

    // 캐시 확인 (새로 추가)
    const cachedLinks = this.getCachedLinks(userId, userEmail);
    if (cachedLinks) {
      return cachedLinks;
    }

    try {
      const requestData = {
        action: 'get_links',
        userId: userIdStr,
        userEmail: userEmailStr
      };

      this.log('링크 조회 요청 데이터', requestData);

      // 성능 측정과 함께 요청 실행
      const { result, duration } = await this.measurePerformance(async () => {
        const response = await fetch(this.scriptUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8',
          },
          body: JSON.stringify(requestData),
          mode: 'cors'
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

        return JSON.parse(responseText);
      }, 'getLinks');

      this.log('파싱된 링크 조회 응답', result);
      
      if (result.success) {
        // 구글 시트 데이터를 React Link 타입으로 변환
        const convertedLinks: Link[] = (result.links || []).map((link: any) => ({
          id: link.id,
          userId: String(link.userId), // 문자열로 변환
          title: link.title,
          url: link.url,
          category: link.category || undefined,
          style: link.style,
          imageUrl: link.imageUrl || undefined,
          isActive: Boolean(link.isActive),
          order: Number(link.order) || 1,
          clickCount: Number(link.clickCount) || 0,
        }));
        
        this.log('변환된 링크들', convertedLinks);
        
        // 캐시에 저장 (새로 추가)
        this.setCachedLinks(userId, convertedLinks, userEmail);
        
        return convertedLinks;
      } else {
        throw new Error(result.message || '링크 조회에 실패했습니다.');
      }

    } catch (error: any) {
      this.error('링크 조회 오류', error);
      return []; // 오류 시 빈 배열 반환
    }
  }

  // 배치 링크 업데이트 (새로 추가 - 여러 링크를 한 번에 업데이트)
  static async batchUpdateLinks(updates: Array<{
    linkId: string;
    data: {
      title?: string;
      url?: string;
      category?: string;
      description?: string;
      imageUrl?: string;
      style?: string;
      isActive?: boolean;
    }
  }>) {
    this.log('batchUpdateLinks 호출됨', updates);

    if (!this.scriptUrl) {
      throw new Error('앱스 스크립트 URL이 설정되지 않았습니다.');
    }

    if (!updates || updates.length === 0) {
      throw new Error('업데이트할 링크가 없습니다.');
    }

    try {
      const requestData = {
        action: 'batch_update_links',
        updates: updates
      };

      this.log('배치 업데이트 요청 데이터', requestData);

      const { result } = await this.measurePerformance(async () => {
        const response = await fetch(this.scriptUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8',
          },
          body: JSON.stringify(requestData),
          mode: 'cors'
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`서버 오류 (${response.status}): ${errorText || response.statusText}`);
        }

        const responseText = await response.text();
        
        if (!responseText) {
          throw new Error('서버에서 빈 응답을 받았습니다.');
        }

        return JSON.parse(responseText);
      }, 'batchUpdateLinks');

      // 성공 시 전체 캐시 무효화
      if (result.success) {
        this.invalidateCache();
      }

      return result;

    } catch (error: any) {
      this.error('배치 링크 업데이트 오류', error);
      throw error;
    }
  }

  // 링크 업데이트 (최적화됨)
  static async updateLink(linkId: string, linkData: {
    title?: string;
    url?: string;
    category?: string;
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

      this.log('링크 업데이트 요청 데이터', cleanedData);

      // 성능 측정과 함께 요청 실행
      const { result } = await this.measurePerformance(async () => {
        const response = await fetch(this.scriptUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8',
          },
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

        return result;
      }, 'updateLink');

      // 성공 시 캐시 무효화
      if (result.success) {
        this.invalidateCache();
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

  // 링크 순서 업데이트 (수정됨 - 최적화)
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

      // 성능 측정과 함께 요청 실행
      const { result } = await this.measurePerformance(async () => {
        const response = await fetch(this.scriptUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8',
          },
          body: JSON.stringify(requestData),
          mode: 'cors'
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`서버 오류 (${response.status}): ${errorText || response.statusText}`);
        }

        const responseText = await response.text();
        return JSON.parse(responseText);
      }, 'updateLinkOrders');

      // 성공 시 해당 사용자의 캐시만 무효화
      if (result.success) {
        this.invalidateCache(userId, userEmail);
      }

      return result;

    } catch (error: any) {
      this.error('링크 순서 업데이트 오류', error);
      throw error;
    }
  }

  // 링크 활성/비활성 상태 업데이트 (최적화됨)
  static async toggleLinkActive(linkId: string, isActive: boolean) {
    this.log('toggleLinkActive 호출됨', { linkId, isActive });
    return this.updateLink(linkId, { isActive });
  }

  // 링크 삭제 (새로 추가)
  static async deleteLink(linkId: string) {
    this.log('deleteLink 호출됨', { linkId });

    if (!this.scriptUrl) {
      throw new Error('앱스 스크립트 URL이 설정되지 않았습니다.');
    }

    if (!linkId) {
      throw new Error('링크 ID가 필요합니다.');
    }

    try {
      const requestData = {
        action: 'delete_link',
        linkId: linkId
      };

      const { result } = await this.measurePerformance(async () => {
        const response = await fetch(this.scriptUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8',
          },
          body: JSON.stringify(requestData),
          mode: 'cors'
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`서버 오류 (${response.status}): ${errorText || response.statusText}`);
        }

        const responseText = await response.text();
        
        if (!responseText) {
          throw new Error('서버에서 빈 응답을 받았습니다.');
        }

        return JSON.parse(responseText);
      }, 'deleteLink');

      // 성공 시 전체 캐시 무효화
      if (result.success) {
        this.invalidateCache();
      }

      return result;

    } catch (error: any) {
      this.error('링크 삭제 오류', error);
      throw error;
    }
  }

  // 캐시 관리 메서드들 (새로 추가)
  static getCacheStats() {
    const stats = {
      totalCached: this.linkCache.size,
      cacheTimeout: this.cacheTimeout,
      cacheEntries: Array.from(this.linkCache.entries()).map(([key, value]) => ({
        cacheKey: key,
        cachedAt: new Date(value.timestamp).toISOString(),
        linkCount: value.links.length,
        isExpired: Date.now() - value.timestamp >= this.cacheTimeout
      }))
    };
    
    this.log('링크 캐시 상태', stats);
    return stats;
  }

  static cleanExpiredCache() {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [key, value] of this.linkCache.entries()) {
      if (now - value.timestamp >= this.cacheTimeout) {
        this.linkCache.delete(key);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      this.log('만료된 링크 캐시 정리 완료', { cleanedCount });
    }
    
    return cleanedCount;
  }

  static clearCache(userId?: string | number, userEmail?: string) {
    this.invalidateCache(userId, userEmail);
  }

  // 링크 검증 헬퍼 (새로 추가)
  static validateLinkData(linkData: {
    title?: string;
    url?: string;
    category?: string;
    description?: string;
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (linkData.title !== undefined) {
      if (!linkData.title || linkData.title.trim().length === 0) {
        errors.push('제목은 필수입니다.');
      } else if (linkData.title.length > 100) {
        errors.push('제목은 100자를 초과할 수 없습니다.');
      }
    }
    
    if (linkData.url !== undefined) {
      if (!linkData.url || linkData.url.trim().length === 0) {
        errors.push('URL은 필수입니다.');
      } else {
        try {
          new URL(linkData.url);
        } catch {
          errors.push('유효하지 않은 URL 형식입니다.');
        }
      }
    }

    if (linkData.category !== undefined && linkData.category.length > 20) {
      errors.push('카테고리는 20자를 초과할 수 없습니다.');
    }
    
    if (linkData.description !== undefined && linkData.description.length > 500) {
      errors.push('설명은 500자를 초과할 수 없습니다.');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // URL 정규화 헬퍼 (새로 추가)
  static normalizeUrl(url: string): string {
    if (!url) return url;
    
    let normalizedUrl = url.trim();
    
    // 프로토콜이 없으면 https:// 추가
    if (!/^https?:\/\//i.test(normalizedUrl)) {
      normalizedUrl = 'https://' + normalizedUrl;
    }
    
    return normalizedUrl;
  }
}
