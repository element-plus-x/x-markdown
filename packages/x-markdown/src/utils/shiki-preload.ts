/**
 * Shiki 主题预加载
 *
 * 在应用启动时预加载常用主题，提升首次渲染速度
 */

import type { BuiltinTheme } from 'shiki'
import { shikiCache, preloadTheme } from './shiki-cache'

/**
 * 常用主题配置
 */
export interface PreloadThemeConfig {
  theme: BuiltinTheme
  langs?: string[]
  priority?: number // 加载优先级，越小越优先
}

/**
 * 默认预加载的主题列表
 */
const DEFAULT_PRELOAD_THEMES: PreloadThemeConfig[] = [
  { theme: 'github-light', langs: [], priority: 1 },
  { theme: 'github-dark', langs: [], priority: 2 },
  { theme: 'vitesse-light', langs: [], priority: 3 },
  { theme: 'vitesse-dark', langs: [], priority: 4 },
]

/**
 * 常用语言列表（用于所有主题）
 */
const COMMON_LANGS = [
  'javascript',
  'typescript',
  'tsx',
  'jsx',
  'rust',
  'python',
  'go',
  'java',
  'cpp',
  'c',
  'bash',
  'sh',
  'css',
  'html',
  'json',
  'yaml',
  'toml',
  'markdown',
  'sql',
  'php',
]

/**
 * 预加载状态
 */
let preloadStatus = {
  loading: false,
  loaded: false,
  progress: 0,
  total: 0,
  errors: [] as Error[],
}

/**
 * 预加载多个主题
 */
export async function preloadShikiThemes(
  themes: PreloadThemeConfig[] = DEFAULT_PRELOAD_THEMES,
  options?: {
    langs?: string[]
    onProgress?: (progress: number, total: number) => void
    onComplete?: () => void
    onError?: (error: Error) => void
  }
): Promise<void> {
  // 避免重复加载
  if (preloadStatus.loading) {
    console.warn('[x-markdown] Shiki preloading already in progress')
    return
  }

  preloadStatus.loading = true
  preloadStatus.loaded = false
  preloadStatus.progress = 0
  preloadStatus.total = themes.length
  preloadStatus.errors = []

  const langsToLoad = options?.langs || COMMON_LANGS

  console.log(`[x-markdown] Preloading ${themes.length} Shiki themes with ${langsToLoad.length} languages...`)

  try {
    // 按优先级排序
    const sortedThemes = [...themes].sort((a, b) => (a.priority || 0) - (b.priority || 0))

    // 并发预加载所有主题
    const loadPromises = sortedThemes.map(async (config, index) => {
      try {
        await preloadTheme(config.theme, [...langsToLoad, ...(config.langs || [])])

        preloadStatus.progress = index + 1
        options?.onProgress?.(preloadStatus.progress, preloadStatus.total)

        console.log(`[x-markdown] Preloaded theme: ${config.theme} (${index + 1}/${themes.length})`)
      } catch (error) {
        const err = error as Error
        preloadStatus.errors.push(err)
        options?.onError?.(err)
        console.error(`[x-markdown] Failed to preload theme: ${config.theme}`, err)
      }
    })

    await Promise.all(loadPromises)

    preloadStatus.loaded = true
    console.log(`[x-markdown] Shiki themes preloading completed! (${themes.length} themes, ${langsToLoad.length} languages)`)

    options?.onComplete?.()
  } finally {
    preloadStatus.loading = false
  }
}

/**
 * 快捷预加载：使用默认配置
 */
export async function preloadDefaultShikiThemes(): Promise<void> {
  return preloadShikiThemes()
}

/**
 * 获取预加载状态
 */
export function getPreloadStatus() {
  return { ...preloadStatus }
}

/**
 * 检查指定主题是否已预加载
 */
export function isThemePreloaded(theme: BuiltinTheme): boolean {
  return shikiCache.has(theme)
}

/**
 * 获取所有已预加载的主题
 */
export function getPreloadedThemes(): BuiltinTheme[] {
  return shikiCache.cachedThemes
}
