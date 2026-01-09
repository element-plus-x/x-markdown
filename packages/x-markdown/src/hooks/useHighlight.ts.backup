import { ref, watch, onUnmounted, computed, isRef, toValue, type Ref, type MaybeRef, type CSSProperties } from 'vue'
import type { BuiltinTheme, ThemedToken } from 'shiki'
import { ShikiStreamTokenizer, ShikiStreamTokenizerOptions } from 'shiki-stream'
import type { getSingletonHighlighter } from 'shiki'

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
}

let shikiModulePromise: Promise<typeof import('shiki') | null> | null = null

const loadShiki = () => {
  if (!shikiModulePromise) {
    shikiModulePromise = import('shiki').catch(() => null)
  }
  return shikiModulePromise
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
  // Shiki 高亮器实例
  let highlighter: Awaited<ReturnType<typeof getSingletonHighlighter>> | null = null
  // 当前实际使用的语言（可能是 fallback 后的 plaintext）
  let currentUsedLang = ''
  // 上次请求的语言（用于检测语言变化后是否需要重试）
  let lastRequestedLang = ''

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

  // 初始化高亮器
  const initHighlighter = async () => {
    isLoading.value = true
    error.value = null

    let currentLang = effectiveLanguage.value
    const currentTheme = effectiveTheme.value

    try {
      const mod = await loadShiki()
      if (!mod) {
        throw new Error('Failed to load shiki module')
      }

      // 获取单例高亮器（先不加载语言）
      highlighter = await mod.getSingletonHighlighter({
        langs: [],
        themes: [currentTheme],
      })

      // 记录本次请求的语言
      lastRequestedLang = currentLang

      // 尝试加载指定语言，如果失败则回退到 plaintext
      try {
        await highlighter.loadLanguage(currentLang as any)
        currentUsedLang = currentLang
      } catch {
        console.warn(`Failed to load language: ${currentLang}, falling back to plaintext`)
        currentLang = 'plaintext'
        currentUsedLang = 'plaintext'
        // plaintext 是内置的，不需要额外加载
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
    async ([newLang]) => {
      const requestedLang = newLang as string

      // 如果语言变化了，且当前使用的是 plaintext（fallback），尝试重新加载新语言
      if (
        highlighter &&
        currentUsedLang === 'plaintext' &&
        requestedLang !== lastRequestedLang &&
        requestedLang !== 'plaintext'
      ) {
        try {
          await highlighter.loadLanguage(requestedLang as any)
          // 语言加载成功，重新初始化以使用正确的语言
          console.log(`Language ${requestedLang} loaded successfully, re-highlighting`)
          initHighlighter()
          return
        } catch {
          // 新语言仍然加载失败，保持 plaintext
          lastRequestedLang = requestedLang
          return
        }
      }

      initHighlighter()
    },
    { immediate: true },
  )

  // 监听文本变化，增量更新高亮
  watch(text, async (newText) => {
    // 检查语言是否已经变得有效（流式输出中语言可能从 typ 变成 typescript）
    const requestedLang = effectiveLanguage.value
    if (
      highlighter &&
      currentUsedLang === 'plaintext' &&
      requestedLang !== lastRequestedLang &&
      requestedLang !== 'plaintext'
    ) {
      try {
        await highlighter.loadLanguage(requestedLang as any)
        // 语言加载成功，重新初始化
        console.log(`Language ${requestedLang} now available, re-highlighting`)
        await initHighlighter()
        return
      } catch {
        // 语言仍然无效，继续使用 plaintext
        lastRequestedLang = requestedLang
      }
    }

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
