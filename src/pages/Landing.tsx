/**
 * 허니문AI 랜딩 페이지
 * Toss 스타일 미니멀 디자인, 모바일 우선
 */
// [CL-SIMPLE-START-20260416-021500] Landing 간소화 — WelcomeStep 스타일 1클릭 시작
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Plane, Sparkles, Heart,
  ExternalLink, Copy, CheckCircle2,
} from 'lucide-react';
import {
  getBrowserInfo,
  openInExternalBrowserWithFallback,
  copyToClipboard,
  getAppSpecificGuide,
} from '@/lib/kakao-browser';
import { useSEO } from '@/hooks/useSEO';

export default function Landing() {
  const navigate = useNavigate();

  useSEO({
    title: '허니문AI - AI 신혼여행 추천 서비스',
    description: '이미지 월드컵으로 취향을 분석하고, AI가 맞춤 신혼여행지 5곳을 추천해드려요.',
    path: '/',
  });

  // ── 인앱 브라우저 감지 ──
  const [showBridgeUI, setShowBridgeUI] = useState(false);
  const [browserInfo] = useState(() => getBrowserInfo());
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (browserInfo.isInAppBrowser) {
      openInExternalBrowserWithFallback(
        window.location.href,
        () => setShowBridgeUI(true),
      );
    }
  }, [browserInfo.isInAppBrowser]);

  const handleCopyUrl = useCallback(async () => {
    const success = await copyToClipboard(window.location.href);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, []);

  // [CL-LANDING-BRIDGE-FIX-20260412-232000] 인앱 브라우저 브릿지 UI 버그 수정
  if (showBridgeUI && browserInfo.isInAppBrowser) {
    const guide = getAppSpecificGuide(browserInfo.detectedApp, browserInfo.isIOS, browserInfo.isAndroid);
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-5">
        <div className="max-w-sm w-full text-center space-y-6 animate-fade-up">
          <div className="text-4xl">✈️</div>
          <h2 className="text-lg font-bold text-foreground">외부 브라우저에서 열어주세요</h2>
          <p className="text-sm text-muted-foreground">
            {browserInfo.detectedApp ? `${browserInfo.detectedApp} 내` : '현재'} 브라우저에서는 일부 기능이 제한될 수 있어요.
          </p>
          <div className="space-y-3">
            <Button
              onClick={() => openInExternalBrowserWithFallback(window.location.href, () => {})}
              className="w-full rounded-xl"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              외부 브라우저로 열기
            </Button>
            <Button variant="outline" onClick={handleCopyUrl} className="w-full rounded-xl">
              {copied ? <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? 'URL 복사 완료!' : 'URL 복사'}
            </Button>
          </div>
          {guide.steps.length > 0 && (
            <div className="bg-muted/50 rounded-xl p-4 text-left">
              <p className="text-sm font-medium text-foreground mb-2">📱 여는 방법</p>
              <ol className="text-xs text-muted-foreground space-y-1.5">
                {guide.steps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── [CL-SIMPLE-START-20260416-021500] 심플 랜딩 (WelcomeStep 통합) ──
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5">
      <div className="max-w-lg w-full text-center">
        {/* Floating emoji */}
        <div className="relative mb-8 animate-fade-up">
          <div className="text-6xl animate-float">✈️</div>
          <Heart
            className="absolute -top-2 -right-4 w-5 h-5 text-rose-400 animate-bounce"
            style={{ animationDelay: '0.3s' }}
            aria-hidden="true"
          />
          <Sparkles
            className="absolute -bottom-1 -left-4 w-5 h-5 text-amber-400 animate-bounce"
            style={{ animationDelay: '0.6s' }}
            aria-hidden="true"
          />
        </div>

        {/* Title */}
        <h1 className="text-heading text-foreground mb-3 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          우리만의 허니문,
          <br />
          찾아볼까요?
        </h1>

        {/* Subtitle */}
        <p className="text-body text-muted-foreground mb-2 max-w-xs mx-auto animate-fade-up" style={{ animationDelay: '0.15s' }}>
          간단한 이미지 테스트로
          <br />
          딱 맞는 여행지를 추천해 드려요
        </p>

        {/* Sub info */}
        <div className="flex items-center justify-center gap-4 text-caption text-muted-foreground/70 mb-10 animate-fade-up" style={{ animationDelay: '0.2s' }}>
          <span className="flex items-center gap-1">
            <Plane className="w-3.5 h-3.5" aria-hidden="true" />
            약 2분 소요
          </span>
          <span>·</span>
          <span>AI 맞춤 추천</span>
        </div>

        {/* CTA */}
        <div className="animate-fade-up" style={{ animationDelay: '0.25s' }}>
          <Button
            size="lg"
            onClick={() => navigate('/honeymoon')}
            className="rounded-2xl px-10 py-6 text-base font-semibold shadow-primary-glow animate-pulse-subtle w-full max-w-xs"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            시작하기
          </Button>
        </div>

        {/* Skip option */}
        <button
          onClick={() => navigate('/honeymoon?skip=1')}
          className="mt-4 text-small text-muted-foreground/50 hover:text-muted-foreground transition-colors animate-fade-up"
          style={{ animationDelay: '0.3s' }}
        >
          바로 지도 보기
        </button>
      </div>
    </div>
  );
}
