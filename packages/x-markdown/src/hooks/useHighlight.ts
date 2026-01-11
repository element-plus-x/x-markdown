import { ref, watch, onUnmounted, computed, isRef, toValue, type Ref, type MaybeRef, type CSSProperties } from 'vue'

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


const showShikiHint = () => {
  if (hasShownShikiHint) return
  hasShownShikiHint = true

  console.log(
    '%c[x-markdown]%c Shiki 代码高亮库未安装，已降级为纯文本模式',
    'font-weight: bold; color: #0066cc;',
    'color: #666;'
  )
  console.log(
    '%c如需语法高亮功能，请安装：',
    'color: #666; font-weight: bold;'
  )
  console.log(
    '%c  pnpm add shiki',
    'color: #00aa00; font-family: monospace;'
  )
  console.log(
    '%c安装后请重启开发服务器',
    'color: #999; font-size: 12px;'
  )
}

const showShikiStreamHint = () => {
  if (hasShownShikiStreamHint) return
  hasShownShikiStreamHint = true

  console.log(
    '%c[x-markdown]%c shiki-stream 未安装，已降级为非流式高亮',
    'font-weight: bold; color: #0066cc;',
    'color: #666;'
  )
  console.log(
    '%c如需流式代码高亮功能（推荐用于 AI 场景），请安装：',
    'color: #666; font-weight: bold;'
  )
  console.log(
    '%c  pnpm add shiki-stream',
    'color: #00aa00; font-family: monospace;'
  )
  console.log(
    '%c安装后请重启开发服务器',
    'color: #999; font-size: 12px;'
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

const tokensToLineTokens = (tokens: HighlightToken[]): HighlightToken[][] => {
  if (!tokens.length) return [[]]

  const lines: HighlightToken[][] = [[]]
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
  const streaming = ref<StreamingHighlightResult>()
  const isLoading = ref(false)
  const error = ref<Error | null>(null)

  let tokenizer: any | null = null
  let previousText = ''
  let highlighter: any | null = null
  let currentUsedLang = ''
  let lastRequestedLang = ''

  const effectiveTheme = computed(() => {
    const theme = isRef(options.theme) ? options.theme.value : options.theme
    return theme || 'slack-dark'
  })

  const effectiveLanguage = computed(() => {
    return toValue(options.language) || 'text'
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
        console.error('[x-markdown] Streaming highlighting failed:', err)
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

        streaming.value = {
          colorReplacements: options.colorReplacements,
          lines: tokensToLineTokens(tokens),
          preStyle: streaming.value?.preStyle,
        }
      } catch (err) {
        console.error('[x-markdown] Direct highlighting failed:', err)
        // 降级为纯文本
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

    try {
      const mod = await loadShiki()
      if (!mod) {
        // shiki 完全不可用
        streaming.value = {
          colorReplacements: options.colorReplacements,
          lines: [[{ content: text.value }]],
          preStyle: undefined,
        }
        showShikiHint()

        // 即使 shiki 不可用，也检查 shiki-stream 并显示提示
        const shikiStreamMod = await loadShikiStream()
        if (!shikiStreamMod) {
          // shiki 和 shiki-stream 都不可用
          showShikiStreamHint()
        }
        return
      }

      // shiki 3.x API
      highlighter = await mod.createHighlighter({
        themes: [currentTheme],
        langs: [],  // 将动态加载语言
      })

      lastRequestedLang = currentLang

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
