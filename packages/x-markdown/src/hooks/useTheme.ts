import { ref, watch } from 'vue'
import { useMediaQuery, useStorage } from '@vueuse/core'

/**
 * 管理深色模式主题的 Hook
 *
 * 使用 Tailwind CSS 的深色模式策略
 */
export function useTheme() {
  // 使用 vueuse 的 useMediaQuery 检测系统主题偏好
  const isDark = useMediaQuery('(prefers-color-scheme: dark)')

  // 使用 localStorage 持久化用户选择
  const userDarkModePreference = useStorage<boolean>('x-markdown-theme', false)

  // 根据系统偏好和用户选择计算当前是否为深色模式
  const isDarkMode = ref(
    userDarkModePreference.value !== undefined
      ? userDarkModePreference.value
      : isDark.value,
  )

  // 监听系统主题变化
  watch(
    isDark,
    (newVal) => {
      if (userDarkModePreference.value === undefined) {
        isDarkMode.value = newVal
      }
    },
    { immediate: true },
  )

  // 监听用户选择变化
  watch(
    userDarkModePreference,
    (newVal) => {
      if (newVal !== undefined) {
        isDarkMode.value = newVal
      }
    },
    { immediate: true },
  )

  // 切换深色模式
  function toggleDarkMode() {
    userDarkModePreference.value = !isDarkMode.value
    isDarkMode.value = !isDarkMode.value
  }

  return {
    isDarkMode,
    toggleDarkMode,
  }
}
