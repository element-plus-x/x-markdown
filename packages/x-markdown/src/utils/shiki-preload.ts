import type { BuiltinTheme } from 'shiki'
import { shikiCache, preloadTheme } from './shiki-cache'

export interface PreloadThemeConfig {
  theme: BuiltinTheme
  langs?: string[]
  priority?: number
}

const DEFAULT_PRELOAD_THEMES: PreloadThemeConfig[] = [
  { theme: 'github-light', langs: [], priority: 1 },
  { theme: 'github-dark', langs: [], priority: 2 },
  { theme: 'vitesse-light', langs: [], priority: 3 },
  { theme: 'vitesse-dark', langs: [], priority: 4 },
]

let preloadStatus = {
  loading: false,
  loaded: false,
  progress: 0,
  total: 0,
  errors: [] as Error[],
}

export async function preloadShikiThemes(
  themes: PreloadThemeConfig[] = DEFAULT_PRELOAD_THEMES,
  options?: {
    langs?: string[]
    onProgress?: (progress: number, total: number) => void
    onComplete?: () => void
    onError?: (error: Error) => void
  }
): Promise<void> {
  if (preloadStatus.loading) {
    return
  }

  preloadStatus.loading = true
  preloadStatus.loaded = false
  preloadStatus.progress = 0
  preloadStatus.total = themes.length
  preloadStatus.errors = []

  try {
    const sortedThemes = [...themes].sort((a, b) => (a.priority || 0) - (b.priority || 0))

    // 使用原子计数器来跟踪实际完成的数量，避免并发导致的进度混乱
    let completed = 0

    const loadPromises = sortedThemes.map(async (config) => {
      try {
        await preloadTheme(config.theme)

        // 原子地增加已完成计数
        completed++
        preloadStatus.progress = completed
        options?.onProgress?.(preloadStatus.progress, preloadStatus.total)
      } catch (error) {
        const err = error as Error
        preloadStatus.errors.push(err)
        options?.onError?.(err)

        // 即使失败也增加计数，确保进度能正确推进
        completed++
        preloadStatus.progress = completed
      }
    })

    await Promise.all(loadPromises)

    preloadStatus.loaded = true

    options?.onComplete?.()
  } finally {
    preloadStatus.loading = false
  }
}

export async function preloadDefaultShikiThemes(): Promise<void> {
  return preloadShikiThemes()
}

export function getPreloadStatus() {
  return { ...preloadStatus }
}

export function isThemePreloaded(theme: BuiltinTheme): boolean {
  return shikiCache.cachedThemes.includes(theme)
}

export function getPreloadedThemes(): BuiltinTheme[] {
  return shikiCache.cachedThemes
}
