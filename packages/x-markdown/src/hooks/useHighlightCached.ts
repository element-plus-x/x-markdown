import { ref, watch, onUnmounted, computed, isRef, toValue, type Ref, type MaybeRef, type CSSProperties } from 'vue'
import type { BuiltinTheme, ThemedToken } from 'shiki'
import { ShikiStreamTokenizer, ShikiStreamTokenizerOptions } from 'shiki-stream'
import { getHighlighterCached, loadLanguageCached } from '../utils/shiki-cache'

interface StreamingHighlightResult {
  colorReplacements?: Record<string, string>
  lines: ThemedToken[][]
  preStyle?: CSSProperties
}

interface UseHighlightOptions {
  language: MaybeRef<string>
  theme?: BuiltinTheme | Ref<BuiltinTheme>
  colorReplacements?: Record<string, string>
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
        currentLine.push({ ...token, content: segment })
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
  return { backgroundColor: bg, color: fg }
}

const tryLoadLanguage = async (theme: BuiltinTheme, lang: string): Promise<boolean> => {
  try {
    return await loadLanguageCached(theme, lang)
  } catch {
    return false
  }
}

export function useHighlight(text: Ref<string>, options: UseHighlightOptions) {
  const streaming = ref<StreamingHighlightResult>()
  const isLoading = ref(false)
  const error = ref<Error | null>(null)

  let tokenizer: ShikiStreamTokenizer | null = null
  let previousText = ''
  let highlighter: any | null = null

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
      console.error('Streaming highlighting failed:', err)
      error.value = err as Error
    }
  }

  const initHighlighter = async () => {
    isLoading.value = true
    error.value = null

    let currentLang = effectiveLanguage.value
    const currentTheme = effectiveTheme.value

    try {
      highlighter = await getHighlighterCached(currentTheme)
      if (!highlighter) {
        throw new Error('Shiki highlighter is not available')
      }

      const loaded = await tryLoadLanguage(currentTheme, currentLang)
      if (!loaded) {
        currentLang = 'plaintext'
      }

      tokenizer = new ShikiStreamTokenizer({
        highlighter: highlighter as unknown as ShikiStreamTokenizerOptions['highlighter'],
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
      console.error('Streaming highlighter initialization failed:', err)
      error.value = err as Error
    } finally {
      isLoading.value = false
    }
  }

  watch(
    () => [effectiveLanguage.value, effectiveTheme.value],
    async () => {
      initHighlighter()
    },
    { immediate: true },
  )

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
