import type { Link } from '../types';

// 링크 서비스
export class LinkService {
  private static scriptUrl = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL;

  // 디버깅용 로그 함수
  private static log(message: string, data?: any) {
    console.log(`[LinkService] ${message}`, data);
  }

  private static error(message: string, error?: any) {
    console.error(`[LinkService] ${message}`, error);
  }

  // 새 링크 저장 (수정됨)
  static async saveLink(linkData: {
    userId: string;
    userEmail?: string; // 추가
    title: string;
    url: string;
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

    // 필수 데이터 검증
    if (!linkData.userId && !linkData.userEmail) {
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
        userId: linkData.userId,
        userEmail: linkData.userEmail, // 추가
        title: linkData.title.trim(),
        url: linkData.url.trim(),
        description: linkData.description?.trim() || '',
        imageUrl: linkData.imageUrl?.trim() || '',
        style: linkData.style || 'SIMPLE',
        isActive: linkData.isActive !== undefined ? linkData.isActive : true
      };

      this.log('전송할 데이터', requestData);

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

    } catch (error: any) {
      this.error('saveLink 실행 중 오류', error);
      throw error;
    }
  }

  // 사용자의 모든 링크 조회 (수정됨)
  static async getLinks(userId: string, userEmail?: string): Promise<Link[]> {
    this.log('getLinks 호출됨', { userId, userEmail });

    if (!this.scriptUrl) {
      throw new Error('앱스 스크립트 URL이 설정되지 않았습니다.');
    }

    if (!userId?.trim() && !userEmail?.trim()) {
      throw new Error('사용자 ID 또는 이메일이 필요합니다.');
    }

    try {
      const requestData = {
        action: 'get_links',
        userId: userId?.trim(),
        userEmail: userEmail?.trim()
      };

      this.log('링크 조회 요청 데이터', requestData);

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

      const result = JSON.parse(responseText);
      this.log('파싱된 링크 조회 응답', result);
      
      if (result.success) {
        // 구글 시트 데이터를 React Link 타입으로 변환
        const convertedLinks: Link[] = (result.links || []).map((link: any) => ({
          id: link.id,
          userId: link.userId,
          title: link.title,
          url: link.url,
          style: link.style,
          imageUrl: link.imageUrl || undefined,
          isActive: Boolean(link.isActive),
          order: Number(link.order) || 1,
          clickCount: Number(link.clickCount) || 0,
        }));
        
        this.log('변환된 링크들', convertedLinks);
        return convertedLinks;
      } else {
        throw new Error(result.message || '링크 조회에 실패했습니다.');
      }

    } catch (error: any) {
      this.error('링크 조회 오류', error);
      return []; // 오류 시 빈 배열 반환
    }
  }

  // 링크 업데이트
  static async updateLink(linkId: string, linkData: {
    title?: string;
    url?: string;
    description?: string;
    imageUrl?: string;
    style?: string;
    isActive?: boolean;
  }) {
    this.log('updateLink 호출됨', { linkId, linkData });

    if (!this.scriptUrl) {
      throw new Error('앱스 스크립트 URL이 설정되지 않았습니다.');
    }

    try {
      const requestData = {
        action: 'update_link',
        linkId: linkId,
        ...linkData
      };

      this.log('링크 업데이트 요청 데이터', requestData);

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
      this.log('링크 업데이트 응답', responseText);

      if (!responseText) {
        throw new Error('서버에서 빈 응답을 받았습니다.');
      }

      const result = JSON.parse(responseText);
      return result;

    } catch (error: any) {
      this.error('링크 업데이트 오류', error);
      throw error;
    }
  }

  // 링크 순서 업데이트 (수정됨)
  static async updateLinkOrders(userId: string, linkOrders: { [key: string]: number }, userEmail?: string) {
    this.log('updateLinkOrders 호출됨', { userId, linkOrders, userEmail });

    if (!this.scriptUrl) {
      throw new Error('앱스 스크립트 URL이 설정되지 않았습니다.');
    }

    try {
      const requestData = {
        action: 'update_link_orders',
        userId: userId,
        userEmail: userEmail,
        linkOrders: linkOrders
      };

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
      const result = JSON.parse(responseText);
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
}
