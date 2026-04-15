/**
 * 카카오톡 공유 유틸리티
 * [CL-KAKAO-HARDEN-20260412-231500] 로그 강화 + env 체크 안정화
 * 3단 폴백: Kakao SDK → Web Share API → Clipboard
 */

import type { TravelProfile } from '@/lib/honeymoon-profile';
import type { Destination } from '@/lib/honeymoon-destinations';

declare global {
  interface Window {
    Kakao?: {
      init: (appKey: string) => void;
      isInitialized: () => boolean;
      Share: {
        sendDefault: (options: Record<string, unknown>) => void;
      };
    };
  }
}

const KAKAO_APP_KEY = import.meta.env.VITE_KAKAO_APP_KEY || '';
const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://honeymoon-ai.moderninsightspot.com';

/**
 * Kakao SDK 초기화 시도
 * 앱 키가 없거나 SDK 미로드 시 false 반환 (에러 없이)
 */
function ensureKakaoInit(): boolean {
  if (typeof window === 'undefined') return false;
  if (!window.Kakao) {
    console.info('[kakao-share] Kakao SDK not loaded — falling back to Web Share API');
    return false;
  }
  if (!KAKAO_APP_KEY) {
    console.info('[kakao-share] VITE_KAKAO_APP_KEY not set — falling back');
    return false;
  }
  try {
    if (!window.Kakao.isInitialized()) {
      window.Kakao.init(KAKAO_APP_KEY);
    }
    return window.Kakao.isInitialized();
  } catch (err) {
    console.warn('[kakao-share] Kakao.init failed:', err);
    return false;
  }
}

export function shareToKakao(
  profile?: TravelProfile | null,
  championDest?: Destination | null,
): void {
  const title = profile
    ? `나의 허니문 유형: ${profile.profileEmoji} ${profile.profileLabel}`
    : '나만의 허니문 여행지를 찾아보세요!';

  const description = championDest
    ? `추천 1위: ${championDest.markerEmoji} ${championDest.name} — AI가 분석한 맞춤 여행지예요!`
    : 'AI가 취향과 예산에 맞는 신혼여행지를 추천해드려요.';

  // 1단계: Kakao SDK (앱 키 + SDK 모두 준비된 경우)
  if (ensureKakaoInit()) {
    try {
      window.Kakao!.Share.sendDefault({
        objectType: 'feed',
        content: {
          title,
          description,
          imageUrl: `${SITE_URL}/og-image.png`,
          link: {
            mobileWebUrl: SITE_URL,
            webUrl: SITE_URL,
          },
        },
        buttons: [
          {
            title: '나도 테스트하기',
            link: {
              mobileWebUrl: `${SITE_URL}/honeymoon`,
              webUrl: `${SITE_URL}/honeymoon`,
            },
          },
        ],
      });
      console.info('[kakao-share] Shared via Kakao SDK');
      return;
    } catch (err) {
      console.warn('[kakao-share] Kakao share failed, falling back:', err);
    }
  }

  // 2단계: Web Share API (모바일에서 주로 작동)
  const shareText = `${title}\n${description}\n\n${SITE_URL}/honeymoon`;

  if (typeof navigator !== 'undefined' && navigator.share) {
    navigator.share({
      title: '허니문AI - 나의 허니문 결과',
      text: shareText,
      url: `${SITE_URL}/honeymoon`,
    }).then(() => {
      console.info('[kakao-share] Shared via Web Share API');
    }).catch((err) => {
      // AbortError = 사용자 취소 (정상), 그 외는 로깅
      if (err?.name !== 'AbortError') {
        console.warn('[kakao-share] Web Share API failed:', err);
      }
    });
    return;
  }

  // 3단계: Clipboard (최종 폴백)
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(shareText).then(() => {
      console.info('[kakao-share] Copied to clipboard');
      alert('결과가 클립보드에 복사되었어요! 카카오톡에 붙여넣기 해주세요.');
    }).catch((err) => {
      console.warn('[kakao-share] Clipboard failed:', err);
      prompt('아래 텍스트를 복사해서 공유해주세요:', shareText);
    });
    return;
  }

  // 최종 최종 폴백: prompt
  console.info('[kakao-share] Using prompt fallback');
  prompt('아래 텍스트를 복사해서 공유해주세요:', shareText);
}
