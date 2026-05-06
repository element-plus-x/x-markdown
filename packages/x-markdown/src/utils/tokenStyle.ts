import type { CSSProperties } from 'vue'
import type { ThemedToken } from 'shiki'

type TokenStyleRecord = Record<string, string | number>

const fontStyleFlag = {
  italic: 1,
  bold: 2,
  underline: 4,
  strikethrough: 8,
} as const

const normalizeStyleKeys = (style: TokenStyleRecord): CSSProperties => {
  const normalized: CSSProperties = {}

  Object.entries(style).forEach(([key, value]) => {
    const camelKey = key.replace(/-([a-z])/g, (_, char) => char.toUpperCase())
    ;(normalized as TokenStyleRecord)[camelKey] = value
  })

  return normalized
}

const resolveTokenStyle = (token: ThemedToken): TokenStyleRecord => {
  if (token.htmlStyle) return token.htmlStyle

  const style: TokenStyleRecord = {}

  if (token.color) {
    style.color = token.color
  }
  if (token.bgColor) {
    style['background-color'] = token.bgColor
  }

  if (token.fontStyle) {
    if (token.fontStyle & fontStyleFlag.italic) {
      style['font-style'] = 'italic'
    }
    if (token.fontStyle & fontStyleFlag.bold) {
      style['font-weight'] = 'bold'
    }

    const decorations: string[] = []
    if (token.fontStyle & fontStyleFlag.underline) {
      decorations.push('underline')
    }
    if (token.fontStyle & fontStyleFlag.strikethrough) {
      decorations.push('line-through')
    }
    if (decorations.length) {
      style['text-decoration'] = decorations.join(' ')
    }
  }

  return style
}

const applyColorReplacement = (color: string, replacements?: Record<string, string>) => {
  if (!replacements) return color
  return replacements[color.toLowerCase()] || color
}

export const getTokenStyle = (token: ThemedToken, colorReplacements?: Record<string, string>): CSSProperties => {
  const baseStyle = normalizeStyleKeys(resolveTokenStyle(token))

  if (!colorReplacements) return baseStyle

  const style = { ...baseStyle }

  if (style.color && typeof style.color === 'string') {
    style.color = applyColorReplacement(style.color, colorReplacements)
  }
  if (style.backgroundColor && typeof style.backgroundColor === 'string') {
    style.backgroundColor = applyColorReplacement(style.backgroundColor, colorReplacements)
  }

  return style
}
