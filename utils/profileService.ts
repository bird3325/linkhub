import type { User } from '../types';

// 프로필 서비스
export class ProfileService {
  private static scriptUrl = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL;
  private static profileCache = new Map<string, { profile: any; timestamp: number }>();
  private static cacheTimeout = 5 * 60 * 1000; // 5분

  // 디버깅용 로그 함수
  private static log(message: string, data?: any) {
    console.log(`[ProfileService] ${message}`, data);
  }

  private static error(message: string, error?: any) {
    console.error(`[ProfileService] ${message}`, error);
  }

  // 캐시된 프로필 조회
  private static getCachedProfile(userId: string) {
    const cached = this.profileCache.get(userId);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.profile;
    }
    return null;
  }

  // 프로필 캐시 저장
  private static setCachedProfile(userId: string, profile: any) {
    this.profileCache.set(userId, {
      profile,
      timestamp: Date.now()
    });
  }

  // 프로필과 링크를 동시에 가져오는 새로운 메서드 (최적화 - 새로 추가)
  static async getProfileAndLinks(userId?: string | number, username?: string, userEmail?: string) {
    this.log('프로필 및 링크 동시 조회 시작', { userId, username, userEmail });
    
    if (!this.scriptUrl) {
      throw new Error('앱스 스크립트 URL이 설정되지 않았습니다.');
    }
    
    try {
      // 안전한 문자열 변환
      const userIdStr = userId ? String(userId).trim() : '';
      
      const requestData = {
        action: 'get_profile_and_links',
        userId: userIdStr || null,
        username: username || null,
        userEmail: userEmail || null
      };

      this.log('배치 조회 요청 데이터', requestData);

      // 타임아웃 설정 (40초 - 배치 처리이므로 더 길게)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 40000);

      const response = await fetch(this.scriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(requestData),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, text: ${errorText}`);
      }

      const responseText = await response.text();
      this.log('배치 조회 원시 응답', responseText);

      if (!responseText || responseText.trim() === '') {
        throw new Error('서버에서 빈 응답을 받았습니다.');
      }

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        this.error('배치 조회 JSON 파싱 오류', { responseText, parseError });
        throw new Error('서버 응답을 파싱할 수 없습니다: ' + responseText.substring(0, 200));
      }
      
      if (result.success) {
        this.log('프로필 및 링크 동시 조회 성공', {
          hasProfile: !!result.profile,
          linksCount: result.links?.length || 0,
          processingTime: result.processingTime
        });
        
        // 성공시 캐시 업데이트 (프로필이 있는 경우만)
        if (result.profile && result.profile.userId) {
          this.setCachedProfile(String(result.profile.userId), result.profile);
        }
        
        return {
          success: true,
          profile: result.profile,
          links: result.links || [],
          processingTime: result.processingTime
        };
      } else {
        this.error('프로필 및 링크 동시 조회 실패', result.message);
        return {
          success: false,
          error: result.message,
          profile: null,
          links: []
        };
      }
    } catch (error: any) {
      this.error('프로필 및 링크 동시 조회 중 오류', error);
      
      // 에러 타입별 구체적 처리
      if (error.name === 'AbortError') {
        throw new Error('요청 시간이 초과되었습니다. 다시 시도해주세요.');
      }
      
      if (error.message.includes('Failed to fetch') || error.message.includes('fetch')) {
        throw new Error('네트워크 연결 오류가 발생했습니다. 인터넷 연결을 확인해주세요.');
      }
      
      return {
        success: false,
        error: error.message,
        profile: null,
        links: []
      };
    }
  }

  // 프로필 저장
  static async saveProfile(profileData: {
    userId?: string | number;
    userEmail: string;
    displayName: string;
    username: string;
    bio: string;
    avatar: string;
    template?: string;
  }) {
    if (!this.scriptUrl) {
      throw new Error('앱스 스크립트 URL이 설정되지 않았습니다.');
    }

    // userEmail이 필수가 됨
    if (!profileData.userEmail) {
      throw new Error('사용자 이메일이 필요합니다.');
    }

    try {
      // 안전한 문자열 변환
      const userIdStr = profileData.userId ? String(profileData.userId).trim() : '';

      const requestData = {
        action: 'save_profile',
        userId: userIdStr || null,
        userEmail: profileData.userEmail, // 필수 전달
        displayName: profileData.displayName || '',
        username: profileData.username || '',
        bio: profileData.bio || '',
        avatar: profileData.avatar || '',
        template: profileData.template || 'glass'
      };

      this.log('프로필 저장 요청', requestData);

      const response = await fetch(this.scriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`서버 오류 (${response.status}): ${errorText || response.statusText}`);
      }

      const responseText = await response.text();
      this.log('프로필 저장 응답', responseText);

      if (!responseText) {
        throw new Error('서버에서 빈 응답을 받았습니다.');
      }

      const result = JSON.parse(responseText);
      
      // 성공시 캐시 업데이트 (실제 사용자 ID로)
      if (result.success && result.actualUserId) {
        this.setCachedProfile(String(result.actualUserId), {
          userId: result.actualUserId,
          displayName: profileData.displayName,
          username: profileData.username,
          bio: profileData.bio,
          avatar: profileData.avatar,
          template: profileData.template
        });
      }

      return result;

    } catch (error) {
      this.error('프로필 저장 오류', error);
      throw error;
    }
  }

  // 프로필 업데이트 (수정됨 - 에러 처리 강화)
  static async updateProfile(userId: string | number, updateData: {
    displayName?: string;
    username?: string;
    bio?: string;
    avatar?: string;
    template?: string;
  }, userEmail?: string) {
    this.log('프로필 업데이트 요청', { userId, updateData, userEmail });

    if (!this.scriptUrl) {
      const error = new Error('Google Apps Script URL이 설정되지 않았습니다. VITE_GOOGLE_APPS_SCRIPT_URL 환경변수를 확인해주세요.');
      this.error('스크립트 URL 누락', error);
      throw error;
    }

    if (!userId && !userEmail) {
      const error = new Error('사용자 ID 또는 이메일이 필요합니다.');
      this.error('사용자 식별 정보 누락', error);
      throw error;
    }

    try {
      // 안전한 문자열 변환
      const userIdStr = userId ? String(userId).trim() : '';
      const userEmailStr = userEmail ? String(userEmail).trim() : '';

      const requestData = {
        action: 'save_profile', // update_profile 대신 save_profile 사용 (통합)
        userId: userIdStr,
        userEmail: userEmailStr,
        displayName: updateData.displayName,
        username: updateData.username,
        bio: updateData.bio,
        avatar: updateData.avatar,
        template: updateData.template
      };

      this.log('프로필 업데이트 요청 데이터', requestData);
      this.log('사용할 Apps Script URL', this.scriptUrl);

      // 타임아웃 설정 (30초)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(this.scriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(requestData),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      this.log('HTTP 응답 상태', { status: response.status, ok: response.ok });

      if (!response.ok) {
        const errorText = await response.text();
        this.error('HTTP 오류 응답', { 
          status: response.status, 
          text: errorText 
        });
        throw new Error(`서버 오류 (${response.status}): ${errorText || response.statusText}`);
      }

      const responseText = await response.text();
      this.log('원시 응답 텍스트', responseText);

      if (!responseText || responseText.trim() === '') {
        this.error('빈 응답 받음', responseText);
        throw new Error('서버에서 빈 응답을 받았습니다.');
      }

      let result;
      try {
        result = JSON.parse(responseText);
        this.log('파싱된 응답', result);
      } catch (parseError) {
        this.error('JSON 파싱 오류', { responseText, parseError });
        throw new Error('서버 응답을 파싱할 수 없습니다: ' + responseText.substring(0, 200));
      }

      if (!result) {
        this.error('파싱 결과가 null/undefined', result);
        throw new Error('유효하지 않은 서버 응답입니다.');
      }

      if (!result.success) {
        this.error('서버에서 실패 응답', result);
        throw new Error(result.message || '프로필 업데이트에 실패했습니다.');
      }

      // 성공시 캐시 업데이트
      if (result.success && userIdStr) {
        const cachedProfile = this.getCachedProfile(userIdStr);
        if (cachedProfile) {
          const updatedProfile = { ...cachedProfile, ...updateData };
          this.setCachedProfile(userIdStr, updatedProfile);
        }
      }

      this.log('프로필 업데이트 성공', result);
      return result;

    } catch (error: any) {
      this.error('프로필 업데이트 오류', error);
      
      // 에러 타입별 구체적 처리
      if (error.name === 'AbortError') {
        throw new Error('요청 시간이 초과되었습니다. 다시 시도해주세요.');
      }
      
      if (error.message.includes('Failed to fetch') || error.message.includes('fetch')) {
        throw new Error('네트워크 연결 오류가 발생했습니다. 인터넷 연결을 확인해주세요.');
      }
      
      if (error.message.includes('timeout') || error.message.includes('시간')) {
        throw new Error('요청 시간이 초과되었습니다. 다시 시도해주세요.');
      }
      
      // 이미 처리된 에러는 그대로 전달
      throw error;
    }
  }

  // 프로필 조회
  static async getProfile(userId?: string | number, username?: string, userEmail?: string) {
    if (!this.scriptUrl) {
      throw new Error('앱스 스크립트 URL이 설정되지 않았습니다.');
    }

    // 안전한 문자열 변환
    const userIdStr = userId ? String(userId).trim() : '';

    // 캐시 확인 (userId로 조회하는 경우만)
    if (userIdStr) {
      const cached = this.getCachedProfile(userIdStr);
      if (cached) {
        this.log('캐시된 프로필 사용', cached);
        return { success: true, profile: cached };
      }
    }

    try {
      const requestData = {
        action: 'get_profile',
        userId: userIdStr || null,
        username: username || null,
        userEmail: userEmail || null
      };

      this.log('프로필 조회 요청', requestData);

      const response = await fetch(this.scriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`서버 오류 (${response.status}): ${errorText || response.statusText}`);
      }

      const responseText = await response.text();
      this.log('프로필 조회 응답', responseText);

      if (!responseText) {
        throw new Error('서버에서 빈 응답을 받았습니다.');
      }

      const result = JSON.parse(responseText);
      
      // 성공시 캐시 저장 (실제 사용자 ID로)
      if (result.success && result.profile && result.profile.userId) {
        this.setCachedProfile(String(result.profile.userId), result.profile);
      }

      return result;

    } catch (error) {
      this.error('프로필 조회 오류', error);
      throw error;
    }
  }

  // 배치 처리를 위한 헬퍼 메서드 (추가)
  static async batchRequest(requests: Array<{
    action: string;
    data: any;
  }>) {
    this.log('배치 요청 시작', requests);
    
    if (!this.scriptUrl) {
      throw new Error('앱스 스크립트 URL이 설정되지 않았습니다.');
    }

    try {
      const requestData = {
        action: 'batch_request',
        requests: requests
      };

      const response = await fetch(this.scriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`배치 요청 서버 오류 (${response.status}): ${errorText || response.statusText}`);
      }

      const responseText = await response.text();
      this.log('배치 요청 응답', responseText);

      if (!responseText) {
        throw new Error('서버에서 빈 응답을 받았습니다.');
      }

      const result = JSON.parse(responseText);
      return result;

    } catch (error) {
      this.error('배치 요청 오류', error);
      throw error;
    }
  }

  // 성능 측정을 위한 메서드 (추가)
  static async measurePerformance<T>(
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

  // 캐시 상태 조회 (디버깅용)
  static getCacheStats() {
    const stats = {
      totalCached: this.profileCache.size,
      cacheTimeout: this.cacheTimeout,
      cacheEntries: Array.from(this.profileCache.entries()).map(([key, value]) => ({
        userId: key,
        cachedAt: new Date(value.timestamp).toISOString(),
        isExpired: Date.now() - value.timestamp >= this.cacheTimeout
      }))
    };
    
    this.log('캐시 상태', stats);
    return stats;
  }

  // 만료된 캐시 정리
  static cleanExpiredCache() {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [key, value] of this.profileCache.entries()) {
      if (now - value.timestamp >= this.cacheTimeout) {
        this.profileCache.delete(key);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      this.log('만료된 캐시 정리 완료', { cleanedCount });
    }
    
    return cleanedCount;
  }

  // 캐시 클리어
  static clearCache(userId?: string | number) {
    if (userId) {
      const userIdStr = String(userId);
      this.profileCache.delete(userIdStr);
      this.log('특정 사용자 캐시 삭제', { userId: userIdStr });
    } else {
      this.profileCache.clear();
      this.log('전체 캐시 삭제');
    }
  }

  // 캐시 예열 (미리 자주 사용되는 프로필 로드)
  static async warmupCache(userIds: string[]) {
    this.log('캐시 예열 시작', { userIds });
    
    const promises = userIds.map(async (userId) => {
      try {
        await this.getProfile(userId);
        return { userId, success: true };
      } catch (error) {
        this.error(`캐시 예열 실패 - 사용자 ${userId}`, error);
        return { userId, success: false, error: error };
      }
    });
    
    const results = await Promise.allSettled(promises);
    const stats = {
      total: userIds.length,
      success: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length
    };
    
    this.log('캐시 예열 완료', stats);
    return stats;
  }
}
