/**
 * 허니문AI 랜딩 페이지
 * Toss 스타일 미니멀 디자인, 모바일 우선
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Plane, Sparkles, BarChart3,
  ExternalLink, Copy, CheckCircle2,
} from 'lucide-react';
import {
  getBrowserInfo,
  openInExternalBrowserWithFallback,
  copyToClipboard,
  getAppSpecificGuide,
} from '@/lib/kakao-browser';
import { useSEO } from '@/hooks/useSEO';

/* ─── How It Works Steps ─── */
const STEPS = [
  {
    emoji: '🏆',
    title: '이미지 월드컵',
    desc: '16개 여행지 사진에서 마음에 드는 곳을 골라요',
    color: 'from-yellow-400 to-orange-400',
  },
  {
    emoji: '🤖',
    title: 'AI 분석',
    desc: '취향과 예산에 맞는 여행지를 AI가 찾아요',
    color: 'from-blue-400 to-indigo-400',
  },
  {
    emoji: '📊',
    title: '비교 & 계획',
    desc: '레이더 차트로 비교하고 일정을 만들어요',
    color: 'from-emerald-400 to-teal-400',
  },
];

/* ─── Stats ─── */
const STATS = [
  { value: '100+', label: '여행지' },
  { value: 'AI', label: '맞춤 추천' },
  { value: '무료', label: '완전 무료' },
];

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

  // ── 메인 랜딩 ──
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-5 pt-16 pb-10">
        <div className="max-w-lg w-full text-center">
          {/* 플로팅 아이콘 */}
          <div className="relative w-16 h-16 mx-auto mb-6 animate-fade-up">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 animate-float" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Plane className="w-7 h-7 text-primary" />
            </div>
          </div>

          {/* 배지 */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4 animate-fade-up animate-shimmer" style={{ animationDelay: '0.05s' }}>
            <Sparkles className="w-3.5 h-3.5" />
            AI 맞춤 추천
          </div>

          {/* 타이틀 */}
          <h1 className="text-display text-foreground mb-3 animate-fade-up" style={{ animationDelay: '0.1s' }}>
            나만의 허니문,{' '}
            <span className="bg-gradient-to-r from-primary via-blue-500 to-primary bg-clip-text text-transparent">
              AI가 찾아줘요
            </span>
          </h1>

          {/* 서브타이틀 */}
          <p className="text-body-lg text-muted-foreground mb-8 animate-fade-up" style={{ animationDelay: '0.15s' }}>
            이미지 테스트로 취향 분석 → 맞춤 여행지 5곳 추천
          </p>

          {/* CTA */}
          <div className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <Button
              size="lg"
              onClick={() => navigate('/honeymoon')}
              className="w-full max-w-xs rounded-2xl py-6 text-base font-semibold shadow-primary-glow animate-pulse-subtle"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              지금 시작하기
            </Button>
            <p className="text-xs text-muted-foreground mt-3">
              로그인 없이 바로 시작 · 완전 무료
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-5 pb-12">
        <div className="max-w-lg mx-auto">
          <h2 className="text-center text-subheading text-foreground mb-6 animate-fade-up" style={{ animationDelay: '0.25s' }}>
            이렇게 진행돼요
          </h2>
          <div className="space-y-3">
            {STEPS.map((step, i) => (
              <div
                key={step.title}
                className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border shadow-toss animate-fade-up"
                style={{ animationDelay: `${0.3 + i * 0.05}s` }}
              >
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center text-xl bg-gradient-to-br flex-shrink-0',
                  step.color,
                )}>
                  {step.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-primary">STEP {i + 1}</span>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{step.title}</p>
                  <p className="text-xs text-muted-foreground">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="px-5 pb-12">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-around py-5 bg-secondary/50 rounded-xl animate-fade-up" style={{ animationDelay: '0.45s' }}>
            {STATS.map((stat, i) => (
              <div key={stat.label} className="text-center">
                <p className="text-lg font-bold text-foreground">{stat.value}</p>
                <p className="text-[11px] text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-5 pb-16">
        <div className="max-w-lg mx-auto text-center animate-fade-up" style={{ animationDelay: '0.5s' }}>
          <Button
            size="lg"
            onClick={() => navigate('/honeymoon')}
            className="w-full max-w-xs rounded-2xl py-6 text-base font-semibold shadow-primary-glow"
          >
            무료로 시작하기
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-5 border-t border-border">
        <div className="max-w-lg mx-auto text-center">
          <p className="text-xs text-muted-foreground">
            허니문AI · AI 신혼여행 추천 서비스
          </p>
          <p className="text-[10px] text-muted-foreground/60 mt-1">
            © {new Date().getFullYear()} 허니문AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
