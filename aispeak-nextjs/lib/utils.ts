import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export function generateFingerprint(): string {
  // 生成简单的设备指纹
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  ctx?.fillText('Device fingerprint', 10, 10)
  const canvasFingerprint = canvas.toDataURL()
  
  const screenFingerprint = `${screen.width}x${screen.height}x${screen.colorDepth}`
  const timezoneFingerprint = Intl.DateTimeFormat().resolvedOptions().timeZone
  const languageFingerprint = navigator.language
  
  const combined = `${canvasFingerprint}|${screenFingerprint}|${timezoneFingerprint}|${languageFingerprint}`
  
  // 简单hash
  let hash = 0
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  
  return Math.abs(hash).toString(36)
} 