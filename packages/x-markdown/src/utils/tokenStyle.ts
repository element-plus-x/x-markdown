import type { CSSProperties } from 'vue'
import type { ThemedToken } from 'shiki'

type TokenStyleRecord = Record<string, string | number>

const FontStyle = {
  Italic: 1,
  Bold: 2,
  Underline: 4,
  Strikethrough: 8,
} as const

function getTokenStyleObject(token: ThemedToken): TokenStyleRecord {
  const styles: TokenStyleRecord = {}
  if (token.color) styles.color = token.color
  if (token.bgColor) styles['background-color'] = token.bgColor
  if (token.fontStyle) {
    if (token.fontStyle & FontStyle.Italic) styles['font-style'] = 'italic'
    if (token.fontStyle & FontStyle.Bold) styles['font-weight'] = 'bold'
    const decorations: string[] = []
    if (token.fontStyle & FontStyle.Underline) decorations.push('underline')
    if (token.fontStyle & FontStyle.Strikethrough) decorations.push('line-through')
    if (decorations.length) styles['text-decoration'] = decorations.join(' ')
  }
  return styles
}

const normalizeStyleKeys = (style: TokenStyleRecord): CSSProperties => {
  const normalized: CSSProperties = {}
  Object.entries(style).forEach(([key, value]) => {
    const camelKey = key.replace(/-([a-z])/g, (_, char) => char.toUpperCase())
    ;(normalized as TokenStyleRecord)[camelKey] = value
  })
  return normalized
}

const applyColorReplacement = (color: string, replacements?: Record<string, string>) => {
  if (!replacements) return color
  return replacements[color.toLowerCase()] || color
}

export const getTokenStyle = (token: ThemedToken, colorReplacements?: Record<string, string>): CSSProperties => {
  const baseStyle = normalizeStyleKeys(token.htmlStyle || getTokenStyleObject(token))

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
