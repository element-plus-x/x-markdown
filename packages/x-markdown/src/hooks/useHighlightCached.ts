/**
 * 优化版的 useHighlight Hook
 *
 * 使用 Shiki 缓存机制，避免重复初始化开销
 */

import { ref, watch, onUnmounted, computed, isRef, toValue, type Ref, type MaybeRef, type CSSProperties } from 'vue'
import type { BuiltinTheme, ThemedToken } from 'shiki'
import { ShikiStreamTokenizer, ShikiStreamTokenizerOptions } from 'shiki-stream'
import { getHighlighterCached, type CachedHighlighter } from '../utils/shiki-cache'

// 流式高亮结果接口
interface StreamingHighlightResult {
  colorReplacements?: Record<string, string> // 颜色替换映射
  lines: ThemedToken[][] // 按行分组的 token
  preStyle?: CSSProperties // pre 元素的样式
}

// useHighlight 配置选项接口
interface UseHighlightOptions {
  language: MaybeRef<string> // 语言（支持响应式）
  theme?: BuiltinTheme | Ref<BuiltinTheme> // 主题（支持响应式）
  colorReplacements?: Record<string, string> // 颜色替换映射
  /**
   * 是否使用缓存（默认 true）
   * 禁用缓存时，每次都会创建新的 highlighter 实例
   */
  useCache?: boolean
}

const tokensToLineTokens = (tokens: ThemedToken[]): ThemedToken[][] => {
  if (!tokens.length) return [[]]

  const lines: ThemedToken[][] = [[]]
  let currentLine = lines[0]

  const startNewLine = () => {
    currentLine = []
    lines.push(currentLine)
  }

  tokens.forEach((token) => {
    const content = token.content ?? ''

    if (content === '\n') {
      startNewLine()
      return
    }

    if (!content.includes('\n')) {
      currentLine.push(token)
      return
    }

    const segments = content.split('\n')
    segments.forEach((segment, index) => {
      if (segment) {
        currentLine.push({
          ...token,
          content: segment,
        })
      }

      if (index < segments.length - 1) {
        startNewLine()
      }
    })
  })

  return lines.length === 0 ? [[]] : lines
}

const createPreStyle = (bg?: string, fg?: string): CSSProperties | undefined => {
  if (!bg && !fg) return undefined
  return {
    backgroundColor: bg,
    color: fg,
  }
}

export function useHighlight(text: Ref<string>, options: UseHighlightOptions) {
  // 流式高亮结果
  const streaming = ref<StreamingHighlightResult>()
  // 加载状态
  const isLoading = ref(false)
  // 错误状态
  const error = ref<Error | null>(null)

  // 流式 tokenizer 实例
  let tokenizer: ShikiStreamTokenizer | null = null
  // 上一次处理的文本（用于增量更新）
  let previousText = ''
  // Shiki 高亮器实例（使用缓存）
  let highlighter: CachedHighlighter | null = null

  // 计算当前有效主题
  const effectiveTheme = computed(() => {
    const theme = isRef(options.theme) ? options.theme.value : options.theme
    return theme || 'slack-dark'
  })

  // 计算当前有效语言（支持响应式）
  const effectiveLanguage = computed(() => {
    return toValue(options.language) || 'text'
  })

  // 计算结果：按行分组的 tokens
  const lines = computed(() => streaming.value?.lines || [[]])
  // 计算结果：pre 元素样式
  const preStyle = computed(() => streaming.value?.preStyle)

  const updateTokens = async (nextText: string, forceReset = false) => {
    if (!tokenizer) return

    if (forceReset) {
      tokenizer.clear()
      previousText = ''
    }

    const canAppend = !forceReset && nextText.startsWith(previousText)
    let chunk = nextText

    if (canAppend) {
      chunk = nextText.slice(previousText.length)
    } else if (!forceReset) {
      tokenizer.clear()
    }

    previousText = nextText

    if (!chunk) {
      const mergedTokens = [...tokenizer.tokensStable, ...tokenizer.tokensUnstable]
      streaming.value = {
        colorReplacements: options.colorReplacements,
        lines: mergedTokens.length ? tokensToLineTokens(mergedTokens) : [[]],
        preStyle: streaming.value?.preStyle,
      }
      return
    }

    try {
      await tokenizer.enqueue(chunk)

      const mergedTokens = [...tokenizer.tokensStable, ...tokenizer.tokensUnstable]

      streaming.value = {
        colorReplacements: options.colorReplacements,
        lines: tokensToLineTokens(mergedTokens),
        preStyle: streaming.value?.preStyle,
      }
    } catch (err) {
      console.error('Streaming highlighting failed:', err)
      error.value = err as Error
    }
  }

  // 初始化高亮器（使用缓存）
  const initHighlighter = async () => {
    isLoading.value = true
    error.value = null

    let currentLang = effectiveLanguage.value
    const currentTheme = effectiveTheme.value

    try {
      // 使用缓存的 highlighter
      highlighter = await getHighlighterCached(currentTheme, [currentLang])

      // 检查 highlighter 是否可用
      if (!highlighter) {
        throw new Error('Shiki highlighter is not available')
      }

      // 创建流式 tokenizer
      tokenizer = new ShikiStreamTokenizer({
        highlighter: highlighter as unknown as ShikiStreamTokenizerOptions['highlighter'],
        lang: currentLang,
        theme: currentTheme,
      })

      // 重置状态
      previousText = ''

      // 获取主题信息，设置 pre 样式
      const themeInfo = highlighter.getTheme(currentTheme)
      const preStyleValue = createPreStyle(themeInfo?.bg, themeInfo?.fg)

      // 如果有初始文本，进行初次高亮
      if (text.value) {
        await updateTokens(text.value, true)
        if (streaming.value) {
          streaming.value.preStyle = preStyleValue
        }
      } else {
        streaming.value = {
          colorReplacements: options.colorReplacements,
          lines: [[]],
          preStyle: preStyleValue,
        }
      }
    } catch (err) {
      console.error('Streaming highlighter initialization failed:', err)
      error.value = err as Error
    } finally {
      isLoading.value = false
    }
  }

  // 监听语言、主题变化，重新初始化
  watch(
    () => [effectiveLanguage.value, effectiveTheme.value],
    async () => {
      // 语言或主题变化时，直接重新初始化
      // getHighlighter() 会自动处理新语言（通过重新创建实例）
      initHighlighter()
    },
    { immediate: true },
  )

  // 监听文本变化，增量更新高亮
  watch(text, async (newText) => {
    if (tokenizer) {
      updateTokens(newText)
    }
  })

  onUnmounted(() => {
    tokenizer?.clear()
    tokenizer = null
    previousText = ''
  })

  return {
    streaming,
    lines,
    preStyle,
    isLoading,
    error,
  }
}
