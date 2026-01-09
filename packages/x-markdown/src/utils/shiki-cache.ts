/**
 * Shiki Highlighter 缓存管理
 *
 * 使用 getSingletonHighlighter 支持动态语言加载
 * 按主题缓存 highlighter 实例，避免重复初始化
 */

import type { BuiltinTheme } from 'shiki'

export type CachedHighlighter = Awaited<ReturnType<typeof import('shiki').getSingletonHighlighter>>

let shikiAvailable: boolean | null = null

export async function isShikiAvailable(): Promise<boolean> {
  if (shikiAvailable !== null) return shikiAvailable

  try {
    const shiki = await import('shiki')
    if (typeof shiki.getSingletonHighlighter === 'function') {
      shikiAvailable = true
      return true
    }
  } catch {
    // Shiki 不可用
  }

  shikiAvailable = false
  return false
}

const HTML_ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
} as const

export function fallbackCodeHtml(code: string, lang: string): string {
  const escaped = code.replace(/[&<>"']/g, (char) => HTML_ESCAPE_MAP[char as keyof typeof HTML_ESCAPE_MAP])
  return `<pre class="shiki-fallback language-${lang}"><code>${escaped}</code></pre>`
}

class ShikiCacheManager {
  private highlighterCache = new Map<BuiltinTheme, CachedHighlighter>()
  private initializingCache = new Map<BuiltinTheme, Promise<CachedHighlighter | null>>()

  async getHighlighter(theme: BuiltinTheme): Promise<CachedHighlighter | null> {
    if (!(await isShikiAvailable())) return null

    const cached = this.highlighterCache.get(theme)
    if (cached) return cached

    const initializing = this.initializingCache.get(theme)
    if (initializing) return initializing

    const initPromise = this.createHighlighter(theme)
    this.initializingCache.set(theme, initPromise)

    try {
      const highlighter = await initPromise
      if (highlighter) this.highlighterCache.set(theme, highlighter)
      return highlighter
    } finally {
      this.initializingCache.delete(theme)
    }
  }

  private async createHighlighter(theme: BuiltinTheme): Promise<CachedHighlighter | null> {
    try {
      const { getSingletonHighlighter } = await import('shiki')
      return await getSingletonHighlighter({ langs: [], themes: [theme] })
    } catch {
      shikiAvailable = false
      return null
    }
  }

  async loadLanguage(theme: BuiltinTheme, lang: string): Promise<boolean> {
    const highlighter = await this.getHighlighter(theme)
    if (!highlighter) return false

    try {
      await highlighter.loadLanguage(lang as any)
      return true
    } catch {
      return false
    }
  }

  async preload(theme: BuiltinTheme): Promise<CachedHighlighter | null> {
    return this.getHighlighter(theme)
  }

  get isReady(): boolean {
    return this.highlighterCache.size > 0
  }

  get cachedThemes(): BuiltinTheme[] {
    return Array.from(this.highlighterCache.keys())
  }

  get cacheSize(): number {
    return this.highlighterCache.size
  }

  clearAll(): void {
    for (const [, highlighter] of this.highlighterCache.entries()) {
      try {
        if (typeof (highlighter as any).dispose === 'function') {
          (highlighter as any).dispose()
        }
      } catch {
        // ignore
      }
    }
    this.highlighterCache.clear()
    this.initializingCache.clear()
    shikiAvailable = null
  }
}

export const shikiCache = new ShikiCacheManager()

export async function getHighlighterCached(theme: BuiltinTheme): Promise<CachedHighlighter | null> {
  return shikiCache.getHighlighter(theme)
}

export async function loadLanguageCached(theme: BuiltinTheme, lang: string): Promise<boolean> {
  return shikiCache.loadLanguage(theme, lang)
}

export async function preloadTheme(theme: BuiltinTheme): Promise<CachedHighlighter | null> {
  return shikiCache.preload(theme)
}

export function clearShikiCache(_theme?: BuiltinTheme): void {
  shikiCache.clearAll()
}
