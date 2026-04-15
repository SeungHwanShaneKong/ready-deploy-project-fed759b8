import { useEffect } from 'react';

interface SEOConfig {
  title: string;
  description?: string;
  path?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

const BASE_DOMAIN = 'https://honeymoon-ai.moderninsightspot.com';
const DEFAULT_TITLE = '허니문AI - AI 신혼여행 추천 서비스';
const DEFAULT_DESCRIPTION =
  '이미지 월드컵으로 취향을 분석하고, AI가 맞춤 신혼여행지 5곳을 추천해드려요. 레이더 차트 비교, 일정 만들기까지.';

const JSON_LD_ID = 'dynamic-jsonld';

export function useSEO({ title, description, path, jsonLd }: SEOConfig) {
  useEffect(() => {
    // Capture previous values for full cleanup on unmount
    const prevTitle = document.title;
    const metaDesc = document.querySelector('meta[name="description"]');
    const prevDesc = metaDesc?.getAttribute('content') ?? '';
    const canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    const prevCanonical = canonical?.href ?? '';
    const ogUrl = document.querySelector('meta[property="og:url"]');
    const prevOgUrl = ogUrl?.getAttribute('content') ?? '';
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const prevOgTitle = ogTitle?.getAttribute('content') ?? '';
    const ogDesc = document.querySelector('meta[property="og:description"]');
    const prevOgDesc = ogDesc?.getAttribute('content') ?? '';
    const twTitle = document.querySelector('meta[name="twitter:title"]');
    const prevTwTitle = twTitle?.getAttribute('content') ?? '';
    const twDesc = document.querySelector('meta[name="twitter:description"]');
    const prevTwDesc = twDesc?.getAttribute('content') ?? '';

    // Update document title
    document.title = title || DEFAULT_TITLE;

    // Update meta description
    if (metaDesc) {
      metaDesc.setAttribute('content', description || DEFAULT_DESCRIPTION);
    }

    // Update canonical URL
    if (canonical && path !== undefined) {
      canonical.href = `${BASE_DOMAIN}${path}`;
    }

    // Update og:url
    if (ogUrl && path !== undefined) {
      ogUrl.setAttribute('content', `${BASE_DOMAIN}${path}`);
    }

    // Update og:title
    if (ogTitle) {
      ogTitle.setAttribute('content', title || DEFAULT_TITLE);
    }

    // Update og:description
    if (ogDesc) {
      ogDesc.setAttribute('content', description || DEFAULT_DESCRIPTION);
    }

    // Update twitter:title
    if (twTitle) {
      twTitle.setAttribute('content', title || DEFAULT_TITLE);
    }

    // Update twitter:description
    if (twDesc) {
      twDesc.setAttribute('content', description || DEFAULT_DESCRIPTION);
    }

    // Dynamic JSON-LD structured data injection
    const existingScript = document.getElementById(JSON_LD_ID);
    if (existingScript) {
      existingScript.remove();
    }

    if (jsonLd) {
      const script = document.createElement('script');
      script.id = JSON_LD_ID;
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }

    // Cleanup: restore ALL previous values + remove dynamic JSON-LD on unmount
    return () => {
      document.title = prevTitle;
      if (metaDesc) metaDesc.setAttribute('content', prevDesc);
      if (canonical) canonical.href = prevCanonical;
      if (ogUrl) ogUrl.setAttribute('content', prevOgUrl);
      if (ogTitle) ogTitle.setAttribute('content', prevOgTitle);
      if (ogDesc) ogDesc.setAttribute('content', prevOgDesc);
      if (twTitle) twTitle.setAttribute('content', prevTwTitle);
      if (twDesc) twDesc.setAttribute('content', prevTwDesc);
      const scriptToRemove = document.getElementById(JSON_LD_ID);
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [title, description, path, jsonLd]);
}
