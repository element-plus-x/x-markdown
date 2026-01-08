/**
 * Shiki Highlighter 缓存管理
 *
 * 用于缓存 Shiki Highlighter 实例，避免重复初始化开销
 */

import type { BuiltinTheme, Highlighter } from 'shiki'
import type { getSingletonHighlighter } from 'shiki'

/**
 * 缓存的 Highlighter 实例类型
 */
export type CachedHighlighter = Awaited<ReturnType<typeof getSingletonHighlighter>>

/**
 * Shiki 缓存管理器
 */
class ShikiCacheManager {
  private cache = new Map<BuiltinTheme, CachedHighlighter>()
  private themeLangsCache = new Map<string, Set<string>>()

  /**
   * 获取或创建 Highlighter 实例（带缓存）
   */
  async getHighlighter(
    theme: BuiltinTheme,
    langs: string[] = []
  ): Promise<CachedHighlighter> {
    // 检查缓存
    if (this.cache.has(theme)) {
      const highlighter = this.cache.get(theme)!
      const cachedLangs = this.themeLangsCache.get(theme) || new Set()

      // 检查是否需要加载新语言
      const newLangs = langs.filter(lang => !cachedLangs.has(lang))
      if (newLangs.length > 0) {
        await highlighter.loadLanguage(newLangs as any)
        newLangs.forEach(lang => cachedLangs.add(lang))
        this.themeLangsCache.set(theme, cachedLangs)
      }

      return highlighter
    }

    // 创建新实例
    const shiki = await import('shiki')
    const highlighter = await shiki.getSingletonHighlighter({
      themes: [theme],
      langs: [],
    })

    // 加载语言
    if (langs.length > 0) {
      await highlighter.loadLanguage(langs as any)
      const langSet = new Set(langs)
      this.themeLangsCache.set(theme, langSet)
    }

    // 缓存实例
    this.cache.set(theme, highlighter)

    return highlighter
  }

  /**
   * 预加载指定主题的 Highlighter
   */
  async preload(theme: BuiltinTheme, langs: string[] = []): Promise<CachedHighlighter> {
    return this.getHighlighter(theme, langs)
  }

  /**
   * 检查主题是否已缓存
   */
  has(theme: BuiltinTheme): boolean {
    return this.cache.has(theme)
  }

  /**
   * 清除指定主题的缓存
   */
  clear(theme: BuiltinTheme): void {
    this.cache.delete(theme)
    this.themeLangsCache.delete(theme)
  }

  /**
   * 清除所有缓存
   */
  clearAll(): void {
    this.cache.clear()
    this.themeLangsCache.clear()
  }

  /**
   * 获取缓存大小
   */
  get size(): number {
    return this.cache.size
  }

  /**
   * 获取所有已缓存的主题
   */
  get cachedThemes(): BuiltinTheme[] {
    return Array.from(this.cache.keys())
  }
}

/**
 * 导出单例实例
 */
export const shikiCache = new ShikiCacheManager()

/**
 * 便捷函数：获取缓存的 Highlighter
 */
export async function getHighlighterCached(
  theme: BuiltinTheme,
  langs?: string[]
): Promise<CachedHighlighter> {
  return shikiCache.getHighlighter(theme, langs)
}

/**
 * 便捷函数：预加载主题
 */
export async function preloadTheme(
  theme: BuiltinTheme,
  langs?: string[]
): Promise<CachedHighlighter> {
  return shikiCache.preload(theme, langs)
}

/**
 * 便捷函数：清除缓存
 */
export function clearShikiCache(theme?: BuiltinTheme): void {
  if (theme) {
    shikiCache.clear(theme)
  } else {
    shikiCache.clearAll()
  }
}
