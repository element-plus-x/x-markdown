import { computed, nextTick, ref, watch, onUnmounted, type Ref, type MaybeRef, type CSSProperties } from 'vue'

// 获取是否启用控制台提示的辅助函数
const consoleHintsEnabled = () => {
  if (typeof __X_MARKDOWN_CONSOLE_HINTS_ENABLED__ === 'boolean') {
    return __X_MARKDOWN_CONSOLE_HINTS_ENABLED__
  }
  return true // 默认启用
}

interface HighlightToken {
  content?: string
  color?: string
  fontStyle?: 'italic' | null
  fontWeight?: 'normal' | 'bold' | null
  htmlStyle?: Record<string, string>
}

interface StreamingHighlightResult {
  colorReplacements?: Record<string, string>
  lines: HighlightToken[][]
  preStyle?: CSSProperties
}

interface UseHighlightOptions {
  language: MaybeRef<string>
  theme?: string | Ref<string>
  colorReplacements?: Record<string, string>
}

let shikiModulePromise: Promise<any | null> | null = null
let shikiStreamModulePromise: Promise<any | null> | null = null
let hasShownShikiHint = false
let hasShownShikiStreamHint = false

// 全局 highlighter 缓存，避免重复创建实例
const highlighterCache = new Map<string, any>()
const getHighlighterCacheKey = (theme: string) => `highlighter-${theme}`


const showShikiHint = () => {
  if (hasShownShikiHint) return
  if (!consoleHintsEnabled()) return

  hasShownShikiHint = true

  console.log(
    '%c[x-markdown]%c 需安装 shiki: %cpnpm add shiki%c',
    'font-weight: bold; color: #0066cc;',
    'color: #666;',
    'color: #00aa00; font-family: monospace;',
    'color: #999;'
  )
}

const showShikiStreamHint = () => {
  if (hasShownShikiStreamHint) return
  if (!consoleHintsEnabled()) return

  hasShownShikiStreamHint = true

  console.log(
    '%c[x-markdown]%c AI 流式可选: %cpnpm add shiki-stream%c (需先装 shiki)',
    'font-weight: bold; color: #0066cc;',
    'color: #666;',
    'color: #00aa00; font-family: monospace;',
    'color: #999;'
  )
}

const loadShiki = async () => {
  if (!shikiModulePromise) {
    shikiModulePromise = (async () => {
      try {
        const mod = await import('shiki')
        // 检查是否是虚拟模块（虚拟模块返回 { default: null }）
        if (mod && (mod as any).default === null) {
          return null
        }
        return mod
      } catch {
        // 静默失败，返回 null
        return null
      }
    })()
  }
  return shikiModulePromise
}

const loadShikiStream = async () => {
  if (!shikiStreamModulePromise) {
    shikiStreamModulePromise = (async () => {
      try {
        const mod = await import('shiki-stream')
        // 检查是否是虚拟模块（虚拟模块返回 { default: null }）
        if (mod && (mod as any).default === null) {
          return null
        }
        return mod
      } catch {
        // 静默失败，返回 null
        return null
      }
    })()
  }
  return shikiStreamModulePromise
}

const tokensToLineTokens = (tokens: HighlightToken[] | HighlightToken[][]): HighlightToken[][] => {
  if (!tokens.length) return [[]]

  // 检查是否已经是二维数组（shiki 3.x codeToTokens 的返回格式）
  if (Array.isArray(tokens[0])) {
    return tokens as HighlightToken[][]
  }

  // 处理一维数组（shiki-stream 的格式）
  const lines: HighlightToken[][] = [[]]
  let currentLine = lines[0]

  const startNewLine = () => {
    currentLine = []
    lines.push(currentLine)
  }

  ;(tokens as HighlightToken[]).forEach((token) => {
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
    segments.forEach((segment: string, index: number) => {
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
  const streaming = ref<StreamingHighlightResult>()
  const isLoading = ref(false)
  const error = ref<Error | null>(null)

  let tokenizer: any | null = null
  let previousText = ''
  let highlighter: any | null = null
  let currentUsedLang = ''
  let lastRequestedLang = ''

  const effectiveTheme = computed(() => {
    const theme = typeof options.theme === 'object' && 'value' in options.theme ? options.theme.value : options.theme
    return theme || 'slack-dark'
  })

  const effectiveLanguage = computed(() => {
    const lang = typeof options.language === 'object' && 'value' in options.language ? options.language.value : options.language
    return lang || 'text'
  })

  const lines = computed(() => streaming.value?.lines || [[]])
  const preStyle = computed(() => streaming.value?.preStyle)

  const updateTokens = async (nextText: string, forceReset = false) => {
    // 当有 tokenizer 时使用流式处理
    if (tokenizer) {
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
        // 静默失败，降级为纯文本
        error.value = err as Error
      }
    } else if (highlighter) {
      // 当没有 tokenizer 但有 highlighter 时，使用非流式方式高亮
      // 这发生在 shiki 可用但 shiki-stream 不可用时
      try {
        const currentLang = currentUsedLang || 'plaintext'
        const currentTheme = effectiveTheme.value
        const tokens = highlighter.codeToTokens(nextText, {
          lang: currentLang,
          theme: currentTheme,
        })

        // shiki 3.x 的 codeToTokens 返回一个对象，包含 tokens、fg、bg 等属性
        // 需要从返回对象中提取 tokens 数组
        const tokensArray = (tokens as any).tokens || tokens

        streaming.value = {
          colorReplacements: options.colorReplacements,
          lines: tokensToLineTokens(tokensArray),
          preStyle: streaming.value?.preStyle,
        }
      } catch (err) {
        // 静默降级为纯文本
        streaming.value = {
          colorReplacements: options.colorReplacements,
          lines: [[{ content: nextText }]],
          preStyle: streaming.value?.preStyle,
        }
      }
    }
  }

  const initHighlighter = async () => {
    isLoading.value = true
    error.value = null

    let currentLang = effectiveLanguage.value
    const currentTheme = effectiveTheme.value
    const cacheKey = getHighlighterCacheKey(currentTheme)

    try {
      const mod = await loadShiki()
      if (!mod) {
        // shiki 完全不可用，降级为纯文本
        streaming.value = {
          colorReplacements: options.colorReplacements,
          lines: [[{ content: text.value }]],
          preStyle: undefined,
        }
        showShikiHint()
        showShikiStreamHint()
        return
      }

      // 检查缓存，如果已有相同主题的 highlighter，直接复用
      // 这避免了 Shiki 单例警告并提高了性能
      if (!highlighterCache.has(cacheKey)) {
        highlighter = await mod.createHighlighter({
          themes: [currentTheme],
          langs: [],  // 将动态加载语言
        })
        highlighterCache.set(cacheKey, highlighter)
      } else {
        highlighter = highlighterCache.get(cacheKey)
      }

      lastRequestedLang = currentLang

      // 尝试加载请求的语言，失败则降级为纯文本
      try {
        await highlighter.loadLanguage(currentLang as any)
        currentUsedLang = currentLang
      } catch {
        currentLang = 'plaintext'
        currentUsedLang = 'plaintext'
      }

      // 动态加载 shiki-stream
      const shikiStreamMod = await loadShikiStream()
      if (shikiStreamMod) {
        tokenizer = new shikiStreamMod.ShikiStreamTokenizer({
          highlighter: highlighter,
          lang: currentLang,
          theme: currentTheme,
        })
      } else {
        // shiki 可用但 shiki-stream 不可用
        showShikiStreamHint()
      }

      previousText = ''

      const themeInfo = highlighter.getTheme(currentTheme)
      const preStyleValue = createPreStyle(themeInfo?.bg, themeInfo?.fg)

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
      // 静默降级
      streaming.value = {
        colorReplacements: options.colorReplacements,
        lines: [[{ content: text.value }]],
        preStyle: undefined,
      }
    } finally {
      isLoading.value = false
    }
  }

  watch(
    () => [effectiveLanguage.value, effectiveTheme.value],
    async ([newLang]) => {
      const requestedLang = newLang as string

      if (
        highlighter &&
        currentUsedLang === 'plaintext' &&
        requestedLang !== lastRequestedLang &&
        requestedLang !== 'plaintext'
      ) {
        try {
          await highlighter.loadLanguage(requestedLang as any)
          initHighlighter()
          return
        } catch {
          lastRequestedLang = requestedLang
          return
        }
      }

      initHighlighter()
    },
    { immediate: true },
  )

  watch(text, async (newText) => {
    const requestedLang = effectiveLanguage.value
    if (
      highlighter &&
      currentUsedLang === 'plaintext' &&
      requestedLang !== lastRequestedLang &&
      requestedLang !== 'plaintext'
    ) {
      try {
        await highlighter.loadLanguage(requestedLang as any)
        await initHighlighter()
        return
      } catch {
        lastRequestedLang = requestedLang
      }
    }

    if (tokenizer || highlighter) {
      // 当有 tokenizer 或 highlighter 时都调用 updateTokens
      // updateTokens 内部会处理两种情况
      updateTokens(newText)
    } else {
      // 两者都没有时降级为纯文本
      streaming.value = {
        colorReplacements: options.colorReplacements,
        lines: [[{ content: newText }]],
        preStyle: streaming.value?.preStyle,
      }
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
