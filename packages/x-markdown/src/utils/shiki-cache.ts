/**
 * Shiki Highlighter 缓存管理
 *
 * 用于缓存 Shiki Highlighter 实例，避免重复初始化开销
 * 使用官方推荐的 createHighlighter 方式
 * 支持 shiki 作为可选依赖，当不可用时提供降级方案
 */

import type { BuiltinTheme } from 'shiki'

/**
 * 缓存的 Highlighter 实例类型（使用官方的 createHighlighter 返回类型）
 */
export type CachedHighlighter = Awaited<ReturnType<typeof import('shiki').createHighlighter>>

/**
 * Shiki 可用性状态
 */
let shikiAvailable: boolean | null = null

/**
 * 检测 Shiki 是否可用
 */
export async function isShikiAvailable(): Promise<boolean> {
  if (shikiAvailable !== null) {
    return shikiAvailable
  }

  // 使用动态导入检查 shiki 是否可用
  try {
    console.log('[x-markdown] Checking shiki module...')

    const shiki = await import('shiki')

    // 检查 createHighlighter 是否存在
    if (typeof shiki.createHighlighter === 'function') {
      console.log('[x-markdown] Shiki is available')
      shikiAvailable = true
      return true
    }
  } catch (e) {
    console.error('[x-markdown] Error checking shiki availability:', e)
  }

  console.warn('[x-markdown] Shiki not available, code highlighting disabled. Install shiki to enable code highlighting.')
  shikiAvailable = false
  return false
}

/**
 * 生成降级的代码 HTML（无高亮）
 */
export function fallbackCodeHtml(code: string, lang: string): string {
  const escaped = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

  return `<pre class="shiki-fallback language-${lang}"><code>${escaped}</code></pre>`
}

/**
 * Shiki 缓存管理器
 *
 * 按主题+语言组合缓存多个 highlighter 实例
 * 支持动态加载多个主题和语言
 */
class ShikiCacheManager {
  // 缓存多个 highlighter 实例，key 为 "theme:lang1,lang2,lang3"
  private highlighterCache = new Map<string, CachedHighlighter>()
  // 正在初始化的实例
  private initializingCache = new Map<string, Promise<CachedHighlighter | null>>()

  /**
   * 生成缓存 key
   */
  private getCacheKey(theme: BuiltinTheme, langs: string[]): string {
    const sortedLangs = [...langs].sort().join(',')
    return `${theme}:${sortedLangs}`
  }

  /**
   * 获取 Highlighter 实例（带缓存）
   * 如果 shiki 不可用，返回 null
   *
   * 相同的主题+语言组合会复用已缓存的实例
   * 不同的语言组合会创建新的实例并缓存
   */
  async getHighlighter(
    theme: BuiltinTheme,
    langs: string[] = []
  ): Promise<CachedHighlighter | null> {
    // 检查 shiki 是否可用
    if (!(await isShikiAvailable())) {
      return null
    }

    // 规范化语言列表
    const normalizedLangs = langs.length > 0 ? langs : ['plaintext']
    const cacheKey = this.getCacheKey(theme, normalizedLangs)

    // 如果已有缓存的实例，直接返回
    const cached = this.highlighterCache.get(cacheKey)
    if (cached) {
      return cached
    }

    // 如果正在初始化，等待初始化完成
    const initializing = this.initializingCache.get(cacheKey)
    if (initializing) {
      return initializing
    }

    // 创建新实例
    const initPromise = this.createHighlighter(theme, normalizedLangs)
    this.initializingCache.set(cacheKey, initPromise)

    try {
      const highlighter = await initPromise
      if (highlighter) {
        this.highlighterCache.set(cacheKey, highlighter)
      }
      return highlighter
    } finally {
      this.initializingCache.delete(cacheKey)
    }
  }

  /**
   * 创建 highlighter 实例（私有方法）
   */
  private async createHighlighter(
    theme: BuiltinTheme,
    langs: string[]
  ): Promise<CachedHighlighter | null> {
    try {
      const { createHighlighter } = await import('shiki')

      // 使用 createHighlighter 创建实例
      // Shiki 会自动处理语言名称，不需要手动映射
      const highlighter = await createHighlighter({
        themes: [theme],
        langs: langs as any,
      })

      console.log(`[x-markdown] Shiki highlighter instance created (theme: ${theme}, langs: ${langs.join(', ')})`)

      return highlighter
    } catch (e) {
      console.error('[x-markdown] Failed to initialize Shiki highlighter:', e)
      shikiAvailable = false
      return null
    }
  }

  /**
   * 预加载指定主题和语言
   */
  async preload(theme: BuiltinTheme, langs: string[] = []): Promise<CachedHighlighter | null> {
    return this.getHighlighter(theme, langs)
  }

  /**
   * 检查是否有任何 highlighter 实例已初始化
   */
  get isReady(): boolean {
    return this.highlighterCache.size > 0
  }

  /**
   * 获取已缓存的主题列表
   */
  get cachedThemes(): BuiltinTheme[] {
    const themes = new Set<BuiltinTheme>()
    for (const key of this.highlighterCache.keys()) {
      const theme = key.split(':')[0] as BuiltinTheme
      themes.add(theme)
    }
    return Array.from(themes)
  }

  /**
   * 获取已缓存的语言列表（所有实例的语言并集）
   */
  get cachedLangs(): string[] {
    const langs = new Set<string>()
    for (const key of this.highlighterCache.keys()) {
      const langsStr = key.split(':')[1]
      if (langsStr) {
        langsStr.split(',').forEach(lang => langs.add(lang))
      }
    }
    return Array.from(langs)
  }

  /**
   * 获取缓存实例数量
   */
  get cacheSize(): number {
    return this.highlighterCache.size
  }

  /**
   * 清除所有缓存
   */
  clearAll(): void {
    // 释放所有 highlighter 实例
    for (const [key, highlighter] of this.highlighterCache.entries()) {
      try {
        // 尝试释放资源（如果 Shiki 提供了 dispose 方法）
        if (typeof (highlighter as any).dispose === 'function') {
          ;(highlighter as any).dispose()
        }
      } catch (e) {
        console.warn(`[x-markdown] Failed to dispose highlighter for ${key}:`, e)
      }
    }

    this.highlighterCache.clear()
    this.initializingCache.clear()
    shikiAvailable = null // 重新检查可用性
    console.log('[x-markdown] Shiki cache cleared')
  }
}

/**
 * 导出单例实例
 */
export const shikiCache = new ShikiCacheManager()

/**
 * 便捷函数：获取缓存的 Highlighter
 * 如果 shiki 不可用，返回 null
 */
export async function getHighlighterCached(
  theme: BuiltinTheme,
  langs?: string[]
): Promise<CachedHighlighter | null> {
  return shikiCache.getHighlighter(theme, langs)
}

/**
 * 便捷函数：预加载主题
 */
export async function preloadTheme(
  theme: BuiltinTheme,
  langs?: string[]
): Promise<CachedHighlighter | null> {
  return shikiCache.preload(theme, langs)
}

/**
 * 便捷函数：清除缓存
 * @param _theme 已废弃参数，为了向后兼容保留（使用下划线前缀避免未使用警告）
 */
export function clearShikiCache(_theme?: BuiltinTheme): void {
  // 单例模式下，清除所有缓存
  shikiCache.clearAll()
}
