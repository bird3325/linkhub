// 프로필 서비스
export class ProfileService {
  private static scriptUrl = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL;
  private static profileCache = new Map<string, { profile: any; timestamp: number }>();
  private static cacheTimeout = 5 * 60 * 1000; // 5분

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

  // 프로필 저장 (수정됨)
  static async saveProfile(profileData: {
    userId?: string | number;
    userEmail: string;
    displayName: string;
    username: string;
    bio: string;
    avatar: string;
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
        avatar: profileData.avatar || ''
      };

      console.log('프로필 저장 요청:', requestData);

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
      console.log('프로필 저장 응답:', responseText);

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
          avatar: profileData.avatar
        });
      }

      return result;

    } catch (error) {
      console.error('프로필 저장 오류:', error);
      throw error;
    }
  }

  // 프로필 조회 (수정됨)
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
        console.log('캐시된 프로필 사용:', cached);
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

      console.log('프로필 조회 요청:', requestData);

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
      console.log('프로필 조회 응답:', responseText);

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
      console.error('프로필 조회 오류:', error);
      throw error;
    }
  }

  // 캐시 클리어
  static clearCache(userId?: string | number) {
    if (userId) {
      const userIdStr = String(userId);
      this.profileCache.delete(userIdStr);
    } else {
      this.profileCache.clear();
    }
  }
}
