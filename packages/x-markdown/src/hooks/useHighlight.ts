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

const SHIKI_PKG = 'shiki'
const SHIKI_STREAM_PKG = 'shiki-stream'

let shikiModulePromise: Promise<any | null> | null = null
let shikiStreamModulePromise: Promise<any | null> | null = null
let hasShownDependencyHint = false

const showDependencyHint = () => {
  if (hasShownDependencyHint) return
  hasShownDependencyHint = true

  console.log(
    '%c[x-markdown]%c 代码高亮功能已降级为纯文本模式',
    'font-weight: bold; color: #0066cc;',
    'color: #666;'
  )
  console.log(
    '%c如需语法高亮功能，请安装以下依赖：',
    'color: #666; font-weight: bold;'
  )
  console.log(
    '%c  pnpm add shiki shiki-stream',
    'color: #00aa00; font-family: monospace;'
  )
  console.log(
    '%c安装后请重启开发服务器',
    'color: #999; font-size: 12px;'
  )
}

const loadShiki = () => {
  if (!shikiModulePromise) {
    shikiModulePromise = (Function(`return import('${SHIKI_PKG}')`)())
      .catch(() => {
        showDependencyHint()
        return null
      })
  }
  return shikiModulePromise
}

const loadShikiStream = () => {
  if (!shikiStreamModulePromise) {
    shikiStreamModulePromise = (Function(`return import('${SHIKI_STREAM_PKG}')`)())
      .catch(() => {
        showDependencyHint()
        return null
      })
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
      console.error('[x-markdown] Streaming highlighting failed:', err)
      error.value = err as Error
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
        console.warn('[x-markdown] Shiki not available, falling back to plain text mode')
        streaming.value = {
          colorReplacements: options.colorReplacements,
          lines: [[{ content: text.value }]],
          preStyle: undefined,
        }
        return
      }

      highlighter = await mod.getSingletonHighlighter({
        langs: [],
        themes: [currentTheme],
      })

      lastRequestedLang = currentLang

      try {
        await highlighter.loadLanguage(currentLang as any)
        currentUsedLang = currentLang
      } catch {
        console.warn(`[x-markdown] Failed to load language: ${currentLang}, falling back to plaintext`)
        currentLang = 'plaintext'
        currentUsedLang = 'plaintext'
      }

      const StreamMod = await loadShikiStream()
      if (!StreamMod) {
        console.warn('[x-markdown] shiki-stream not available, using non-streaming mode')
        const tokens = highlighter.codeToThemedTokens(text.value, currentLang, currentTheme)
        streaming.value = {
          colorReplacements: options.colorReplacements,
          lines: tokensToLineTokens(tokens),
          preStyle: createPreStyle(
            highlighter.getTheme(currentTheme)?.bg,
            highlighter.getTheme(currentTheme)?.fg
          ),
        }
        return
      }

      const ShikiStreamTokenizer = StreamMod.ShikiStreamTokenizer || StreamMod.default
      tokenizer = new ShikiStreamTokenizer({
        highlighter: highlighter,
        lang: currentLang,
        theme: currentTheme,
      })

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
      console.error('[x-markdown] Highlighter initialization failed:', err)
      error.value = err as Error
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

    if (tokenizer) {
      updateTokens(newText)
    } else if (!highlighter) {
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
