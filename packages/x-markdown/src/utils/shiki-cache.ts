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

export async function preloadTheme(theme: BuiltinTheme): Promise<void> {
  await getHighlighterCached(theme)
}

export function clearShikiCache(): void {
  shikiCache.highlighters.clear()
  shikiCache.cachedLanguages.clear()
  shikiCache.cachedThemes = []
}

export { shikiCache }
