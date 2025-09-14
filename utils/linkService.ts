import type { Link } from '../types';

// 링크 서비스
export class LinkService {
  private static scriptUrl = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL;

  // 새 링크 저장
  static async saveLink(linkData: {
    userId: string;
    title: string;
    url: string;
    description?: string;
    imageUrl?: string;
    style?: string;
    isActive?: boolean;
  }) {
    if (!this.scriptUrl) {
      throw new Error('앱스 스크립트 URL이 설정되지 않았습니다.');
    }

    try {
      const requestData = {
        action: 'save_link',
        userId: linkData.userId,
        title: linkData.title,
        url: linkData.url,
        description: linkData.description || '',
        imageUrl: linkData.imageUrl || '',
        style: linkData.style || 'SIMPLE',
        isActive: linkData.isActive !== undefined ? linkData.isActive : true
      };

      console.log('링크 저장 요청:', requestData);

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
      console.log('링크 저장 응답:', responseText);

      if (!responseText) {
        throw new Error('서버에서 빈 응답을 받았습니다.');
      }

      const result = JSON.parse(responseText);
      return result;

    } catch (error) {
      console.error('링크 저장 오류:', error);
      throw error;
    }
  }

  // 사용자의 모든 링크 조회
  static async getLinks(userId: string): Promise<Link[]> {
    if (!this.scriptUrl) {
      throw new Error('앱스 스크립트 URL이 설정되지 않았습니다.');
    }

    try {
      const requestData = {
        action: 'get_links',
        userId: userId
      };

      console.log('링크 조회 요청:', requestData);

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
      console.log('링크 조회 응답:', responseText);

      if (!responseText) {
        throw new Error('서버에서 빈 응답을 받았습니다.');
      }

      const result = JSON.parse(responseText);
      
      if (result.success) {
        return result.links || [];
      } else {
        throw new Error(result.message || '링크 조회에 실패했습니다.');
      }

    } catch (error) {
      console.error('링크 조회 오류:', error);
      return []; // 오류 시 빈 배열 반환
    }
  }

  // 링크 순서 업데이트
  static async updateLinkOrders(userId: string, linkOrders: { [key: string]: number }) {
    if (!this.scriptUrl) {
      throw new Error('앱스 스크립트 URL이 설정되지 않았습니다.');
    }

    try {
      const requestData = {
        action: 'update_link_orders',
        userId: userId,
        linkOrders: linkOrders
      };

      console.log('링크 순서 업데이트 요청:', requestData);

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
      console.log('링크 순서 업데이트 응답:', responseText);

      if (!responseText) {
        throw new Error('서버에서 빈 응답을 받았습니다.');
      }

      const result = JSON.parse(responseText);
      return result;

    } catch (error) {
      console.error('링크 순서 업데이트 오류:', error);
      throw error;
    }
  }
}
