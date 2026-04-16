import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// [CL-HOME-URL-20260416-140000] 외부 홈 URL (WedSem 메인 사이트)
export const HOME_URL = 'http://wedsem.moderninsightspot.com';

export function goHome() {
  window.location.href = HOME_URL;
}
