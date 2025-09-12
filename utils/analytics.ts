// 방문자 추적 유틸리티
export class VisitorTracker {
  private static scriptUrl = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL;
  
  // 로그인한 사용자 정보를 localStorage에서 가져오는 헬퍼 함수
  private static getLoggedInUserInfo() {
    try {
      const userInfoStr = localStorage.getItem('userInfo');
      if (userInfoStr) {
        return JSON.parse(userInfoStr);
      }
    } catch (error) {
      console.warn('사용자 정보 파싱 오류:', error);
    }
    return null;
  }
  
  static async logVisit(page: string, userInfo?: { id?: string; email?: string; username?: string; name?: string }, isLoggedIn: boolean = false) {
    if (!this.scriptUrl) return;
    
    try {
      // 클라이언트 IP 조회
      let clientIp = '';
      try {
        const ipRes = await fetch('https://api.ipify.org?format=json');
        if (ipRes.ok) {
          const ipData = await ipRes.json();
          clientIp = ipData.ip || '';
        }
      } catch (error) {
        console.warn('IP 조회 실패:', error);
      }

      // 세션 ID 생성 또는 가져오기
      let sessionId = localStorage.getItem('sessionId');
      if (!sessionId) {
        sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('sessionId', sessionId);
      }

      // 로그인한 사용자 정보를 localStorage에서 우선 가져오기
      const loggedInUser = isLoggedIn ? this.getLoggedInUserInfo() : null;
      const finalUserInfo = loggedInUser || userInfo;

      const logData = {
        action: 'visitor_log',
        userAgent: navigator.userAgent,
        referrer: document.referrer,
        page: page,
        userId: finalUserInfo?.id || '',
        userEmail: finalUserInfo?.email || '',
        isLoggedIn: isLoggedIn,
        sessionId: sessionId
      };

      console.log('전송할 방문 로그 데이터:', logData);

      const urlWithParams = clientIp ? `${this.scriptUrl}?ip=${encodeURIComponent(clientIp)}` : this.scriptUrl;

      await fetch(urlWithParams, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(logData),
      });

    } catch (error) {
      console.warn('방문 로그 기록 실패:', error);
    }
  }

  static async logLinkClick(linkId: string, linkTitle: string, linkUrl: string, userInfo?: { id?: string; email?: string; username?: string; name?: string }) {
    if (!this.scriptUrl) return;

    try {
      let clientIp = '';
      try {
        const ipRes = await fetch('https://api.ipify.org?format=json');
        if (ipRes.ok) {
          const ipData = await ipRes.json();
          clientIp = ipData.ip || '';
        }
      } catch (error) {
        console.warn('IP 조회 실패:', error);
      }

      // 로그인한 사용자 정보를 localStorage에서 우선 가져오기
      const loggedInUser = this.getLoggedInUserInfo();
      const finalUserInfo = loggedInUser || userInfo;

      const clickData = {
        action: 'link_click',
        userAgent: navigator.userAgent,
        linkId: linkId,
        linkTitle: linkTitle,
        linkUrl: linkUrl,
        userId: finalUserInfo?.id || '',
        userEmail: finalUserInfo?.email || ''
      };

      console.log('전송할 클릭 로그 데이터:', clickData);

      const urlWithParams = clientIp ? `${this.scriptUrl}?ip=${encodeURIComponent(clientIp)}` : this.scriptUrl;

      await fetch(urlWithParams, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(clickData),
      });

    } catch (error) {
      console.warn('클릭 로그 기록 실패:', error);
    }
  }

  static async getStats(days: number = 7) {
    if (!this.scriptUrl) return null;

    try {
      const statsData = {
        action: 'get_stats',
        days: days
      };

      const response = await fetch(this.scriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(statsData),
      });

      if (!response.ok) return null;

      const responseText = await response.text();
      const result = JSON.parse(responseText);

      if (result.success) {
        return result.stats;
      }
    } catch (error) {
      console.warn('통계 조회 실패:', error);
    }

    return null;
  }
}
