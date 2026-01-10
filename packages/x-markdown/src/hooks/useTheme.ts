import { computed, isRef, ref, type Ref } from 'vue'

export type ThemeMode = 'light' | 'dark' | 'auto'
export type ShikiThemeName = string // Shiki 主题名称（字符串类型，支持动态导入）

// 内置主题映射
export const themeMap = {
  light: 'vitesse-light',
  dark: 'vitesse-dark',
} as const

export interface UseThemeOptions {
  mode?: ThemeMode | Ref<ThemeMode>
  theme?: ShikiThemeName | Ref<ShikiThemeName | undefined>
  lightTheme?: ShikiThemeName
  darkTheme?: ShikiThemeName
}

export interface UseThemeReturn {
  mode: Ref<ThemeMode>
  isDark: Ref<boolean>
  actualTheme: Ref<ShikiThemeName>
  setMode: (mode: ThemeMode) => void
  toggleMode: () => void
}

/**
 * 主题管理 Hook
 * 支持 light/dark/auto 模式切换
 */
export function useTheme(options: UseThemeOptions = {}): UseThemeReturn {
  const { lightTheme = themeMap.light, darkTheme = themeMap.dark } = options

  // 内部 mode（用于 setMode/toggleMode 修改）
  const internalMode = ref<ThemeMode>(isRef(options.mode) ? options.mode.value : options.mode || 'auto')

  // 实际使用的 mode（优先使用外部传入的响应式值）
  const mode = computed<ThemeMode>({
    get: () => (isRef(options.mode) ? options.mode.value : internalMode.value),
    set: (val) => {
      internalMode.value = val
    },
  })

  // 系统是否为暗色模式
  const systemIsDark = ref(false)

  // 监听系统主题变化
  if (typeof window !== 'undefined') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    systemIsDark.value = mediaQuery.matches

    mediaQuery.addEventListener('change', (e) => {
      systemIsDark.value = e.matches
    })
  }

  // 当前是否为暗色模式
  const isDark = computed(() => {
    if (mode.value === 'auto') {
      return systemIsDark.value
    }
    return mode.value === 'dark'
  })

  // 实际使用的 Shiki 主题
  const actualTheme = computed<ShikiThemeName>(() => {
    // 如果传入了具体的 theme，优先使用
    const customTheme = isRef(options.theme) ? options.theme.value : options.theme
    if (customTheme) return customTheme

    return isDark.value ? darkTheme : lightTheme
  })

  // 设置模式
  const setMode = (newMode: ThemeMode) => {
    internalMode.value = newMode
  }

  // 切换模式 (light -> dark -> auto -> light)
  const toggleMode = () => {
    const modes: ThemeMode[] = ['light', 'dark', 'auto']
    const currentIndex = modes.indexOf(mode.value)
    internalMode.value = modes[(currentIndex + 1) % modes.length]
  }

  return {
    mode,
    isDark,
    actualTheme,
    setMode,
    toggleMode,
  }
}
