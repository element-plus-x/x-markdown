import type { CSSProperties } from 'vue'
import type { ThemedToken } from 'shiki'
import { getTokenStyleObject } from 'shiki'

type TokenStyleRecord = Record<string, string | number>

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
