import type { BuiltinTheme } from 'shiki'
import { getHighlighter as getShikiHighlighter } from 'shiki'
import { loadLanguage } from './shiki-lang-loader'

interface ShikiCache {
  highlighters: Map<BuiltinTheme, any>
  cachedLanguages: Set<string>
  cachedThemes: BuiltinTheme[]
}

const shikiCache: ShikiCache = {
  highlighters: new Map(),
  cachedLanguages: new Set(),
  cachedThemes: [],
}

export async function getHighlighterCached(theme: BuiltinTheme): Promise<any | null> {
  // 如果已经有该主题的 highlighter，直接返回
  if (shikiCache.highlighters.has(theme)) {
    return shikiCache.highlighters.get(theme)!
  }

  try {
    const highlighter = await getShikiHighlighter({
      themes: [theme],
      langs: [],
    })

    shikiCache.highlighters.set(theme, highlighter)
    shikiCache.cachedThemes.push(theme)

    return highlighter
  } catch (e) {
    // 只记录错误，不设置 shikiAvailable = false
    // 这样单个主题失败不会影响其他主题的使用
    console.error(`[x-markdown] Failed to create highlighter for theme ${theme}:`, e)
    return null
  }
}

export async function loadLanguageCached(
  theme: BuiltinTheme,
  lang: string
): Promise<boolean> {
  // 检查语言是否已缓存
  if (shikiCache.cachedLanguages.has(lang)) {
    return true
  }

  const highlighter = await getHighlighterCached(theme)
  if (!highlighter) {
    return false
  }

  try {
    await loadLanguage(highlighter, lang)
    shikiCache.cachedLanguages.add(lang)
    return true
  } catch {
    return false
  }
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
  private highlighterCache = new Map<BuiltinTheme, any>()
  private initializingCache = new Map<BuiltinTheme, Promise<any | null>>()

  async getHighlighter(theme: BuiltinTheme): Promise<any | null> {
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

  private async createHighlighter(theme: BuiltinTheme): Promise<any | null> {
    try {
      const { getSingletonHighlighter } = await import('shiki')
      return await getSingletonHighlighter({ langs: [], themes: [theme] })
    } catch (e) {
      console.error(`[x-markdown] Failed to create highlighter for theme ${theme}:`, e)
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

  async preload(theme: BuiltinTheme): Promise<any | null> {
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
  }
}

const shikiCache = new ShikiCacheManager()

export async function preloadTheme(theme: BuiltinTheme): Promise<any | null> {
  return shikiCache.preload(theme)
}

export function clearShikiCache(): void {
  shikiCache.clearAll()
}

export { shikiCache }
